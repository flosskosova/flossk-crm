using FlosskMS.Business.DTOs;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace FlosskMS.Business.Services;

public interface IFileService
{
    Task<FileUploadResultDto> UploadFileAsync(IFormFile file, ClaimsPrincipal currentUser, CancellationToken cancellationToken = default);
    Task<FileUploadResultDto> UploadFileAsync(IFormFile file, string userId, CancellationToken cancellationToken = default);
    Task<MultipleFileUploadResultDto> UploadFilesAsync(IEnumerable<IFormFile> files, ClaimsPrincipal currentUser, CancellationToken cancellationToken = default);
    Task<MultipleFileUploadResultDto> UploadFilesAsync(IEnumerable<IFormFile> files, string userId, CancellationToken cancellationToken = default);
    Task<FileDto?> GetFileByIdAsync(Guid fileId, CancellationToken cancellationToken = default);
    Task<IEnumerable<FileDto>> GetFilesByUserIdAsync(ClaimsPrincipal currentUser, CancellationToken cancellationToken = default);
    Task<IEnumerable<FileDto>> GetFilesByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task<IEnumerable<FileDto>> GetAllFilesAsync(CancellationToken cancellationToken = default);
    Task<(Stream? FileStream, string? ContentType, string? FileName)> DownloadFileAsync(Guid fileId, CancellationToken cancellationToken = default);
    Task<bool> DeleteFileAsync(Guid fileId, ClaimsPrincipal currentUser, CancellationToken cancellationToken = default);
    Task<bool> DeleteFileAsync(Guid fileId, string userId, bool isAdmin = false, CancellationToken cancellationToken = default);
}
