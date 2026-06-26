using FlosskMS.Business.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.Business.Services;

public interface IMfaService
{
    Task<IActionResult> GetStatusAsync(string? userId);
    Task<IActionResult> SetupAsync(string? userId);
    Task<IActionResult> VerifyAsync(string? userId, VerifyMfaDto request);
    Task<IActionResult> DisableAsync(string? userId, DisableMfaDto request);
    Task<IActionResult> GetRecoveryCodesAsync(string? userId);
    Task<IActionResult> GenerateRecoveryCodesAsync(string? userId);
    Task<IActionResult> LoginWithMfaAsync(string? userId, LoginMfaDto request);
    Task<IActionResult> GetPasskeysAsync(string? userId);
    Task<IActionResult> RegisterPasskeyStartAsync(string? userId);
    Task<IActionResult> RegisterPasskeyCompleteAsync(string? userId, PasskeyRegistrationCompleteDto request);
    Task<IActionResult> RemovePasskeyAsync(string? userId, Guid passkeyId);
}
