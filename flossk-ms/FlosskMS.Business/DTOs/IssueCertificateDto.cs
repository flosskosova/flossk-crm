using System.ComponentModel.DataAnnotations;

namespace FlosskMS.Business.DTOs;

public class IssueCertificateDto
{
    [Required]
    public string RecipientUserId { get; set; } = string.Empty;

    [Required]
    public string Type { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string EventName { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    public DateTime? IssuedDate { get; set; }

    public Guid? TemplateId { get; set; }
    [Required]
    public string IssuerSignatureDataUrl { get; set; } = string.Empty;
}
