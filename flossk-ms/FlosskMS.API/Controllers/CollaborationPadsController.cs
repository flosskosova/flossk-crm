using System.Security.Claims;
using FlosskMS.Business.DTOs;
using FlosskMS.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CollaborationPadsController(ICollaborationPadService collaborationPadService) : ControllerBase
{
    private readonly ICollaborationPadService _collaborationPadService = collaborationPadService;

    /// <summary>
    /// Create a new collaboration pad (Admin only)
    /// </summary>
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> CreateCollaborationPad([FromBody] CreateCollaborationPadDto request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }
        return await _collaborationPadService.CreateCollaborationPadAsync(request, userId);
    }

    /// <summary>
    /// Get all collaboration pads with optional filtering and pagination
    /// </summary>
    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetCollaborationPads(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null)
    {
        return await _collaborationPadService.GetCollaborationPadsAsync(page, pageSize, search);
    }

    /// <summary>
    /// Get a specific collaboration pad by ID
    /// </summary>
    [Authorize]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetCollaborationPadById(Guid id)
    {
        return await _collaborationPadService.GetCollaborationPadByIdAsync(id);
    }

    /// <summary>
    /// Delete a collaboration pad
    /// </summary>
    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteCollaborationPad(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }
        return await _collaborationPadService.DeleteCollaborationPadAsync(id, userId);
    }

    /// <summary>
    /// Update a collaboration pad
    /// </summary>
    [Authorize]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateCollaborationPad(Guid id, [FromBody] UpdateCollaborationPadDto request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }
        return await _collaborationPadService.UpdateCollaborationPadAsync(id, request, userId);
    }
}
