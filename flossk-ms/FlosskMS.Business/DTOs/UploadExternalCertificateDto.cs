using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace FlosskMS.Business.DTOs;

public class UploadExternalCertificateDto
{
    [Required]
    public IFormFile File { get; set; } = null!;

    [Required]
    public string RecipientUserId { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string EventName { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    public Guid? ProjectId { get; set; }
}
