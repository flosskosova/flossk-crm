using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.Business.Services;

public interface ICertificateService
{
    Task<IActionResult> IssueCertificatesAsync(DTOs.IssueCertificateDto request, string issuedByUserId);
    Task<IActionResult> GetCertificatesAsync(int page = 1, int pageSize = 10);
    Task<IActionResult> GetUserCertificatesAsync(string userId);
    Task<IActionResult> GetCertificateByIdAsync(Guid id);
    Task<IActionResult> DownloadCertificateAsync(Guid id);
    Task<IActionResult> GetCertificateImageAsync(Guid id);
    Task<IActionResult> RevokeCertificateAsync(Guid id, string userId);
    Task<IActionResult> DeleteCertificateAsync(Guid id, string userId);
    Task<IActionResult> DeleteAllCertificatesAsync();

    Task<IActionResult> UploadExternalCertificateAsync(DTOs.UploadExternalCertificateDto request, string uploadedByUserId);

    Task<IActionResult> UploadTemplateAsync(IFormFile file, string name, string userId);
    Task<IActionResult> GetTemplatesAsync();
    Task<IActionResult> DeleteTemplateAsync(Guid id, string userId);

    Task<IActionResult> SaveLayoutAsync(Guid templateId, DTOs.SaveLayoutDto request);
    Task<IActionResult> GetLayoutAsync(Guid templateId);

    /// <summary>Public endpoint — no authentication required. Looks up a certificate by its verification token and returns its public metadata + HMAC signature.</summary>
    Task<IActionResult> VerifyCertificateAsync(string token);
}
