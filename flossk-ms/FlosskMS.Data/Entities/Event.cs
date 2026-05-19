namespace FlosskMS.Data.Entities;

public class Event
{
    public Guid Id { get; set; }
    public string EventName { get; set; } = string.Empty;

    // Multi-day event window
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    public bool IsRecurring { get; set; }
    public RecurringType? RecurringType { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Optional 1:1 with Project
    public Guid? ProjectId { get; set; }
    public Project? Project { get; set; }
}