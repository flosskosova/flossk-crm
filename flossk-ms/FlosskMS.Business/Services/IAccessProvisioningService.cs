using FlosskMS.Data.Entities;

namespace FlosskMS.Business.Services;

public record ProvisioningResult(bool Success, string Message)
{
    public List<string> DeviceMessages { get; init; } = [];
}

/// <summary>
/// Pushes Matter/Aliro "SetUser" / "SetCredential" operations to the ESP32 lock controllers
/// that guard the doors a credential is granted on. Implementations must be fully tolerant of
/// unreachable hardware — they never throw; they report what happened.
/// </summary>
public interface IAccessProvisioningService
{
    /// <summary>Ensure the credential's owner has a user slot (SetUser) on every relevant device.</summary>
    Task<ProvisioningResult> SetUserAsync(Guid rfidCardId, CancellationToken ct = default);

    /// <summary>Push the credential itself (SetCredential) to every relevant device.</summary>
    Task<ProvisioningResult> SetCredentialAsync(Guid rfidCardId, CancellationToken ct = default);

    /// <summary>Remove the credential (RemoveCredential) from every relevant device.</summary>
    Task<ProvisioningResult> RemoveCredentialAsync(Guid rfidCardId, CancellationToken ct = default);

    /// <summary>Pull current state ("grab data") from a single device.</summary>
    Task<ProvisioningResult> SyncDeviceAsync(Guid deviceId, CancellationToken ct = default);
}
