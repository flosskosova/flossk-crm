namespace FlosskMS.Data.Entities;

/// <summary>
/// Records that a specific user redeemed a course voucher code.
/// Used to authenticate trainees without a password — if a redemption exists for an email,
/// the user may log in via the trainee login endpoint.
/// </summary>
public class CourseVoucherRedemption
{
    public Guid Id { get; set; }

    public Guid CourseVoucherId { get; set; }
    public CourseVoucher Voucher { get; set; } = null!;

    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;

    public DateTime RedeemedAt { get; set; } = DateTime.UtcNow;
}
