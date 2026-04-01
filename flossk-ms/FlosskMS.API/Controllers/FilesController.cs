using System.Security.Claims;
using FlosskMS.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FilesController : ControllerBase
{
    private readonly IFileService _fileService;

    public FilesController(IFileService fileService)
    {
        _fileService = fileService;
    }

    /// <summary>
    /// Upload a single file
    /// </summary>
    [HttpPost("upload")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB
    public async Task<IActionResult> UploadFile(IFormFile file, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var result = await _fileService.UploadFileAsync(file, userId, cancellationToken);
        
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Upload multiple files
    /// </summary>
    [HttpPost("upload-multiple")]
    [RequestSizeLimit(50 * 1024 * 1024)] // 50 MB total
    public async Task<IActionResult> UploadMultipleFiles(List<IFormFile> files, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        if (files.Count == 0)
        {
            return BadRequest(new { Error = "No files provided." });
        }

        var result = await _fileService.UploadFilesAsync(files, userId, cancellationToken);
        
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Get file by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetFile(Guid id, CancellationToken cancellationToken)
    {
        var file = await _fileService.GetFileByIdAsync(id, cancellationToken);
        
        if (file == null)
        {
            return NotFound();
        }

        return Ok(file);
    }

    /// <summary>
    /// Get all files uploaded by the current user
    /// </summary>
    [HttpGet("my-files")]
    public async Task<IActionResult> GetMyFiles(CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var files = await _fileService.GetFilesByUserIdAsync(userId, cancellationToken);
        return Ok(files);
    }

    /// <summary>
    /// Get all files (Admin only)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllFiles(CancellationToken cancellationToken)
    {
        var files = await _fileService.GetAllFilesAsync(cancellationToken);
        return Ok(files);
    }

    /// <summary>
    /// Download a file
    /// </summary>
    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> DownloadFile(Guid id, CancellationToken cancellationToken)
    {
        var (stream, contentType, fileName) = await _fileService.DownloadFileAsync(id, cancellationToken);
        
        if (stream == null)
        {
            return NotFound();
        }

        return File(stream, contentType ?? "application/octet-stream", fileName);
    }

    /// <summary>
    /// View a file inline (used for embedded images/files in rich-text descriptions)
    /// </summary>
    [HttpGet("{id:guid}/view")]
    public async Task<IActionResult> ViewFile(Guid id, CancellationToken cancellationToken)
    {
        var (stream, contentType, _) = await _fileService.DownloadFileAsync(id, cancellationToken);

        if (stream == null)
        {
            return NotFound();
        }

        Response.Headers.Append("Content-Disposition", "inline");
        return File(stream, contentType ?? "application/octet-stream");
    }

    /// <summary>
    /// Delete a file
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteFile(Guid id, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var isAdmin = User.IsInRole("Admin");
        var success = await _fileService.DeleteFileAsync(id, userId, isAdmin, cancellationToken);
        
        if (!success)
        {
            return NotFound();
        }

        return NoContent();
    }
}
