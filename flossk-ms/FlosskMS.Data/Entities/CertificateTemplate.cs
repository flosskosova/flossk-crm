namespace FlosskMS.Data.Entities;

public class CertificateTemplate
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public string CreatedByUserId { get; set; } = string.Empty;
    public ApplicationUser CreatedByUser { get; set; } = null!;

    public ICollection<CertificateTemplateField> Fields { get; set; } = [];
}
