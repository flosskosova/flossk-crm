namespace FlosskMS.Data.Entities;

public class CourseSession
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public TimeOnly Hour { get; set; }

    public CourseSessionType Type { get; set; } = CourseSessionType.InPerson;

    /// <summary>Physical address when Type is InPerson, or meeting link when Type is Online.</summary>
    public string Location { get; set; } = string.Empty;

    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Guid CourseId { get; set; }
    public Course Course { get; set; } = null!;
}
