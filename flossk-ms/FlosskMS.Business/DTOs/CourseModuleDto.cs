namespace FlosskMS.Business.DTOs;

public class CourseModuleDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Order { get; set; }
    public List<CourseResourceDto> Resources { get; set; } = [];
    public List<CourseReviewDto> Reviews { get; set; } = [];
}
