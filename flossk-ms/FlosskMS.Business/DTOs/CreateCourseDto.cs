using System.ComponentModel.DataAnnotations;

namespace FlosskMS.Business.DTOs;

public class CreateCourseDto
{
    [Required]
    [StringLength(200, MinimumLength = 3)]
    public string Title { get; set; } = string.Empty;

    [StringLength(2000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public string Level { get; set; } = "Beginner";

    [Required]
    public string Status { get; set; } = "Draft";

    /// <summary>ID of the Project this course belongs to. Must be unique (1:1).</summary>
    [Required]
    public Guid ProjectId { get; set; }

    /// <summary>At least one instructor user ID is required.</summary>
    [Required]
    [MinLength(1, ErrorMessage = "At least one instructor is required.")]
    public List<CourseInstructorInputDto> Instructors { get; set; } = [];

    public List<string> CommunicationChannels { get; set; } = [];
}
