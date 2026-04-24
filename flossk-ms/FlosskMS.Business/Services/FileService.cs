using FlosskMS.Business.Configuration;
using FlosskMS.Business.DTOs;
using FlosskMS.Data;
using FlosskMS.Data.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FlosskMS.Business.Services;

public class FileService : IFileService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IClamAvService _clamAvService;
    private readonly FileUploadSettings _settings;
    private readonly ILogger<FileService> _logger;

    public FileService(
        ApplicationDbContext dbContext,
        IClamAvService clamAvService,
        IOptions<FileUploadSettings> settings,
        ILogger<FileService> logger)
    {
        _dbContext = dbContext;
        _clamAvService = clamAvService;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task<FileUploadResultDto> UploadFileAsync(IFormFile file, string userId, CancellationToken cancellationToken = default)
    {
        var result = new FileUploadResultDto();

        try
        {
            // Validate file
            var validationError = ValidateFile(file);
            if (validationError != null)
            {
                result.Error = validationError;
                return result;
            }

            // Read file into memory for scanning
            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream, cancellationToken);
            var fileBytes = memoryStream.ToArray();

            // Scan with ClamAV
            var scanResult = await _clamAvService.ScanFileAsync(fileBytes, cancellationToken);
            
            if (!scanResult.IsScanned)
            {
                _logger.LogWarning("ClamAV scan failed: {Error}. Rejecting file upload.", scanResult.Error);
                result.Error = $"Virus scan failed: {scanResult.Error}. File upload rejected for security.";
                return result;
            }

            if (!scanResult.IsSafe)
            {
                _logger.LogWarning("Malware detected in uploaded file: {VirusName}", scanResult.VirusName);
                result.Error = $"Malware detected: {scanResult.VirusName}. File rejected.";
                result.IsSafe = false;
                result.ScanResult = scanResult.RawResult;
                return result;
            }

            // Generate unique filename
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
            
            // Ensure upload directory exists
            var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), _settings.UploadPath);
            Directory.CreateDirectory(uploadPath);
            
            var filePath = Path.Combine(uploadPath, uniqueFileName);

            // Save file to disk
            await System.IO.File.WriteAllBytesAsync(filePath, fileBytes, cancellationToken);

            // Create database record
            var uploadedFile = new UploadedFile
            {
                Id = Guid.NewGuid(),
                FileName = uniqueFileName,
                ContentType = file.ContentType,
                FileSize = file.Length,
                FilePath = $"{_settings.UploadPath}/{uniqueFileName}",
                UploadedAt = DateTime.UtcNow,
                CreatedByUserId = userId,
                IsScanned = true,
                IsSafe = true,
                ScanResult = scanResult.RawResult
            };

            _dbContext.UploadedFiles.Add(uploadedFile);
            await _dbContext.SaveChangesAsync(cancellationToken);

            result.Success = true;
            result.FileId = uploadedFile.Id;
            result.FileName = uploadedFile.FileName;
            result.FileSize = uploadedFile.FileSize;
            result.ContentType = uploadedFile.ContentType;
            result.UploadedAt = uploadedFile.UploadedAt;
            result.FilePath = uploadedFile.FilePath;
            result.IsSafe = true;
            result.ScanResult = "Clean";

            _logger.LogInformation("File uploaded successfully: {FileName} by user {UserId}", file.FileName, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file: {FileName}", file.FileName);
            result.Error = "An error occurred while uploading the file.";
        }

        return result;
    }

    public async Task<MultipleFileUploadResultDto> UploadFilesAsync(IEnumerable<IFormFile> files, string userId, CancellationToken cancellationToken = default)
    {
        var result = new MultipleFileUploadResultDto();
        var fileList = files.ToList();
        result.TotalFiles = fileList.Count;

        foreach (var file in fileList)
        {
            var uploadResult = await UploadFileAsync(file, userId, cancellationToken);
            result.Results.Add(uploadResult);

            if (uploadResult.Success)
            {
                result.SuccessfulUploads++;
            }
            else
            {
                result.FailedUploads++;
                result.Errors.Add($"{file.FileName}: {uploadResult.Error}");
            }
        }

        result.Success = result.FailedUploads == 0;
        return result;
    }

    public async Task<FileDto?> GetFileByIdAsync(Guid fileId, CancellationToken cancellationToken = default)
    {
        var file = await _dbContext.UploadedFiles
            .Include(f => f.CreatedByUser)
            .FirstOrDefaultAsync(f => f.Id == fileId, cancellationToken);

        if (file == null) return null;

        return MapToDto(file);
    }

    public async Task<IEnumerable<FileDto>> GetFilesByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        var files = await _dbContext.UploadedFiles
            .Include(f => f.CreatedByUser)
            .Where(f => f.CreatedByUserId == userId)
            .OrderByDescending(f => f.UploadedAt)
            .ToListAsync(cancellationToken);

        return files.Select(MapToDto);
    }

    public async Task<IEnumerable<FileDto>> GetAllFilesAsync(CancellationToken cancellationToken = default)
    {
        var files = await _dbContext.UploadedFiles
            .Include(f => f.CreatedByUser)
            .OrderByDescending(f => f.UploadedAt)
            .ToListAsync(cancellationToken);

        return files.Select(MapToDto);
    }

    public async Task<(Stream? FileStream, string? ContentType, string? FileName)> DownloadFileAsync(Guid fileId, CancellationToken cancellationToken = default)
    {
        var file = await _dbContext.UploadedFiles
            .FirstOrDefaultAsync(f => f.Id == fileId, cancellationToken);

        if (file == null || !System.IO.File.Exists(file.FilePath))
        {
            return (null, null, null);
        }

        var stream = new FileStream(file.FilePath, System.IO.FileMode.Open, System.IO.FileAccess.Read);
        return (stream, file.ContentType, file.FileName);
    }

    public async Task<bool> DeleteFileAsync(Guid fileId, string userId, bool isAdmin = false, CancellationToken cancellationToken = default)
    {
        var file = await _dbContext.UploadedFiles
            .FirstOrDefaultAsync(f => f.Id == fileId, cancellationToken);

        if (file == null)
        {
            return false;
        }

        // Only creator or admin can delete
        if (!isAdmin && file.CreatedByUserId != userId)
        {
            return false;
        }

        // Delete physical file
        if (File.Exists(file.FilePath))
        {
            File.Delete(file.FilePath);
        }

        // Delete database record
        _dbContext.UploadedFiles.Remove(file);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("File deleted: {FileId} by user {UserId}", fileId, userId);
        return true;
    }

    private string? ValidateFile(IFormFile file)
    {
        if (file.Length == 0)
        {
            return "File is empty.";
        }

        if (file.Length > _settings.MaxFileSizeBytes)
        {
            return $"File size exceeds the maximum allowed size of {_settings.MaxFileSizeBytes / (1024 * 1024)} MB.";
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!_settings.AllowedExtensions.Contains(extension))
        {
            return $"File extension '{extension}' is not allowed. Allowed extensions: {string.Join(", ", _settings.AllowedExtensions)}";
        }

        return null;
    }

    private static FileDto MapToDto(UploadedFile file)
    {
        return new FileDto
        {
            Id = file.Id,
            FileName = file.FileName,
            ContentType = file.ContentType,
            FileSize = file.FileSize,
            UploadedAt = file.UploadedAt,
            CreatedByUserId = file.CreatedByUserId,
            CreatedByUserName = file.CreatedByUser?.Email,
            IsSafe = file.IsSafe
        };
    }
}
