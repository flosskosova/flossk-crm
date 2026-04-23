namespace FlosskMS.Data.Entities;

public class CourseVoucher
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public Course Course { get; set; } = null!;

    public string Code { get; set; } = string.Empty;

    /// <summary>True = one code usable by many; False = single-use.</summary>
    public bool IsMultiUse { get; set; }

    /// <summary>For single-use vouchers: marks the code as consumed.</summary>
    public bool IsUsed { get; set; }

    /// <summary>How many times this code has been redeemed.</summary>
    public int UsedCount { get; set; }

    /// <summary>Emails of users who redeemed this voucher, stored for fast read access.</summary>
    public List<string> RedeemedByEmails { get; set; } = [];

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
