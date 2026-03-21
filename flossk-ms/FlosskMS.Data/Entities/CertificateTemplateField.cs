namespace FlosskMS.Data.Entities;

public class CertificateTemplateField
{
    public Guid Id { get; set; }

    public Guid TemplateId { get; set; }
    public CertificateTemplate Template { get; set; } = null!;

    /// <summary>Logical key: recipientName | eventName | description | issuedDate | issuedBy | signature</summary>
    public string Key { get; set; } = string.Empty;

    // Normalized coordinates (0.0 – 1.0 as fraction of image dimensions)
    public float X { get; set; }
    public float Y { get; set; }
    public float Width { get; set; }
    public float Height { get; set; }
}
