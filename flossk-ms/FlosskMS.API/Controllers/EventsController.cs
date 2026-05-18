using FlosskMS.Business.DTOs;
using FlosskMS.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class EventsController(IEventService eventService) : ControllerBase
{
    private readonly IEventService _eventService = eventService;

    /// <summary>
    /// Get all events.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetEvents()
    {
        return await _eventService.GetEventsAsync();
    }

    /// <summary>
    /// Get an event by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetEvent(Guid id)
    {
        return await _eventService.GetEventByIdAsync(id);
    }

    /// <summary>
    /// Get an event by project ID.
    /// </summary>
    [HttpGet("project/{projectId:guid}")]
    public async Task<IActionResult> GetEventByProjectId(Guid projectId)
    {
        return await _eventService.GetEventByProjectIdAsync(projectId);
    }

    /// <summary>
    /// Create a new event.
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> CreateEvent([FromBody] CreateEventDto request)
    {
        return await _eventService.CreateEventAsync(request);
    }

    /// <summary>
    /// Update an event.
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateEvent(Guid id, [FromBody] UpdateEventDto request)
    {
        return await _eventService.UpdateEventAsync(id, request);
    }

    /// <summary>
    /// Delete an event.
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteEvent(Guid id)
    {
        return await _eventService.DeleteEventAsync(id);
    }
}
