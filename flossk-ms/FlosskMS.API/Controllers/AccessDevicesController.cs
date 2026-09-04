using System.Security.Claims;
using FlosskMS.Business.DTOs;
using FlosskMS.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.API.Controllers;

/// <summary>
/// Manage the ESP32 lock controllers (the "settings page"): register a device's IP,
/// allow/deny it, rotate its shared secret, and pull state from it.
/// </summary>
[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class AccessDevicesController(IAccessService accessService) : ControllerBase
{
    private readonly IAccessService _accessService = accessService;

    [HttpGet]
    public Task<IActionResult> GetAll([FromQuery] Guid? doorId = null) => _accessService.GetDevicesAsync(doorId);

    [HttpGet("{id:guid}")]
    public Task<IActionResult> Get(Guid id) => _accessService.GetDeviceAsync(id);

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAccessDeviceDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        return await _accessService.CreateDeviceAsync(dto, userId);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAccessDeviceDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        return await _accessService.UpdateDeviceAsync(id, dto, userId);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        return await _accessService.DeleteDeviceAsync(id, userId);
    }

    /// <summary>Pull current state from the device ("grab data").</summary>
    [HttpPost("{id:guid}/sync")]
    public Task<IActionResult> Sync(Guid id) => _accessService.SyncDeviceAsync(id);
}
