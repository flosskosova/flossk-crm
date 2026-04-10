using FlosskMS.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class LogsController(ILogService logService) : ControllerBase
{
    private readonly ILogService _logService = logService;

    /// <summary>
    /// Get all logs with optional filtering by entityType and/or entityId
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? entityType = null,
        [FromQuery] string? entityId = null,
        [FromQuery] string? userId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? dateFrom = null,
        [FromQuery] string? dateTo = null)
    {
        return await _logService.GetAllAsync(entityType, entityId, userId, page, pageSize, dateFrom, dateTo);
    }

    /// <summary>
    /// Get a single log entry by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        return await _logService.GetByIdAsync(id);
    }

    /// <summary>
    /// Get all logs for a specific entity (e.g. entityType=Inventory, entityId=&lt;guid&gt;)
    /// </summary>
    [HttpGet("{entityType}/{entityId}")]
    public async Task<IActionResult> GetByEntity(string entityType, string entityId)
    {
        return await _logService.GetByEntityAsync(entityType, entityId);
    }

    /// <summary>
    /// Delete a log entry by ID (Admin only)
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        return await _logService.DeleteAsync(id);
    }
}
