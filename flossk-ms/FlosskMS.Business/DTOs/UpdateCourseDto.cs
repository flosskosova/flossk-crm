using System.ComponentModel.DataAnnotations;

namespace FlosskMS.Business.DTOs;

public class UpdateCourseDto
{
    [Required]
    [StringLength(200, MinimumLength = 3)]
    public string Title { get; set; } = string.Empty;

    [StringLength(2000)]
    public string Description { get; set; } = string.Empty;

    [StringLength(200)]
    public string? GoogleFormId { get; set; }

    [StringLength(500)]
    public string? GoogleFormTitle { get; set; }

    [StringLength(2000)]
    public string? GoogleFormUrl { get; set; }

    [Required]
    [MinLength(1, ErrorMessage = "At least one instructor is required.")]
    public List<CourseInstructorInputDto> Instructors { get; set; } = [];

    public List<string> CommunicationChannels { get; set; } = [];
}
