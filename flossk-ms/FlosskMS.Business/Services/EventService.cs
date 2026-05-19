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
            .ToListAsync();

        var projectsWithoutEvents = await _dbContext.Projects
            .Where(project => !_dbContext.Events.Any(eventEntity => eventEntity.ProjectId == project.Id))
            .ToListAsync();

        var eventDtos = events
            .Select(MapToDto)
            .Concat(projectsWithoutEvents.Select(MapProjectToTimelineDto))
            .OrderBy(eventDto => eventDto.StartDate
                ?? eventDto.EndDate
                ?? eventDto.ProjectStartDate
                ?? eventDto.ProjectEndDate
                ?? eventDto.CreatedAt)
            .ToList();

        return new OkObjectResult(eventDtos);
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
        var validationError = ValidateEventInput(
            request.EventName,
            request.StartDate,
            request.EndDate,
            request.RecurringDate,
            request.RecurringType);
        if (validationError != null)
        {
            return new BadRequestObjectResult(new { Error = validationError });
        }

        var projectValidation = await ValidateProjectAssignmentAsync(request.ProjectId);
        if (projectValidation.ErrorResult != null)
        {
            return projectValidation.ErrorResult;
        }

        var isRecurring = request.RecurringType != RecurringType.None;
        var eventStartDate = isRecurring ? request.RecurringDate : request.StartDate;
        var eventEndDate = isRecurring ? null : request.EndDate;

        var eventEntity = new Event
        {
            Id = Guid.NewGuid(),
            EventName = request.EventName.Trim(),
            StartDate = eventStartDate,
            EndDate = eventEndDate,
            IsRecurring = isRecurring,
            RecurringType = isRecurring ? request.RecurringType : null,
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

        var validationError = ValidateEventInput(
            request.EventName,
            request.StartDate,
            request.EndDate,
            request.RecurringDate,
            request.RecurringType);
        if (validationError != null)
        {
            return new BadRequestObjectResult(new { Error = validationError });
        }

        var projectValidation = await ValidateProjectAssignmentAsync(request.ProjectId, id);
        if (projectValidation.ErrorResult != null)
        {
            return projectValidation.ErrorResult;
        }

        var isRecurring = request.RecurringType != RecurringType.None;
        var eventStartDate = isRecurring ? request.RecurringDate : request.StartDate;
        var eventEndDate = isRecurring ? null : request.EndDate;

        eventEntity.EventName = request.EventName.Trim();
        eventEntity.StartDate = eventStartDate;
        eventEntity.EndDate = eventEndDate;
        eventEntity.IsRecurring = isRecurring;
        eventEntity.RecurringType = isRecurring ? request.RecurringType : null;
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

    private static string? ValidateEventInput(
        string eventName,
        DateTime? startDate,
        DateTime? endDate,
        DateTime? recurringDate,
        RecurringType recurringType)
    {
        if (string.IsNullOrWhiteSpace(eventName))
        {
            return "Event name is required.";
        }

        if (recurringType != RecurringType.None)
        {
            if (!recurringDate.HasValue)
            {
                return "RecurringDate is required when RecurringType is not None.";
            }

            if (startDate.HasValue || endDate.HasValue)
            {
                return "Recurring events must use RecurringDate only. StartDate and EndDate must be null.";
            }

            return null;
        }

        if (recurringDate.HasValue)
        {
            return "RecurringDate must be null when RecurringType is None.";
        }

        var hasRangeStart = startDate.HasValue;
        var hasRangeEnd = endDate.HasValue;

        if (!hasRangeStart && !hasRangeEnd)
        {
            return "StartDate and EndDate are required.";
        }

        if (hasRangeStart != hasRangeEnd)
        {
            return "Both StartDate and EndDate are required.";
        }

        if (hasRangeStart && hasRangeEnd && endDate < startDate)
        {
            return "EndDate must be after or equal to StartDate.";
        }

        return null;
    }

    private static EventDto MapToDto(Event eventEntity)
    {
        var recurringType = eventEntity.RecurringType ?? RecurringType.None;
        var recurringDate = recurringType == RecurringType.None ? null : eventEntity.StartDate;
        var startDate = recurringType == RecurringType.None ? eventEntity.StartDate : null;
        var endDate = recurringType == RecurringType.None ? eventEntity.EndDate : null;

        return new EventDto
        {
            Id = eventEntity.Id,
            EventName = eventEntity.EventName,
            StartDate = startDate,
            EndDate = endDate,
            RecurringDate = recurringDate,
            RecurringType = recurringType,
            IsProjectTimeline = false,
            CreatedAt = eventEntity.CreatedAt,
            UpdatedAt = eventEntity.UpdatedAt,
            ProjectId = eventEntity.ProjectId,
            ProjectTitle = eventEntity.Project?.Title,
            ProjectStartDate = eventEntity.Project?.StartDate,
            ProjectEndDate = eventEntity.Project?.EndDate
        };
    }

    private static EventDto MapProjectToTimelineDto(Project project)
    {
        return new EventDto
        {
            Id = project.Id,
            EventName = $"Project timeline: {project.Title}",
            StartDate = project.StartDate,
            EndDate = project.EndDate,
            RecurringDate = null,
            RecurringType = RecurringType.None,
            IsProjectTimeline = true,
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt,
            ProjectId = project.Id,
            ProjectTitle = project.Title,
            ProjectStartDate = project.StartDate,
            ProjectEndDate = project.EndDate
        };
    }
}