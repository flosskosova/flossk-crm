namespace FlosskMS.Data.Entities;

public class PurchaseRequest
{
    public Guid Id { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string? Link { get; set; }
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public DateTime NeededByDate { get; set; }

    public PurchaseRequestStatus Status { get; set; } = PurchaseRequestStatus.Pending;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Submitter
    public string CreatedByUserId { get; set; } = string.Empty;
    public ApplicationUser CreatedByUser { get; set; } = null!;

    // Reviewer (board member who approved/rejected)
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewedByUserId { get; set; }
    public ApplicationUser? ReviewedByUser { get; set; }

    public string? RejectionReason { get; set; }
}
