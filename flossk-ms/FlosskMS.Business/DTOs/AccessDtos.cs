using System.ComponentModel.DataAnnotations;

namespace FlosskMS.Business.DTOs;

// ─────────────────────────────── Doors ───────────────────────────────

public class AccessDoorDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Location { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedByUserId { get; set; } = string.Empty;
    public string? CreatedByName { get; set; }
    public int DeviceCount { get; set; }
    public int OnlineDeviceCount { get; set; }
}

public class CreateAccessDoorDto
{
    [Required, MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Location { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;
}

public class UpdateAccessDoorDto
{
    [MaxLength(150)]
    public string? Name { get; set; }

    [MaxLength(200)]
    public string? Location { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }

    public bool? IsActive { get; set; }
}

// ─────────────────────────────── Devices (ESP32) ───────────────────────────────

public class AccessDeviceDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid DoorId { get; set; }
    public string? DoorName { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public int Port { get; set; }
    public bool IsAllowed { get; set; }
    public bool EnforceIpCheck { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastSeenAt { get; set; }
    public DateTime? LastSyncAt { get; set; }
    public string? FirmwareVersion { get; set; }
    public bool IsOnline { get; set; }

    /// <summary>Only returned right after create / secret rotation.</summary>
    public string? Secret { get; set; }
}

public class CreateAccessDeviceDto
{
    [Required, MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public Guid DoorId { get; set; }

    [Required, MaxLength(64)]
    public string IpAddress { get; set; } = string.Empty;

    [Range(1, 65535)]
    public int Port { get; set; } = 80;

    /// <summary>Optional. A random secret is generated when omitted.</summary>
    [MaxLength(200)]
    public string? Secret { get; set; }

    public bool IsAllowed { get; set; } = true;
    public bool EnforceIpCheck { get; set; }
}

public class UpdateAccessDeviceDto
{
    [MaxLength(150)]
    public string? Name { get; set; }

    public Guid? DoorId { get; set; }

    [MaxLength(64)]
    public string? IpAddress { get; set; }

    [Range(1, 65535)]
    public int? Port { get; set; }

    public bool? IsAllowed { get; set; }
    public bool? EnforceIpCheck { get; set; }

    /// <summary>When true, a fresh secret is generated and returned once.</summary>
    public bool RotateSecret { get; set; }
}

// ─────────────────────────────── Credentials ───────────────────────────────

public class AssignAccessCredentialDto
{
    [Required]
    public string UserId { get; set; } = string.Empty;

    /// <summary>"NfcCard" or "HomeKey".</summary>
    [Required]
    public string CredentialType { get; set; } = "NfcCard";

    /// <summary>Card UUID for NFC. Optional for Home Key (a placeholder id is generated).</summary>
    [MaxLength(200)]
    public string? CardIdentifier { get; set; }

    public bool AllDoors { get; set; }

    public List<Guid> DoorIds { get; set; } = [];

    [MaxLength(500)]
    public string? Notes { get; set; }
}

public class DeclineAccessCredentialDto
{
    [MaxLength(500)]
    public string? Reason { get; set; }
}

public class SetCredentialDoorsDto
{
    public bool AllDoors { get; set; }
    public List<Guid> DoorIds { get; set; } = [];
}

public class AccessLogQueryDto
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
    public Guid? DoorId { get; set; }
    public Guid? RfidCardId { get; set; }
    public string? UserId { get; set; }
    public string? EventType { get; set; }
    public bool? Granted { get; set; }
    public string? DateFrom { get; set; }
    public string? DateTo { get; set; }
}

public class AccessLogDto
{
    public Guid Id { get; set; }
    public string EventType { get; set; } = string.Empty;
    public bool? Granted { get; set; }
    public string? Reason { get; set; }
    public Guid? DoorId { get; set; }
    public string? DoorName { get; set; }
    public Guid? DeviceId { get; set; }
    public Guid? RfidCardId { get; set; }
    public string? CredentialType { get; set; }
    public string? CredentialIdentifier { get; set; }
    public string? UserId { get; set; }
    public string? UserName { get; set; }
    public string? ActorUserId { get; set; }
    public string? ActorName { get; set; }
    public string? Metadata { get; set; }
    public DateTime Timestamp { get; set; }
}

// ─────────────────────────────── Webhook (ESP32 → API) ───────────────────────────────

public class AccessVerifyRequestDto
{
    /// <summary>Identifier read at the door (card UUID or Home Key endpoint id).</summary>
    [Required, MaxLength(200)]
    public string Uuid { get; set; } = string.Empty;

    /// <summary>"NfcCard" or "HomeKey". Defaults to NfcCard.</summary>
    public string? CredentialType { get; set; }

    /// <summary>Optional extra context (reader id, signal, etc.) stored with the log.</summary>
    public string? Metadata { get; set; }
}

public class AccessVerifyResponseDto
{
    public bool Granted { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? UserName { get; set; }
    public Guid? DoorId { get; set; }
}

public class AccessEventReportDto
{
    /// <summary>One of the <c>AccessEventType</c> names, e.g. "Unlock", "DoorForced", "DeviceHeartbeat".</summary>
    [Required, MaxLength(40)]
    public string EventType { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Uuid { get; set; }

    public string? FirmwareVersion { get; set; }

    public string? Metadata { get; set; }
}
