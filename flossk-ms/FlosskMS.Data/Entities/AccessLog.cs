namespace FlosskMS.Data.Entities;

/// <summary>
/// An immutable record of a door-access or credential-management event.
/// </summary>
public class AccessLog
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public AccessEventType EventType { get; set; }

    /// <summary>True when a door unlock was granted; false for a denial; null for non-entry events.</summary>
    public bool? Granted { get; set; }

    /// <summary>Human-readable explanation (e.g. "credential declined", "unknown card", "door disabled").</summary>
    public string? Reason { get; set; }

    // Door / device (nullable — management events may not target a specific door)
    public Guid? DoorId { get; set; }
    public AccessDoor? Door { get; set; }
    public string? DoorName { get; set; }

    public Guid? DeviceId { get; set; }
    public AccessDevice? Device { get; set; }

    // Credential / user involved
    public Guid? RfidCardId { get; set; }
    public UserRfidCard? RfidCard { get; set; }
    public AccessCredentialType? CredentialType { get; set; }

    /// <summary>Raw identifier presented at the reader (kept even if no credential matched).</summary>
    public string? CredentialIdentifier { get; set; }

    /// <summary>The member the credential belongs to, if known.</summary>
    public string? UserId { get; set; }
    public ApplicationUser? User { get; set; }

    /// <summary>Admin/board member who performed a management action (null for device-reported events).</summary>
    public string? ActorUserId { get; set; }
    public ApplicationUser? ActorUser { get; set; }

    /// <summary>Optional JSON blob with extra device-supplied context.</summary>
    public string? Metadata { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
