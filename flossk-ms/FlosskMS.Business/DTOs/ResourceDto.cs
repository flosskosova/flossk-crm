namespace FlosskMS.Business.DTOs;

public class ResourceDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public List<string> Urls { get; set; } = [];
    public string? Description { get; set; }
    public string Type { get; set; } = string.Empty;
    public Guid? ProjectId { get; set; }
    public Guid? ObjectiveId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedByUserId { get; set; }
    public string? CreatedByUserName { get; set; }
    public List<FileDto> Files { get; set; } = new();
}
