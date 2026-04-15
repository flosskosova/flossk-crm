namespace FlosskMS.Data.Entities;

public class CourseResource
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public List<string> Urls { get; set; } = [];
    public string? Description { get; set; }
    public ResourceType Type { get; set; } = ResourceType.Other;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Guid CourseModuleId { get; set; }
    public CourseModule CourseModule { get; set; } = null!;
    public ICollection<CourseResourceFile> Files { get; set; } = new List<CourseResourceFile>();
}
