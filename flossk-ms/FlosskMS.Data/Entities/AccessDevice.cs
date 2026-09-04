namespace FlosskMS.Data.Entities;

/// <summary>
/// A registered ESP32 lock controller. Only devices whose source IP and shared secret
/// match a row here (with <see cref="IsAllowed"/> = true) may call the access webhook.
/// The same address is used for outbound provisioning ("SetUser" / "SetCredential") and
/// data sync ("grab data").
/// </summary>
public class AccessDevice
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public Guid DoorId { get; set; }
    public AccessDoor Door { get; set; } = null!;

    /// <summary>Origin IP the device connects from and that the API dials for provisioning/sync.</summary>
    public string IpAddress { get; set; } = string.Empty;

    /// <summary>TCP port the device's local HTTP API listens on.</summary>
    public int Port { get; set; } = 80;

    /// <summary>Shared secret sent by the device in the <c>X-Device-Key</c> header and by the API on outbound calls.</summary>
    public string Secret { get; set; } = string.Empty;

    /// <summary>Master switch. When false the device is rejected at the webhook and skipped for provisioning.</summary>
    public bool IsAllowed { get; set; }

    /// <summary>
    /// When true, the webhook also requires the request's source IP to equal <see cref="IpAddress"/>.
    /// Leave off when the API sits behind a proxy/NAT that rewrites the client address.
    /// </summary>
    public bool EnforceIpCheck { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedByUserId { get; set; } = string.Empty;

    public DateTime? LastSeenAt { get; set; }
    public DateTime? LastSyncAt { get; set; }
    public string? FirmwareVersion { get; set; }

    public string BaseUrl => $"http://{IpAddress}:{Port}";
}
