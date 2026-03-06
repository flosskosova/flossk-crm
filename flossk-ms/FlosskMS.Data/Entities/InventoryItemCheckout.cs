namespace FlosskMS.Data.Entities;

public class InventoryItemCheckout
{
    public Guid Id { get; set; }
    public Guid InventoryItemId { get; set; }
    public InventoryItem InventoryItem { get; set; } = null!;
    
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;
    
    public int Quantity { get; set; }
    public DateTime CheckedOutAt { get; set; } = DateTime.UtcNow;
}
