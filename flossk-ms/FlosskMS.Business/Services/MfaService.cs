using System.Collections.Concurrent;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using FlosskMS.Business.Configuration;
using FlosskMS.Business.DTOs;
using FlosskMS.Data;
using FlosskMS.Data.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace FlosskMS.Business.Services;

public class MfaService(
    UserManager<ApplicationUser> userManager,
    ApplicationDbContext dbContext,
    IOptions<JwtSettings> jwtSettings) : IMfaService
{
    private static readonly ConcurrentDictionary<string, ChallengeInfo> _challenges = new();
    private readonly JwtSettings _jwtSettings = jwtSettings.Value;

    public class ChallengeInfo
    {
        public string Challenge { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsUsed { get; set; }
    }
    public async Task<IActionResult> GetStatusAsync(string? userId)
    {
        if (string.IsNullOrEmpty(userId))
            return new UnauthorizedResult();

        var user = await userManager.FindByIdAsync(userId);
        if (user == null)
            return new NotFoundResult();

        var hasAuthenticator = await userManager.GetAuthenticatorKeyAsync(user) != null;
        var recoveryCodes = await userManager.CountRecoveryCodesAsync(user);

        List<PasskeyDto> passkeys;
        try
        {
            passkeys = await dbContext.UserPasskeys
                .Where(p => p.UserId == userId)
                .Select(p => new PasskeyDto
                {
                    Id = p.Id.ToString(),
                    Name = p.Name,
                    DeviceType = p.DeviceType,
                    Transports = p.Transports,
                    CreatedAt = p.CreatedAt,
                    LastUsedAt = p.LastUsedAt
                })
                .ToListAsync();
        }
        catch
        {
            passkeys = [];
        }

        return new OkObjectResult(new MfaStatusDto
        {
            TwoFactorEnabled = user.TwoFactorEnabled,
            HasAuthenticator = hasAuthenticator,
            RemainingRecoveryCodes = recoveryCodes,
            Passkeys = passkeys
        });
    }

    public async Task<IActionResult> SetupAsync(string? userId)
    {
        if (string.IsNullOrEmpty(userId))
            return new UnauthorizedResult();

        var user = await userManager.FindByIdAsync(userId);
        if (user == null)
            return new NotFoundResult();

        var key = await userManager.GetAuthenticatorKeyAsync(user);
        if (key == null)
        {
            await userManager.ResetAuthenticatorKeyAsync(user);
            key = await userManager.GetAuthenticatorKeyAsync(user);
        }

        var email = await userManager.GetEmailAsync(user);
        var appName = "FLOSSK CRM";
        var uri = $"otpauth://totp/{appName}:{email}?secret={key}&issuer={appName}&algorithm=SHA1&digits=6&period=30";

        return new OkObjectResult(new MfaSetupDto
        {
            SharedKey = FormatKey(key!),
            AuthenticatorUri = uri
        });
    }

    public async Task<IActionResult> VerifyAsync(string? userId, VerifyMfaDto request)
    {
        if (string.IsNullOrEmpty(userId))
            return new UnauthorizedResult();

        var user = await userManager.FindByIdAsync(userId);
        if (user == null)
            return new NotFoundResult();

        var isValid = await userManager.VerifyTwoFactorTokenAsync(user, TokenOptions.DefaultAuthenticatorProvider, request.Code);
        if (!isValid)
            return new BadRequestObjectResult(new { message = "Invalid verification code. Try again." });

        await userManager.SetTwoFactorEnabledAsync(user, true);

        var codes = (await userManager.GenerateNewTwoFactorRecoveryCodesAsync(user, 10))?.ToList() ?? [];

        return new OkObjectResult(new RecoveryCodesDto
        {
            RecoveryCodes = [.. codes],
            RemainingCount = codes.Count
        });
    }

    public async Task<IActionResult> DisableAsync(string? userId, DisableMfaDto request)
    {
        if (string.IsNullOrEmpty(userId))
            return new UnauthorizedResult();

        var user = await userManager.FindByIdAsync(userId);
        if (user == null)
            return new NotFoundResult();

        if (!await userManager.CheckPasswordAsync(user, request.CurrentPassword))
            return new BadRequestObjectResult(new { message = "Current password is incorrect." });

        await userManager.SetTwoFactorEnabledAsync(user, false);
        await userManager.ResetAuthenticatorKeyAsync(user);

        return new OkObjectResult(new { message = "Two-factor authentication has been disabled." });
    }

    public async Task<IActionResult> GetRecoveryCodesAsync(string? userId)
    {
        if (string.IsNullOrEmpty(userId))
            return new UnauthorizedResult();

        var user = await userManager.FindByIdAsync(userId);
        if (user == null)
            return new NotFoundResult();

        if (!user.TwoFactorEnabled)
            return new BadRequestObjectResult(new { message = "Two-factor authentication is not enabled." });

        var count = await userManager.CountRecoveryCodesAsync(user);
        return new OkObjectResult(new { remainingCount = count });
    }

    public async Task<IActionResult> GenerateRecoveryCodesAsync(string? userId)
    {
        if (string.IsNullOrEmpty(userId))
            return new UnauthorizedResult();

        var user = await userManager.FindByIdAsync(userId);
        if (user == null)
            return new NotFoundResult();

        if (!user.TwoFactorEnabled)
            return new BadRequestObjectResult(new { message = "Two-factor authentication is not enabled." });

        var codes = (await userManager.GenerateNewTwoFactorRecoveryCodesAsync(user, 10))?.ToList() ?? [];

        return new OkObjectResult(new RecoveryCodesDto
        {
            RecoveryCodes = [.. codes],
            RemainingCount = codes.Count
        });
    }

    public async Task<IActionResult> RegisterPasskeyStartAsync(string? userId, string rpId)
    {
        if (string.IsNullOrEmpty(userId))
            return new UnauthorizedResult();

        var user = await userManager.FindByIdAsync(userId);
        if (user == null)
            return new NotFoundResult();

        var existingCredentials = await dbContext.UserPasskeys
            .Where(p => p.UserId == userId)
            .Select(p => p.CredentialId)
            .ToListAsync();

        return new OkObjectResult(new
        {
            challenge = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)),
            rpId,
            rpName = "FLOSSK CRM",
            userId = user.Id,
            userName = user.Email,
            userDisplayName = $"{user.FirstName} {user.LastName}".Trim(),
            pubKeyCredParams = """[{"type":"public-key","alg":-7},{"type":"public-key","alg":-257}]""",
            timeout = 120000,
            attestation = "none",
            authenticatorSelection = """{"residentKey":"required","userVerification":"preferred"}""",
            hints = """["security-key","client-device"]""",
            excludeCredentials = existingCredentials
        });
    }

    public async Task<IActionResult> RegisterPasskeyCompleteAsync(string? userId, object request)
    {
        if (string.IsNullOrEmpty(userId))
            return new UnauthorizedResult();

        var user = await userManager.FindByIdAsync(userId);
        if (user == null)
            return new NotFoundResult();

        var jsonElement = System.Text.Json.JsonSerializer.SerializeToElement(request);
        var credentialJson = jsonElement.GetProperty("credentialJson").GetString()!;
        var name = jsonElement.GetProperty("name").GetString() ?? $"Passkey ({DateTime.UtcNow:yyyy-MM-dd})";
        var deviceType = jsonElement.GetProperty("deviceType").GetString() ?? "cross-platform";
        var transports = jsonElement.TryGetProperty("transports", out var t) ? t.GetString() : null;

        var credentialId = "";
        try
        {
            var doc = System.Text.Json.JsonDocument.Parse(credentialJson);
            credentialId = doc.RootElement.GetProperty("id").GetString() ?? "";
        }
        catch { credentialId = Guid.NewGuid().ToString(); }

        var existing = await dbContext.UserPasskeys
            .FirstOrDefaultAsync(p => p.UserId == userId && p.CredentialId == credentialId);

        if (existing != null)
        {
            existing.Name = name;
            existing.DeviceType = deviceType;
            existing.Transports = transports;
            existing.CreatedAt = DateTime.UtcNow;
        }
        else
        {
            dbContext.UserPasskeys.Add(new UserPasskey
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                CredentialId = credentialId,
                CredentialJson = credentialJson,
                Name = name,
                DeviceType = deviceType,
                Transports = transports,
                CreatedAt = DateTime.UtcNow
            });
        }

        await dbContext.SaveChangesAsync();

        return new OkObjectResult(new { message = "Passkey registered successfully." });
    }

    public async Task<IActionResult> DeletePasskeyAsync(string? userId, string passkeyId)
    {
        if (string.IsNullOrEmpty(userId))
            return new UnauthorizedResult();

        var passkey = await dbContext.UserPasskeys
            .FirstOrDefaultAsync(p => p.Id.ToString() == passkeyId && p.UserId == userId);

        if (passkey == null)
            return new NotFoundResult();

        dbContext.UserPasskeys.Remove(passkey);
        await dbContext.SaveChangesAsync();

        return new OkObjectResult(new { message = "Passkey deleted successfully." });
    }

    public async Task<IActionResult> LoginWithMfaAsync(string? userId, LoginMfaDto request)
    {
        if (string.IsNullOrEmpty(userId))
            return new UnauthorizedResult();

        var user = await userManager.FindByIdAsync(userId);
        if (user == null)
            return new NotFoundResult();

        if (!string.IsNullOrEmpty(request.RecoveryCode))
        {
            var identityResult = await userManager.RedeemTwoFactorRecoveryCodeAsync(user, request.RecoveryCode);
            if (!identityResult.Succeeded)
                return new BadRequestObjectResult(new { message = "Invalid recovery code." });
        }
        else
        {
            var isValid = await userManager.VerifyTwoFactorTokenAsync(user, TokenOptions.DefaultAuthenticatorProvider, request.Code);
            if (!isValid)
                return new BadRequestObjectResult(new { message = "Invalid verification code." });
        }

        var token = await GenerateJwtTokenAsync(user);
        var roles = await userManager.GetRolesAsync(user);
        return new OkObjectResult(new AuthResponseDto
        {
            Success = true,
            Token = token,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Roles = roles.ToList()
            }
        });
    }

    public async Task<IActionResult> AssertionStartAsync(string rpId)
    {
        var challengeBytes = RandomNumberGenerator.GetBytes(32);
        var challenge = WebAuthnHelper.Base64UrlEncode(challengeBytes);
        var trackingId = Guid.NewGuid().ToString();

        _challenges[trackingId] = new ChallengeInfo
        {
            Challenge = challenge,
            CreatedAt = DateTime.UtcNow
        };

        return new OkObjectResult(new PasskeyAssertionOptionsDto
        {
            Challenge = challenge,
            RpId = rpId,
            RpName = "FLOSSK CRM",
            Timeout = 60000
        });
    }

    public async Task<IActionResult> AssertionCompleteAsync(PasskeyAssertionCompleteDto request)
    {
        var passkey = await dbContext.UserPasskeys
            .FirstOrDefaultAsync(p => p.CredentialId == request.Id);

        if (passkey == null)
            return new BadRequestObjectResult(new { message = "No passkey registered for this account. Register a passkey first." });

        try
        {
            var credentialDoc = System.Text.Json.JsonDocument.Parse(passkey.CredentialJson);
            var responseElement = credentialDoc.RootElement.GetProperty("response");

            var attestationObjectB64 = responseElement.GetProperty("attestationObject").GetString() ?? "";
            var attestationObject = Convert.FromBase64String(attestationObjectB64);

            var authData = WebAuthnHelper.ExtractAuthDataFromAttestationObject(attestationObject);

            var (ecdsa, rsa) = WebAuthnHelper.ParseCosePublicKey(authData);

            if (ecdsa == null && rsa == null)
                return new BadRequestObjectResult(new { message = "Passkey not recognized. Unsupported key type." });

            var clientDataJsonBytes = WebAuthnHelper.Base64UrlDecode(request.ClientDataJson ?? "");
            var authenticatorDataBytes = WebAuthnHelper.Base64UrlDecode(request.AuthenticatorData ?? "");
            var signatureBytes = WebAuthnHelper.Base64UrlDecode(request.Signature ?? "");

            var clientChallenge = WebAuthnHelper.ExtractChallengeFromClientDataJson(clientDataJsonBytes);
            var challengeMatch = _challenges.Values.Any(c => c.Challenge == clientChallenge && !c.IsUsed);

            if (!challengeMatch)
                return new BadRequestObjectResult(new { message = "Passkey authentication failed. Try again." });

            var isValid = WebAuthnHelper.VerifyAssertion(
                authenticatorDataBytes,
                clientDataJsonBytes,
                signatureBytes,
                ecdsa,
                rsa);

            if (!isValid)
                return new BadRequestObjectResult(new { message = "Passkey authentication failed. Try again." });

            foreach (var kvp in _challenges)
            {
                if (kvp.Value.Challenge == clientChallenge)
                {
                    kvp.Value.IsUsed = true;
                    break;
                }
            }

            passkey.LastUsedAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync();

            var user = await userManager.FindByIdAsync(passkey.UserId);
            if (user == null)
                return new BadRequestObjectResult(new { message = "Passkey authentication failed. Try again." });

            var token = await GenerateJwtTokenAsync(user);

            return new OkObjectResult(new
            {
                token,
                user = new
                {
                    id = user.Id,
                    email = user.Email,
                    firstName = user.FirstName,
                    lastName = user.LastName
                }
            });
        }
        catch
        {
            return new BadRequestObjectResult(new { message = "Passkey authentication failed. Try again." });
        }
    }

    private async Task<string> GenerateJwtTokenAsync(ApplicationUser user)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Secret));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var roles = await userManager.GetRolesAsync(user);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim("firstName", user.FirstName),
            new Claim("lastName", user.LastName)
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationInMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string FormatKey(string key)
    {
        var result = new StringBuilder();
        var currentPosition = 0;
        while (currentPosition + 4 < key.Length)
        {
            result.Append(key.AsSpan(currentPosition, 4)).Append(' ');
            currentPosition += 4;
        }
        if (currentPosition < key.Length)
            result.Append(key.AsSpan(currentPosition));

        return result.ToString().ToUpperInvariant();
    }
}
