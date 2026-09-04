namespace FlosskMS.Business.DTOs;

public class UserRfidCardDto
{
    public Guid Id { get; set; }
    public string CardIdentifier { get; set; } = string.Empty;
    public DateTime RegisteredAt { get; set; }
    public string RegisteredByUserId { get; set; } = string.Empty;
    public string? RegisteredByUserEmail { get; set; }
    public bool IsActive { get; set; }
    public string? Notes { get; set; }

    // Assignment info (null if unassigned)
    public string? UserId { get; set; }
    public string? MemberCode { get; set; }
    public string? UserEmail { get; set; }
    public string? UserFullName { get; set; }
    public DateTime? AssignedAt { get; set; }
    public string? AssignedByUserId { get; set; }
    public string? AssignedByUserEmail { get; set; }

    // Revocation info
    public DateTime? RevokedAt { get; set; }
    public string? RevokedByUserId { get; set; }
    public string? RevokedByUserEmail { get; set; }
    public string? RevocationReason { get; set; }

    // Access control
    public string CredentialType { get; set; } = "NfcCard";
    public string Status { get; set; } = "Pending";
    public string? DeclineReason { get; set; }
    public int? UserNumber { get; set; }
    public int? CredentialNumber { get; set; }
    public DateTime? HomeKeyProvisionedAt { get; set; }
    public bool AllDoors { get; set; }
    public DateTime? LastUsedAt { get; set; }
    public List<AccessDoorRefDto> Doors { get; set; } = [];

    // Computed properties
    public bool IsAssigned => UserId != null;
    public bool IsUsable => Status == "Active" && (CredentialType != "HomeKey" || HomeKeyProvisionedAt != null);
}

public class AccessDoorRefDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
}
