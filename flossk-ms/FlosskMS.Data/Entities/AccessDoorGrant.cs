namespace FlosskMS.Data.Entities;

/// <summary>
/// Grants a single credential access to a single door. Ignored when the credential
/// has <see cref="UserRfidCard.AllDoors"/> set.
/// </summary>
public class AccessDoorGrant
{
    public Guid Id { get; set; }

    public Guid RfidCardId { get; set; }
    public UserRfidCard RfidCard { get; set; } = null!;

    public Guid DoorId { get; set; }
    public AccessDoor Door { get; set; } = null!;

    public DateTime GrantedAt { get; set; } = DateTime.UtcNow;
    public string GrantedByUserId { get; set; } = string.Empty;
}
