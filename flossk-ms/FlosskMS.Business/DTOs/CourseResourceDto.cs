namespace FlosskMS.Business.DTOs;

public class CourseResourceDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public List<string> Urls { get; set; } = [];
    public List<CourseResourceFileDto> Files { get; set; } = [];
    public string? Description { get; set; }
    public string Type { get; set; } = string.Empty;
}

public class CourseResourceFileDto
{
    public Guid Id { get; set; }
    public Guid FileId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string FilePath { get; set; } = string.Empty;
}
