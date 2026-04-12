using System.ComponentModel.DataAnnotations;

namespace FlosskMS.Business.DTOs;

public class CreateCourseReviewDto
{
    [Required]
    [StringLength(2000, MinimumLength = 5)]
    public string Description { get; set; } = string.Empty;

    [StringLength(150)]
    public string? SubmitterName { get; set; }

    [EmailAddress]
    [StringLength(256)]
    public string? SubmitterEmail { get; set; }
}
