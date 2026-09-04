namespace FlosskMS.Data.Entities;

public class PosPaymentLog
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string? CustomerName { get; set; }
    public string OperatorName { get; set; } = string.Empty;
    public decimal Subtotal { get; set; }
    public decimal Donation { get; set; }
    public decimal Total { get; set; }
    public decimal AmountGiven { get; set; }
    public decimal Change { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public string Action { get; set; } = "created";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
