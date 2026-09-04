namespace FlosskMS.Data.Entities;

public class PosShift
{
    public Guid Id { get; set; }
    public string OperatorName { get; set; } = string.Empty;
    public decimal StartingCash { get; set; }
    public decimal? EndingCash { get; set; }
    public decimal? ExpectedCash { get; set; }
    public decimal? TotalSales { get; set; }
    public decimal? TotalDonations { get; set; }
    public int? OrderCount { get; set; }
    public string Status { get; set; } = "open";
    public string? Notes { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? EndedAt { get; set; }
    public string CreatedByUserId { get; set; } = string.Empty;
    public ApplicationUser CreatedByUser { get; set; } = null!;
}
