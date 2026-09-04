namespace FlosskMS.Data.Entities;

/// <summary>
/// Lifecycle state of an access credential. The door only unlocks for a credential
/// that is <see cref="Active"/> (and, for Home Key credentials, has been provisioned).
/// </summary>
public enum AccessCredentialStatus
{
    /// <summary>Assigned to a user but not yet accepted by a board member. Door stays locked.</summary>
    Pending = 0,

    /// <summary>Accepted / enabled. Door unlocks (subject to Home Key provisioning and door grants).</summary>
    Active = 1,

    /// <summary>Explicitly declined by a board member. Door stays locked.</summary>
    Declined = 2,

    /// <summary>Temporarily disabled. Door stays locked but the credential can be re-enabled.</summary>
    Disabled = 3,

    /// <summary>Permanently revoked.</summary>
    Revoked = 4
}
