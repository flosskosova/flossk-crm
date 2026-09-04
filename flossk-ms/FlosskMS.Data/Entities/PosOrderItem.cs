namespace FlosskMS.Data.Entities;

public class PosOrderItem
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public PosOrder Order { get; set; } = null!;
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public decimal Subtotal { get; set; }
}
