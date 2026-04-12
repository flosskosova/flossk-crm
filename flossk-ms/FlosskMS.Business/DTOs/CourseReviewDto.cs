namespace FlosskMS.Business.DTOs;

public class CourseReviewDto
{
    public Guid Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? SubmitterName { get; set; }
    public string? SubmitterEmail { get; set; }
    public DateTime SubmittedAt { get; set; }
}
