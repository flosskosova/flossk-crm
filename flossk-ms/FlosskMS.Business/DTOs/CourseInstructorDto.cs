namespace FlosskMS.Business.DTOs;

public class CourseInstructorDto
{
    public string UserId { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
}
