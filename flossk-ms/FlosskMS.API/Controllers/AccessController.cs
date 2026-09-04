using FlosskMS.Business.DTOs;
using FlosskMS.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.API.Controllers;

/// <summary>
/// Webhook endpoints called by ESP32 lock controllers. Authenticated by the
/// <c>X-Device-Key</c> header matched against a registered, allowed <c>AccessDevice</c>
/// (and, when determinable, its source IP).
/// </summary>
[AllowAnonymous]
[ApiController]
[Route("api/access")]
public class AccessController(IAccessService accessService) : ControllerBase
{
    private readonly IAccessService _accessService = accessService;

    /// <summary>
    /// The door presents a credential; the API answers whether to unlock.
    /// </summary>
    [HttpPost("verify")]
    public async Task<IActionResult> Verify([FromBody] AccessVerifyRequestDto dto)
    {
        var (status, body) = await _accessService.VerifyAccessAsync(ClientIp(), DeviceKey(), dto);
        return StatusCode(status, body);
    }

    /// <summary>
    /// The door reports an event (door opened, forced, held, heartbeat, ...).
    /// </summary>
    [HttpPost("event")]
    public async Task<IActionResult> ReportEvent([FromBody] AccessEventReportDto dto)
    {
        var (status, body) = await _accessService.ReportEventAsync(ClientIp(), DeviceKey(), dto);
        return StatusCode(status, body);
    }

    private string? DeviceKey() =>
        Request.Headers.TryGetValue("X-Device-Key", out var v) ? v.ToString() : null;

    private string? ClientIp()
    {
        if (Request.Headers.TryGetValue("X-Forwarded-For", out var fwd) && !string.IsNullOrWhiteSpace(fwd))
            return fwd.ToString().Split(',')[0].Trim();
        return HttpContext.Connection.RemoteIpAddress?.ToString();
    }
}
