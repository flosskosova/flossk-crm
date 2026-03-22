using System.ComponentModel.DataAnnotations;

namespace FlosskMS.Business.DTOs;

public class IssueCertificateDto
{
    [Required]
    public string RecipientUserId { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string EventName { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    public DateTime? IssuedDate { get; set; }

    /// <summary>
    /// When provided, the certificate is tied to this project.
    /// The recipient must have participated in at least one completed objective of the project.
    /// </summary>
    public Guid? ProjectId { get; set; }

    public Guid? TemplateId { get; set; }
    [Required]
    public string IssuerSignatureDataUrl { get; set; } = string.Empty;
}
