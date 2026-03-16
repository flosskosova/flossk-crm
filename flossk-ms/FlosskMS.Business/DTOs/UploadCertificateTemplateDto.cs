using Microsoft.AspNetCore.Http;

namespace FlosskMS.Business.DTOs;

public class UploadCertificateTemplateDto
{
    public IFormFile File { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
}
