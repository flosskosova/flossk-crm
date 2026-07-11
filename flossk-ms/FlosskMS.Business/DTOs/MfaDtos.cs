namespace FlosskMS.Business.DTOs;

public class MfaStatusDto
{
    public bool TwoFactorEnabled { get; set; }
    public bool HasAuthenticator { get; set; }
    public int RemainingRecoveryCodes { get; set; }
    public List<PasskeyDto> Passkeys { get; set; } = [];
}

public class MfaSetupDto
{
    public string SharedKey { get; set; } = string.Empty;
    public string AuthenticatorUri { get; set; } = string.Empty;
}

public class VerifyMfaDto
{
    public string Code { get; set; } = string.Empty;
}

public class DisableMfaDto
{
    public string CurrentPassword { get; set; } = string.Empty;
}

public class RecoveryCodesDto
{
    public List<string> RecoveryCodes { get; set; } = [];
    public int RemainingCount { get; set; }
}

public class PasskeyDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string DeviceType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastUsedAt { get; set; }
}

public class LoginMfaDto
{
    public string Code { get; set; } = string.Empty;
    public string? RecoveryCode { get; set; }
}

public class PasskeyAssertionOptionsDto
{
    public string Challenge { get; set; } = string.Empty;
    public string RpId { get; set; } = string.Empty;
    public string RpName { get; set; } = string.Empty;
    public int Timeout { get; set; }
}

public class PasskeyAssertionCompleteDto
{
    public string Id { get; set; } = string.Empty;
    public string RawId { get; set; } = string.Empty;
    public string? AuthenticatorData { get; set; }
    public string? ClientDataJson { get; set; }
    public string? Signature { get; set; }
    public string? UserHandle { get; set; }
}
