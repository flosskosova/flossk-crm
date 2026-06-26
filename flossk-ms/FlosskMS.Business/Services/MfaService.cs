using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using FlosskMS.Business.Configuration;
using FlosskMS.Business.DTOs;
using FlosskMS.Data;
using FlosskMS.Data.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace FlosskMS.Business.Services;

public class MfaService(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    ApplicationDbContext dbContext,
    IHttpContextAccessor httpContextAccessor,
    IOptions<JwtSettings> jwtSettings) : IMfaService
{
    private readonly JwtSettings _jwtSettings = jwtSettings.Value;

    public async Task<IActionResult> GetStatusAsync(string? userId)
    {
        if (string.IsNullOrEmpty(userId))
            return new UnauthorizedResult();

        var user = await userManager.FindByIdAsync(userId);
        if (user == null)
            return new NotFoundResult();

        var hasAuthenticator = await userManager.GetAuthenticatorKeyAsync(user) != null;
        var passkeys = await dbContext.UserPasskeys
            .Where(p => p.UserId == userId)
            .Select(p => new PasskeyDto
            {
                Id = p.Id.ToString(),
                Name = p.Name,
                DeviceType = p.DeviceType,
                CreatedAt = p.CreatedAt,
                LastUsedAt = p.LastUsedAt
            })
            .ToListAsync();

        var recoveryCodes = await userManager.CountRecoveryCodesAsync(user);

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
        var appName = "FlosskMS";
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

        var isValid = await userManager.VerifyTwoFactorTokenAsync(user, "Authenticator", request.Code);
        if (!isValid)
            return new BadRequestObjectResult(new { Message = "Invalid verification code. Try again." });

        user.TwoFactorEnabled = true;
        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return new BadRequestObjectResult(new { Message = "Failed to enable two-factor authentication." });

        var recoveryCodes = (await userManager.GenerateNewTwoFactorRecoveryCodesAsync(user, 10))?.ToList() ?? [];

        return new OkObjectResult(new RecoveryCodesDto
        {
            RecoveryCodes = [.. recoveryCodes],
            RemainingCount = recoveryCodes.Count
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
            return new BadRequestObjectResult(new { Message = "Current password is incorrect." });

        var result = await userManager.SetTwoFactorEnabledAsync(user, false);
        if (!result.Succeeded)
            return new BadRequestObjectResult(new { Message = "Failed to disable two-factor authentication." });

        return new OkObjectResult(new { Message = "Two-factor authentication has been disabled." });
    }

    public async Task<IActionResult> GetRecoveryCodesAsync(string? userId)
    {
        if (string.IsNullOrEmpty(userId))
            return new UnauthorizedResult();

        var user = await userManager.FindByIdAsync(userId);
        if (user == null)
            return new NotFoundResult();

        var count = await userManager.CountRecoveryCodesAsync(user);
        return new OkObjectResult(new { RemainingCount = count });
    }

    public async Task<IActionResult> GenerateRecoveryCodesAsync(string? userId)
    {
        if (string.IsNullOrEmpty(userId))
            return new UnauthorizedResult();

        var user = await userManager.FindByIdAsync(userId);
        if (user == null)
            return new NotFoundResult();

        var codes = (await userManager.GenerateNewTwoFactorRecoveryCodesAsync(user, 10))?.ToList() ?? [];

        return new OkObjectResult(new RecoveryCodesDto
        {
            RecoveryCodes = [.. codes],
            RemainingCount = codes.Count
        });
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
                return new BadRequestObjectResult(new { Message = "Invalid recovery code." });
        }
        else
        {
            var isValid = await userManager.VerifyTwoFactorTokenAsync(user, "Authenticator", request.Code);
            if (!isValid)
                return new BadRequestObjectResult(new { Message = "Invalid verification code." });
        }

        var token = await GenerateJwtTokenAsync(user);
        var expiration = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationInMinutes);

        return new OkObjectResult(new LoginResponseWithMfaDto
        {
            Token = token,
            Expiration = expiration,
            User = await MapToUserDtoAsync(user)
        });
    }

    public async Task<IActionResult> GetPasskeysAsync(string? userId)
    {
        if (string.IsNullOrEmpty(userId))
            return new UnauthorizedResult();

        var passkeys = await dbContext.UserPasskeys
            .Where(p => p.UserId == userId)
            .Select(p => new PasskeyDto
            {
                Id = p.Id.ToString(),
                Name = p.Name,
                DeviceType = p.DeviceType,
                CreatedAt = p.CreatedAt,
                LastUsedAt = p.LastUsedAt
            })
            .ToListAsync();

        return new OkObjectResult(passkeys);
    }

    public async Task<IActionResult> RegisterPasskeyStartAsync(string? userId)
    {
        if (string.IsNullOrEmpty(userId))
            return new UnauthorizedResult();

        var user = await userManager.FindByIdAsync(userId);
        if (user == null)
            return new NotFoundResult();

        var challengeBytes = RandomNumberGenerator.GetBytes(32);
        var challenge = Convert.ToBase64String(challengeBytes)
            .Replace('+', '-').Replace('/', '_').TrimEnd('=');

        var rpId = httpContextAccessor.HttpContext?.Request.Host.Host ?? "localhost";
        var rpName = "FlosskMS";

        var existingIds = await dbContext.UserPasskeys
            .Where(p => p.UserId == userId)
            .Select(p => p.CredentialId)
            .ToListAsync();

        return new OkObjectResult(new PasskeyRegistrationStartDto
        {
            Challenge = challenge,
            RpId = rpId,
            RpName = rpName,
            UserId = user.Id,
            UserName = user.Email ?? user.Id,
            UserDisplayName = $"{user.FirstName} {user.LastName}".Trim(),
            PubKeyCredParams = JsonSerializer.Serialize(new[]
            {
                new { type = "public-key", alg = -7 },
                new { type = "public-key", alg = -257 }
            }),
            Timeout = "60000",
            Attestation = "none",
            ExcludeCredentials = existingIds
        });
    }

    public async Task<IActionResult> RegisterPasskeyCompleteAsync(string? userId, PasskeyRegistrationCompleteDto request)
    {
        if (string.IsNullOrEmpty(userId))
            return new UnauthorizedResult();

        var user = await userManager.FindByIdAsync(userId);
        if (user == null)
            return new NotFoundResult();

        try
        {
            var credentialDoc = JsonDocument.Parse(request.CredentialJson);
            var credentialId = credentialDoc.RootElement.GetProperty("id").GetString() ?? Guid.NewGuid().ToString();

            var passkey = new UserPasskey
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                CredentialId = credentialId,
                CredentialJson = request.CredentialJson,
                Name = string.IsNullOrWhiteSpace(request.Name) ? "Passkey" : request.Name,
                DeviceType = string.IsNullOrWhiteSpace(request.DeviceType) ? "unknown" : request.DeviceType,
                CreatedAt = DateTime.UtcNow
            };

            dbContext.UserPasskeys.Add(passkey);
            await dbContext.SaveChangesAsync();

            return new OkObjectResult(new { Message = "Passkey registered successfully." });
        }
        catch (Exception ex)
        {
            return new BadRequestObjectResult(new { Message = $"Failed to register passkey: {ex.Message}" });
        }
    }

    public async Task<IActionResult> RemovePasskeyAsync(string? userId, Guid passkeyId)
    {
        if (string.IsNullOrEmpty(userId))
            return new UnauthorizedResult();

        var passkey = await dbContext.UserPasskeys
            .FirstOrDefaultAsync(p => p.Id == passkeyId && p.UserId == userId);

        if (passkey == null)
            return new NotFoundResult();

        dbContext.UserPasskeys.Remove(passkey);
        await dbContext.SaveChangesAsync();

        return new OkObjectResult(new { Message = "Passkey removed successfully." });
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
            claims.Add(new Claim(ClaimTypes.Role, role));

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationInMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task<UserDto> MapToUserDtoAsync(ApplicationUser user)
    {
        var roles = await userManager.GetRolesAsync(user);
        return new UserDto
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Roles = [.. roles]
        };
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

        return result.ToString().ToLowerInvariant();
    }
}
