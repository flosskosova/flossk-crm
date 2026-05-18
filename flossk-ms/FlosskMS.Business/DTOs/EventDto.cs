namespace FlosskMS.Business.DTOs;

public class EventDto
{
    public Guid Id { get; set; }
    public string EventName { get; set; } = string.Empty;
    public DateTime? Date { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsRecurring { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? ProjectId { get; set; }
    public string? ProjectTitle { get; set; }
}

public class CreateEventDto
{
    public string EventName { get; set; } = string.Empty;
    public DateTime? Date { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsRecurring { get; set; }
    public Guid? ProjectId { get; set; }
}

public class UpdateEventDto
{
    public string EventName { get; set; } = string.Empty;
    public DateTime? Date { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsRecurring { get; set; }
    public Guid? ProjectId { get; set; }
}