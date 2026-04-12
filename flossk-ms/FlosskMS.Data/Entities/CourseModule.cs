namespace FlosskMS.Data.Entities;

public class CourseModule
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Order { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Guid CourseId { get; set; }
    public Course Course { get; set; } = null!;

    public ICollection<CourseResource> Resources { get; set; } = [];
    public ICollection<CourseReview> Reviews { get; set; } = [];
}
