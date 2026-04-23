using System.ComponentModel.DataAnnotations;

namespace FlosskMS.Business.DTOs;

public class TraineeRegisterRequestDto
{
    /// <summary>The trainee's full name (will be split into first/last).</summary>
    [Required]
    [MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    /// <summary>The course voucher code used to enrol.</summary>
    [Required]
    public string VoucherCode { get; set; } = string.Empty;
}

public class TraineeLoginRequestDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}
