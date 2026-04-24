namespace FlosskMS.Data.Entities;

public class UploadedFile
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public FileType FileType { get; set; } = FileType.Unknown;
    public string? UserId { get; set; }
    public ApplicationUser? User { get; set; }
    public string? CreatedByUserId { get; set; }
    public ApplicationUser? CreatedByUser { get; set; }
    public bool IsScanned { get; set; }
    public bool IsSafe { get; set; }
    public string? ScanResult { get; set; }
}
