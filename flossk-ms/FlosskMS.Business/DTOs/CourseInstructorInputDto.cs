using System.ComponentModel.DataAnnotations;

namespace FlosskMS.Business.DTOs;

public class CourseInstructorInputDto
{
    [Required]
    public string UserId { get; set; } = string.Empty;

    [StringLength(100)]
    public string Role { get; set; } = "Instructor";
}
