namespace FlosskMS.Business.DTOs;

public class CourseDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Level { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public List<string> CommunicationChannels { get; set; } = [];
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Project
    public Guid ProjectId { get; set; }
    public string ProjectTitle { get; set; } = string.Empty;

    // Creator
    public string CreatedByUserId { get; set; } = string.Empty;
    public string CreatedByFirstName { get; set; } = string.Empty;
    public string CreatedByLastName { get; set; } = string.Empty;

    public List<CourseInstructorDto> Instructors { get; set; } = [];
    public List<CourseModuleDto> Modules { get; set; } = [];
    public List<CourseSessionDto> Sessions { get; set; } = [];
}
