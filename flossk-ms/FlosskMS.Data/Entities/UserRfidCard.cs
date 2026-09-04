namespace FlosskMS.Data.Entities;

public class UserRfidCard
{
    public Guid Id { get; set; }

    /// <summary>
    /// The credential identifier. For an NFC card this is the card UUID; for a Home Key
    /// credential this is the Aliro / Home Key endpoint identifier.
    /// </summary>
    public string CardIdentifier { get; set; } = string.Empty;

    public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;
    public string RegisteredByUserId { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }

    // Assignment tracking (nullable - card can be unassigned)
    public string? UserId { get; set; }
    public DateTime? AssignedAt { get; set; }
    public string? AssignedByUserId { get; set; }

    // Revocation tracking
    public DateTime? RevokedAt { get; set; }
    public string? RevokedByUserId { get; set; }
    public string? RevocationReason { get; set; }

    // ─────────────────────────── Access control ───────────────────────────

    /// <summary>NFC card or Aliro / Apple Home Key.</summary>
    public AccessCredentialType CredentialType { get; set; } = AccessCredentialType.NfcCard;

    /// <summary>
    /// Lifecycle state. The door only unlocks when this is <see cref="AccessCredentialStatus.Active"/>.
    /// Kept in sync with <see cref="IsActive"/> (IsActive == Status == Active).
    /// </summary>
    public AccessCredentialStatus Status { get; set; } = AccessCredentialStatus.Pending;

    /// <summary>Reason captured when the credential was declined.</summary>
    public string? DeclineReason { get; set; }

    /// <summary>
    /// Matter/Aliro "SetUser" slot number for the assigned user. All credentials belonging
    /// to the same user share this number. Null until first provisioned.
    /// </summary>
    public int? UserNumber { get; set; }

    /// <summary>
    /// Matter/Aliro "SetCredential" slot number for this specific credential. Unique per credential.
    /// Null until first provisioned.
    /// </summary>
    public int? CredentialNumber { get; set; }

    /// <summary>
    /// When the Home Key credential was provisioned onto the user's device. Home Key credentials
    /// do not grant access until this is set. Always null for NFC cards.
    /// </summary>
    public DateTime? HomeKeyProvisionedAt { get; set; }
    public string? HomeKeyProvisionedByUserId { get; set; }

    /// <summary>Grant access to every door, bypassing per-door grants.</summary>
    public bool AllDoors { get; set; }

    public DateTime? LastUsedAt { get; set; }

    // Navigation properties
    public ApplicationUser RegisteredByUser { get; set; } = null!;
    public ApplicationUser? User { get; set; }
    public ApplicationUser? AssignedByUser { get; set; }
    public ApplicationUser? RevokedByUser { get; set; }
    public ICollection<AccessDoorGrant> DoorGrants { get; set; } = [];

    /// <summary>
    /// Whether this credential currently satisfies every requirement to open a door
    /// (accepted, and — for Home Key — provisioned).
    /// </summary>
    public bool IsUsable =>
        Status == AccessCredentialStatus.Active &&
        (CredentialType != AccessCredentialType.HomeKey || HomeKeyProvisionedAt != null);
}
