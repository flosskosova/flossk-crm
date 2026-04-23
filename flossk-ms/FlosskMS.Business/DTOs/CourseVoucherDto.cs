namespace FlosskMS.Business.DTOs;

public class CourseVoucherDto
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public string Code { get; set; } = string.Empty;
    public bool IsMultiUse { get; set; }
    public bool IsUsed { get; set; }
    public int UsedCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<string> RedeemedByEmails { get; set; } = new();
}

public class GenerateCourseVouchersDto
{
    /// <summary>
    /// True = generate one shared multi-use voucher code.
    /// False = generate <see cref="Count"/> single-use codes.
    /// </summary>
    public bool IsMultiUse { get; set; }

    /// <summary>Number of single-use codes to generate. Ignored when IsMultiUse is true.</summary>
    public int Count { get; set; } = 1;
}
