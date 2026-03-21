using System.ComponentModel.DataAnnotations;

namespace FlosskMS.Business.DTOs;

public class IssueCertificateDto
{
    [Required]
    public List<string> RecipientUserIds { get; set; } = [];

    [Required]
    public string Type { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string EventName { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    public DateTime? IssuedDate { get; set; }

    public Guid? TemplateId { get; set; }

    /// <summary>Base64 PNG data URL of the issuer's signature drawn in the UI.</summary>
    [Required]
    public string IssuerSignatureDataUrl { get; set; } = string.Empty;
}
