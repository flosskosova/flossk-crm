namespace FlosskMS.Data.Entities;

public class UserPasskey
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string CredentialId { get; set; } = string.Empty;
    public string CredentialJson { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string DeviceType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastUsedAt { get; set; }

    public ApplicationUser User { get; set; } = null!;
}
