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
    public string QrCodeImage { get; set; } = string.Empty;
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

public class PasskeyRegistrationStartDto
{
    public string Challenge { get; set; } = string.Empty;
    public string RpId { get; set; } = string.Empty;
    public string RpName { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string UserDisplayName { get; set; } = string.Empty;
    public string PubKeyCredParams { get; set; } = string.Empty;
    public string Timeout { get; set; } = string.Empty;
    public string Attestation { get; set; } = string.Empty;
    public List<string> ExcludeCredentials { get; set; } = [];
}

public class PasskeyRegistrationCompleteDto
{
    public string CredentialJson { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string DeviceType { get; set; } = string.Empty;
}

public class LoginMfaDto
{
    public string Code { get; set; } = string.Empty;
    public string? RecoveryCode { get; set; }
}

public class LoginResponseWithMfaDto
{
    public bool RequiresTwoFactor { get; set; }
    public string? Token { get; set; }
    public DateTime? Expiration { get; set; }
    public UserDto? User { get; set; }
    public List<string> Errors { get; set; } = [];
}

public class PasskeyAuthenticateStartDto
{
    public string Challenge { get; set; } = string.Empty;
    public string RpId { get; set; } = string.Empty;
    public int Timeout { get; set; } = 60000;
    public List<PasskeyCredentialDescriptor> AllowCredentials { get; set; } = [];
}

public class PasskeyCredentialDescriptor
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = "public-key";
}

public class PasskeyAuthenticateCompleteDto
{
    public string CredentialJson { get; set; } = string.Empty;
}
