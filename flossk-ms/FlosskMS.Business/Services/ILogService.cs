using FlosskMS.Business.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.Business.Services;

public interface ILogService
{
    /// <summary>Creates a new log entry.</summary>
    Task CreateAsync(CreateLogDto dto);

    /// <summary>Returns all logs, optionally filtered by entity type, entity ID, user, and date range.</summary>
    Task<IActionResult> GetAllAsync(string? entityType = null, string? entityId = null, string? userId = null, int page = 1, int pageSize = 50, string? dateFrom = null, string? dateTo = null);

    /// <summary>Returns a single log by ID.</summary>
    Task<IActionResult> GetByIdAsync(Guid id);

    /// <summary>Returns all logs for a specific entity.</summary>
    Task<IActionResult> GetByEntityAsync(string entityType, string entityId);

    /// <summary>Deletes a log entry by ID.</summary>
    Task<IActionResult> DeleteAsync(Guid id);
}
