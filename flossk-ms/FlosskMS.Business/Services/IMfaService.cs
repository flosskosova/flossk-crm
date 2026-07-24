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
    Task<IActionResult> RegisterPasskeyStartAsync(string? userId, string rpId);
    Task<IActionResult> RegisterPasskeyCompleteAsync(string? userId, object request);
    Task<IActionResult> DeletePasskeyAsync(string? userId, string passkeyId);
    Task<IActionResult> AssertionStartAsync(string rpId);
    Task<IActionResult> AssertionCompleteAsync(PasskeyAssertionCompleteDto request);
}
