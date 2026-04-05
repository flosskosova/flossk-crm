using System.Security.Claims;
using FlosskMS.Business.DTOs;
using FlosskMS.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CertificatesController(ICertificateService certificateService) : ControllerBase
{
    private readonly ICertificateService _certificateService = certificateService;

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> IssueCertificates([FromBody] IssueCertificateDto request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        return await _certificateService.IssueCertificatesAsync(request, userId);
    }

    [HttpGet]
    public async Task<IActionResult> GetCertificates(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        return await _certificateService.GetCertificatesAsync(page, pageSize);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetCertificateById(Guid id)
    {
        return await _certificateService.GetCertificateByIdAsync(id);
    }

    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> DownloadCertificate(Guid id)
    {
        return await _certificateService.DownloadCertificateAsync(id);
    }

    [HttpGet("{id:guid}/image")]
    public async Task<IActionResult> GetCertificateImage(Guid id)
        => await _certificateService.GetCertificateImageAsync(id);

    [AllowAnonymous]
    [HttpGet("verify/{token}")]
    public async Task<IActionResult> VerifyCertificate(string token)
        => await _certificateService.VerifyCertificateAsync(token);

    [Authorize(Roles = "Admin")]
    [HttpPatch("{id:guid}/revoke")]
    public async Task<IActionResult> RevokeCertificate(Guid id)    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        return await _certificateService.RevokeCertificateAsync(id, userId);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteCertificate(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        return await _certificateService.DeleteCertificateAsync(id, userId);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete]
    public async Task<IActionResult> DeleteAllCertificates()
    {
        return await _certificateService.DeleteAllCertificatesAsync();
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("upload-external")]
    [RequestSizeLimit(50 * 1024 * 1024)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadExternalCertificate([FromForm] UploadExternalCertificateDto request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        return await _certificateService.UploadExternalCertificateAsync(request, userId);
    }

    // ── Templates ────────────────────────────────────────────────────────────

    [Authorize(Roles = "Admin")]
    [HttpPost("templates")]
    [RequestSizeLimit(50 * 1024 * 1024)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadTemplate([FromForm] UploadCertificateTemplateDto request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        return await _certificateService.UploadTemplateAsync(request.File, request.Name, userId);
    }

    [HttpGet("templates")]
    public async Task<IActionResult> GetTemplates()
    {
        return await _certificateService.GetTemplatesAsync();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("templates/{id:guid}")]
    public async Task<IActionResult> DeleteTemplate(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        return await _certificateService.DeleteTemplateAsync(id, userId);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("templates/{id:guid}/layout")]
    public async Task<IActionResult> SaveLayout(Guid id, [FromBody] FlosskMS.Business.DTOs.SaveLayoutDto request)
        => await _certificateService.SaveLayoutAsync(id, request);

    [HttpGet("templates/{id:guid}/layout")]
    public async Task<IActionResult> GetLayout(Guid id)
        => await _certificateService.GetLayoutAsync(id);
}
