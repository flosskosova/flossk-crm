namespace FlosskMS.Business.DTOs;

public class CourseListDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Level { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public Guid ProjectId { get; set; }
    public string ProjectTitle { get; set; } = string.Empty;
    public int ModuleCount { get; set; }
    public int SessionCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<CourseInstructorDto> Instructors { get; set; } = [];
}
