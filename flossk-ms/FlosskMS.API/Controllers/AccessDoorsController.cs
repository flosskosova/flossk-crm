using System.Security.Claims;
using FlosskMS.Business.DTOs;
using FlosskMS.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.API.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class AccessDoorsController(IAccessService accessService) : ControllerBase
{
    private readonly IAccessService _accessService = accessService;

    [HttpGet]
    public Task<IActionResult> GetAll() => _accessService.GetDoorsAsync();

    [HttpGet("{id:guid}")]
    public Task<IActionResult> Get(Guid id) => _accessService.GetDoorAsync(id);

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAccessDoorDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        return await _accessService.CreateDoorAsync(dto, userId);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAccessDoorDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        return await _accessService.UpdateDoorAsync(id, dto, userId);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        return await _accessService.DeleteDoorAsync(id, userId);
    }
}
