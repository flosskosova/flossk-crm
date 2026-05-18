using FlosskMS.Business.DTOs;
using FlosskMS.Data;
using FlosskMS.Data.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FlosskMS.Business.Services;

public class EventService(
    ApplicationDbContext dbContext,
    ILogger<EventService> logger) : IEventService
{
    private readonly ApplicationDbContext _dbContext = dbContext;
    private readonly ILogger<EventService> _logger = logger;

    public async Task<IActionResult> GetEventsAsync()
    {
        var events = await _dbContext.Events
            .Include(e => e.Project)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();

        return new OkObjectResult(events.Select(MapToDto));
    }

    public async Task<IActionResult> GetEventByIdAsync(Guid id)
    {
        var eventEntity = await _dbContext.Events
            .Include(e => e.Project)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (eventEntity == null)
        {
            return new NotFoundObjectResult(new { Error = "Event not found." });
        }

        return new OkObjectResult(MapToDto(eventEntity));
    }

    public async Task<IActionResult> GetEventByProjectIdAsync(Guid projectId)
    {
        var eventEntity = await _dbContext.Events
            .Include(e => e.Project)
            .FirstOrDefaultAsync(e => e.ProjectId == projectId);

        if (eventEntity == null)
        {
            return new NotFoundObjectResult(new { Error = "No event found for this project." });
        }

        return new OkObjectResult(MapToDto(eventEntity));
    }

    public async Task<IActionResult> CreateEventAsync(CreateEventDto request)
    {
        var validationError = ValidateEventInput(request.EventName, request.Date, request.StartDate, request.EndDate);
        if (validationError != null)
        {
            return new BadRequestObjectResult(new { Error = validationError });
        }

        var projectValidation = await ValidateProjectAssignmentAsync(request.ProjectId);
        if (projectValidation.ErrorResult != null)
        {
            return projectValidation.ErrorResult;
        }

        var eventEntity = new Event
        {
            Id = Guid.NewGuid(),
            EventName = request.EventName.Trim(),
            Date = request.Date,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            IsRecurring = request.IsRecurring,
            ProjectId = request.ProjectId,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Events.Add(eventEntity);
        await _dbContext.SaveChangesAsync();

        eventEntity.Project = projectValidation.Project;

        _logger.LogInformation("Event {EventId} created", eventEntity.Id);

        return new OkObjectResult(MapToDto(eventEntity));
    }

    public async Task<IActionResult> UpdateEventAsync(Guid id, UpdateEventDto request)
    {
        var eventEntity = await _dbContext.Events
            .Include(e => e.Project)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (eventEntity == null)
        {
            return new NotFoundObjectResult(new { Error = "Event not found." });
        }

        var validationError = ValidateEventInput(request.EventName, request.Date, request.StartDate, request.EndDate);
        if (validationError != null)
        {
            return new BadRequestObjectResult(new { Error = validationError });
        }

        var projectValidation = await ValidateProjectAssignmentAsync(request.ProjectId, id);
        if (projectValidation.ErrorResult != null)
        {
            return projectValidation.ErrorResult;
        }

        eventEntity.EventName = request.EventName.Trim();
        eventEntity.Date = request.Date;
        eventEntity.StartDate = request.StartDate;
        eventEntity.EndDate = request.EndDate;
        eventEntity.IsRecurring = request.IsRecurring;
        eventEntity.ProjectId = request.ProjectId;
        eventEntity.Project = projectValidation.Project;
        eventEntity.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Event {EventId} updated", eventEntity.Id);

        return new OkObjectResult(MapToDto(eventEntity));
    }

    public async Task<IActionResult> DeleteEventAsync(Guid id)
    {
        var eventEntity = await _dbContext.Events.FindAsync(id);

        if (eventEntity == null)
        {
            return new NotFoundObjectResult(new { Error = "Event not found." });
        }

        _dbContext.Events.Remove(eventEntity);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Event {EventId} deleted", id);

        return new NoContentResult();
    }

    private async Task<(Project? Project, IActionResult? ErrorResult)> ValidateProjectAssignmentAsync(Guid? projectId, Guid? eventId = null)
    {
        if (!projectId.HasValue)
        {
            return (null, null);
        }

        var project = await _dbContext.Projects.FindAsync(projectId.Value);
        if (project == null)
        {
            return (null, new NotFoundObjectResult(new { Error = "Project not found." }));
        }

        var projectAlreadyAssigned = await _dbContext.Events
            .AnyAsync(e => e.ProjectId == projectId.Value && (!eventId.HasValue || e.Id != eventId.Value));

        if (projectAlreadyAssigned)
        {
            return (null, new ConflictObjectResult(new { Error = "This project is already linked to another event." }));
        }

        return (project, null);
    }

    private static string? ValidateEventInput(string eventName, DateTime? date, DateTime? startDate, DateTime? endDate)
    {
        if (string.IsNullOrWhiteSpace(eventName))
        {
            return "Event name is required.";
        }

        var hasSingleDate = date.HasValue;
        var hasRangeStart = startDate.HasValue;
        var hasRangeEnd = endDate.HasValue;

        if (hasSingleDate && (hasRangeStart || hasRangeEnd))
        {
            return "Provide either Date for a one-time event or StartDate and EndDate for a multi-day event, not both.";
        }

        if (!hasSingleDate && !hasRangeStart && !hasRangeEnd)
        {
            return "Either Date or StartDate and EndDate must be provided.";
        }

        if (hasRangeStart != hasRangeEnd)
        {
            return "Both StartDate and EndDate are required for a multi-day event.";
        }

        if (hasRangeStart && hasRangeEnd && endDate < startDate)
        {
            return "EndDate must be after or equal to StartDate.";
        }

        return null;
    }

    private static EventDto MapToDto(Event eventEntity)
    {
        return new EventDto
        {
            Id = eventEntity.Id,
            EventName = eventEntity.EventName,
            Date = eventEntity.Date,
            StartDate = eventEntity.StartDate,
            EndDate = eventEntity.EndDate,
            IsRecurring = eventEntity.IsRecurring,
            CreatedAt = eventEntity.CreatedAt,
            UpdatedAt = eventEntity.UpdatedAt,
            ProjectId = eventEntity.ProjectId,
            ProjectTitle = eventEntity.Project?.Title
        };
    }
}