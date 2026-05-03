namespace FlosskMS.Data.Entities;

public class FormResponse
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string FormTitle { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
    public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;

    // Serialized JSON of the responses dictionary
    public string ResponsesJson { get; set; } = "{}";
}
