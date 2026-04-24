namespace FlosskMS.Business.DTOs;

public class FileUploadResultDto
{
    public bool Success { get; set; }
    public Guid? FileId { get; set; }
    public string? FileName { get; set; }
    public long? FileSize { get; set; }
    public string? ContentType { get; set; }
    public DateTime? UploadedAt { get; set; }
    public string? Error { get; set; }
    public bool? IsSafe { get; set; }
    public string? ScanResult { get; set; }
    public string? FilePath { get; set; }
}

public class MultipleFileUploadResultDto
{
    public bool Success { get; set; }
    public int TotalFiles { get; set; }
    public int SuccessfulUploads { get; set; }
    public int FailedUploads { get; set; }
    public List<FileUploadResultDto> Results { get; set; } = [];
    public List<string> Errors { get; set; } = [];
}

public class FileDto
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public DateTime UploadedAt { get; set; }
    public string CreatedByUserId { get; set; } = string.Empty;
    public string? CreatedByUserName { get; set; }
    public bool IsSafe { get; set; }
}
