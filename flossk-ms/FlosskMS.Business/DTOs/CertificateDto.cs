namespace FlosskMS.Business.DTOs;

public class CertificateDto
{
    public Guid Id { get; set; }
    public string EventName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime IssuedDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public string RecipientUserId { get; set; } = string.Empty;
    public string RecipientName { get; set; } = string.Empty;
    public string RecipientEmail { get; set; } = string.Empty;
    public string RecipientProfilePictureUrl { get; set; } = string.Empty;
    public string IssuedByUserId { get; set; } = string.Empty;
    public string IssuedByName { get; set; } = string.Empty;
    public bool IsPptx { get; set; }
    public string? VerificationToken { get; set; }
}
