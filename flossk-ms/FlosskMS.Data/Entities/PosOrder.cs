namespace FlosskMS.Data.Entities;

public class PosOrder
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public Guid? CustomerId { get; set; }
    public PosCustomer? Customer { get; set; }
    public Guid? ShiftId { get; set; }
    public PosShift? Shift { get; set; }
    public string? CustomerName { get; set; }
    public string? OperatorName { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Donation { get; set; }
    public decimal Total { get; set; }
    public decimal AmountGiven { get; set; }
    public decimal Change { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedByUserId { get; set; } = string.Empty;
    public ApplicationUser CreatedByUser { get; set; } = null!;
    public ICollection<PosOrderItem> Items { get; set; } = [];
}
