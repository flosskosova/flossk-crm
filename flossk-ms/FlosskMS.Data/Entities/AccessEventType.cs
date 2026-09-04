namespace FlosskMS.Data.Entities;

/// <summary>
/// The type of event recorded in an <see cref="AccessLog"/> entry.
/// </summary>
public enum AccessEventType
{
    // Door usage (reported by an ESP32 device via the webhook)
    Unlock = 0,
    Denied = 1,
    DoorForced = 2,
    DoorHeldOpen = 3,

    // Credential lifecycle (admin actions)
    CredentialAssigned = 10,
    CredentialAccepted = 11,
    CredentialDeclined = 12,
    CredentialDisabled = 13,
    CredentialEnabled = 14,
    CredentialRevoked = 15,
    CredentialDeleted = 16,
    HomeKeyProvisioned = 17,
    HomeKeyProvisionFailed = 18,

    // Provisioning pushed to a device
    SetUserPushed = 20,
    SetCredentialPushed = 21,
    RemoveCredentialPushed = 22,
    ProvisioningFailed = 23,

    // Door management
    DoorCreated = 30,
    DoorUpdated = 31,
    DoorDeleted = 32,

    // Device management
    DeviceRegistered = 40,
    DeviceUpdated = 41,
    DeviceRemoved = 42,
    DeviceHeartbeat = 43,
    DeviceSync = 44,
    DeviceRejected = 45
}
