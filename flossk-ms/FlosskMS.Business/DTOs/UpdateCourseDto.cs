using System.ComponentModel.DataAnnotations;

namespace FlosskMS.Business.DTOs;

public class UpdateCourseDto
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

    [Required]
    [MinLength(1, ErrorMessage = "At least one instructor is required.")]
    public List<CourseInstructorInputDto> Instructors { get; set; } = [];

    public List<string> CommunicationChannels { get; set; } = [];
}
