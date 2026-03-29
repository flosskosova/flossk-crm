namespace FlosskMS.Business.Configuration;

public class FileUploadSettings
{
    public string UploadPath { get; set; } = "uploads";
    public long MaxFileSizeBytes { get; set; } = 10 * 1024 * 1024; // 10 MB default
    public string[] AllowedExtensions { get; set; } = [".jpg", ".jpeg", ".png", ".gif", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".pptx", ".txt"];
}

public class ClamAvSettings
{
    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 3310;
    public int TimeoutMs { get; set; } = 30000;
}
