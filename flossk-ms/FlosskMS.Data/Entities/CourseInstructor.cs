namespace FlosskMS.Data.Entities;

/// <summary>Join table linking a Course to its instructors (existing ApplicationUsers).</summary>
public class CourseInstructor
{
    public Guid CourseId { get; set; }
    public Course Course { get; set; } = null!;

    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;

    public string Role { get; set; } = "Instructor";
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
}
