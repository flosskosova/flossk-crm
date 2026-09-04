namespace FlosskMS.Data.Entities;

/// <summary>
/// A physical door controlled by one or more ESP32 devices.
/// </summary>
public class AccessDoor
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Location { get; set; }
    public string? Description { get; set; }

    /// <summary>When false, no credential opens this door.</summary>
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedByUserId { get; set; } = string.Empty;

    public ApplicationUser CreatedByUser { get; set; } = null!;
    public ICollection<AccessDevice> Devices { get; set; } = [];
    public ICollection<AccessDoorGrant> Grants { get; set; } = [];
}
