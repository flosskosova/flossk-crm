using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.Business.Services;

public interface ICertificateService
{
    Task<IActionResult> IssueCertificatesAsync(DTOs.IssueCertificateDto request, string issuedByUserId);
    Task<IActionResult> GetCertificatesAsync(int page = 1, int pageSize = 10);
    Task<IActionResult> GetCertificateByIdAsync(Guid id);
    Task<IActionResult> DownloadCertificateAsync(Guid id);
    Task<IActionResult> RevokeCertificateAsync(Guid id, string userId);
    Task<IActionResult> DeleteCertificateAsync(Guid id, string userId);

    Task<IActionResult> UploadTemplateAsync(IFormFile file, string name, string userId);
    Task<IActionResult> GetTemplatesAsync();
    Task<IActionResult> DeleteTemplateAsync(Guid id, string userId);

    Task<IActionResult> SaveLayoutAsync(Guid templateId, DTOs.SaveLayoutDto request);
    Task<IActionResult> GetLayoutAsync(Guid templateId);
}
