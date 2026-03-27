namespace FlosskMS.Business.DTOs;

public class CertificateVerifyDto
{
    public string Status { get; set; } = string.Empty;
    public string EventName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string RecipientName { get; set; } = string.Empty;
    public DateTime IssuedDate { get; set; }
    public string IssuedByName { get; set; } = string.Empty;

    /// <summary>
    /// HMAC-SHA256 over "{CertId}|{RecipientUserId}|{IssuedDate:O}" signed with the server secret.
    /// Third parties can independently re-compute and compare this signature to confirm authenticity.
    /// </summary>
    public string HmacSignature { get; set; } = string.Empty;
}
