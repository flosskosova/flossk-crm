namespace FlosskMS.Business.DTOs;

public class CourseSessionDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public TimeOnly Hour { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string? Notes { get; set; }
}
