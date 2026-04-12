namespace FlosskMS.Data.Entities;

/// <summary>A review/feedback submitted by a course trainee for a specific module.</summary>
public class CourseReview
{
    public Guid Id { get; set; }
    public string Description { get; set; } = string.Empty;

    /// <summary>Nullable — anonymous submissions are allowed.</summary>
    public string? SubmitterName { get; set; }
    public string? SubmitterEmail { get; set; }

    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    public Guid CourseModuleId { get; set; }
    public CourseModule CourseModule { get; set; } = null!;
}
