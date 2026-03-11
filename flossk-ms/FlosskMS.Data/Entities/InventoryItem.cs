namespace FlosskMS.Data.Entities;

public class InventoryItem
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public InventoryCategory Category { get; set; }
    public int Quantity { get; set; } = 1;
    public int CheckedOutQuantity { get; set; } = 0;

    public InventoryStatus Status { get; set; } = InventoryStatus.Free;
    public InventoryCondition Condition { get; set; } = InventoryCondition.Good;
    public string? ConditionNotes { get; set; }
    public string? ConditionReportedByUserId { get; set; }
    public ApplicationUser? ConditionReportedByUser { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Creator tracking
    public string CreatedByUserId { get; set; } = string.Empty;
    public ApplicationUser CreatedByUser { get; set; } = null!;

    // Navigation properties
    public ICollection<InventoryItemImage> Images { get; set; } = [];
    public ICollection<InventoryItemCheckout> Checkouts { get; set; } = [];
}
