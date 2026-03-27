namespace FlosskMS.Data.Entities;

public class Certificate
{
    public Guid Id { get; set; }
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

    /// <summary>Optional project this certificate is awarded for.</summary>
    public Guid? ProjectId { get; set; }
    public Project? Project { get; set; }

    /// <summary>Base64-encoded PNG data URL of the issuer's handwritten signature.</summary>
    public string? IssuerSignatureDataUrl { get; set; }

    /// <summary>Path to the PDF file generated at issuance time. Serving this ensures template changes do not affect issued certificates.</summary>
    public string? GeneratedPdfPath { get; set; }

    /// <summary>True when the stored certificate file is a .pptx (externally uploaded or PPTX-template generated).</summary>
    public bool IsPptx { get; set; }

    /// <summary>Unique random token embedded in the QR code for public verification lookups.</summary>
    public string? VerificationToken { get; set; }

    /// <summary>HMAC-SHA256 over "{Id}|{RecipientUserId}|{IssuedDate:O}" using the server secret. Allows third parties to verify authenticity offline.</summary>
    public string? HmacSignature { get; set; }
}
