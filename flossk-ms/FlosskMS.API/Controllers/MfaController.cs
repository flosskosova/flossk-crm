using System.Security.Claims;
using FlosskMS.Business.DTOs;
using FlosskMS.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MfaController(IMfaService mfaService) : ControllerBase
{
    private readonly IMfaService _mfaService = mfaService;

    [Authorize]
    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
        => await _mfaService.GetStatusAsync(User.FindFirstValue(ClaimTypes.NameIdentifier));

    [Authorize]
    [HttpPost("setup")]
    public async Task<IActionResult> Setup()
        => await _mfaService.SetupAsync(User.FindFirstValue(ClaimTypes.NameIdentifier));

    [Authorize]
    [HttpPost("verify")]
    public async Task<IActionResult> Verify([FromBody] VerifyMfaDto request)
        => await _mfaService.VerifyAsync(User.FindFirstValue(ClaimTypes.NameIdentifier), request);

    [Authorize]
    [HttpPost("disable")]
    public async Task<IActionResult> Disable([FromBody] DisableMfaDto request)
        => await _mfaService.DisableAsync(User.FindFirstValue(ClaimTypes.NameIdentifier), request);

    [Authorize]
    [HttpGet("recovery-codes")]
    public async Task<IActionResult> GetRecoveryCodes()
        => await _mfaService.GetRecoveryCodesAsync(User.FindFirstValue(ClaimTypes.NameIdentifier));

    [Authorize]
    [HttpPost("recovery-codes")]
    public async Task<IActionResult> GenerateRecoveryCodes()
        => await _mfaService.GenerateRecoveryCodesAsync(User.FindFirstValue(ClaimTypes.NameIdentifier));

    [HttpPost("login")]
    public async Task<IActionResult> LoginWithMfa([FromBody] LoginMfaDto request, [FromQuery] string userId)
        => await _mfaService.LoginWithMfaAsync(userId, request);

    [Authorize]
    [HttpGet("passkeys")]
    public async Task<IActionResult> GetPasskeys()
        => await _mfaService.GetPasskeysAsync(User.FindFirstValue(ClaimTypes.NameIdentifier));

    [Authorize]
    [HttpPost("passkeys/register-start")]
    public async Task<IActionResult> RegisterPasskeyStart()
        => await _mfaService.RegisterPasskeyStartAsync(User.FindFirstValue(ClaimTypes.NameIdentifier));

    [Authorize]
    [HttpPost("passkeys/register-complete")]
    public async Task<IActionResult> RegisterPasskeyComplete([FromBody] PasskeyRegistrationCompleteDto request)
        => await _mfaService.RegisterPasskeyCompleteAsync(User.FindFirstValue(ClaimTypes.NameIdentifier), request);

    [Authorize]
    [HttpDelete("passkeys/{id}")]
    public async Task<IActionResult> RemovePasskey(Guid id)
        => await _mfaService.RemovePasskeyAsync(User.FindFirstValue(ClaimTypes.NameIdentifier), id);
}
