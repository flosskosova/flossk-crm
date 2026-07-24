namespace FlosskMS.Data.Entities;

public class PosCustomer
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public decimal TotalSpent { get; set; }
    public int VisitCount { get; set; }
    public DateTime? LastVisitAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public ICollection<PosOrder> Orders { get; set; } = [];
}
