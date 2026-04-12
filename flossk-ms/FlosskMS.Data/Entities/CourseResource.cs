namespace FlosskMS.Data.Entities;

public class CourseResource
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ResourceType Type { get; set; } = ResourceType.Other;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Guid CourseModuleId { get; set; }
    public CourseModule CourseModule { get; set; } = null!;
}
