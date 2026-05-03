namespace FlosskMS.Business.DTOs;

/// <summary>
/// Payload sent by the Google Apps Script webhook trigger.
/// </summary>
public class GoogleFormWebhookDto
{
    public string FormTitle { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }

    /// <summary>
    /// Key = question label, Value = list of answers (Google always sends an array).
    /// </summary>
    public Dictionary<string, List<string>> Responses { get; set; } = [];
}

public class FormResponseDto
{
    public Guid Id { get; set; }
    public string FormTitle { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
    public DateTime ReceivedAt { get; set; }
    public Dictionary<string, List<string>> Responses { get; set; } = [];
}

public class FormResponseListDto
{
    public List<FormResponseDto> Responses { get; set; } = [];
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
