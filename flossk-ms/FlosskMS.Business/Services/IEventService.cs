using FlosskMS.Business.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.Business.Services;

public interface IEventService
{
    Task<IActionResult> GetEventsAsync();
    Task<IActionResult> GetEventByIdAsync(Guid id);
    Task<IActionResult> GetEventByProjectIdAsync(Guid projectId);
    Task<IActionResult> CreateEventAsync(CreateEventDto request);
    Task<IActionResult> UpdateEventAsync(Guid id, UpdateEventDto request);
    Task<IActionResult> DeleteEventAsync(Guid id);
}