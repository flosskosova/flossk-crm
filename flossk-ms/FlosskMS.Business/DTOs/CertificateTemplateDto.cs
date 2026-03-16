namespace FlosskMS.Business.DTOs;

public class CertificateTemplateDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public DateTime UploadedAt { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    /// <summary>Relative path served as a static file, e.g. /uploads/cert-templates/uuid.png</summary>
    public string PreviewPath { get; set; } = string.Empty;
}
