namespace FlosskMS.Data.Entities;

public class Certificate
{
    public Guid Id { get; set; }
    public CertificateType Type { get; set; } = CertificateType.Participation;
    public string EventName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public CertificateStatus Status { get; set; } = CertificateStatus.Issued;
    public DateTime IssuedDate { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string RecipientUserId { get; set; } = string.Empty;
    public ApplicationUser RecipientUser { get; set; } = null!;

    public string IssuedByUserId { get; set; } = string.Empty;
    public ApplicationUser IssuedByUser { get; set; } = null!;

    public Guid? TemplateId { get; set; }
    public CertificateTemplate? Template { get; set; }
}
