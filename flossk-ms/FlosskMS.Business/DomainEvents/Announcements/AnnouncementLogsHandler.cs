using FlosskMS.Business.DTOs;
using FlosskMS.Business.Services;

namespace FlosskMS.Business.DomainEvents.Announcements;

public class AnnouncementLogsHandler(ILogService logService) : IDomainEventHandler<AnnouncementLogEvent>
{
    private readonly ILogService _logService = logService;

    public async Task HandleAsync(AnnouncementLogEvent domainEvent, CancellationToken ct = default)
    {
        await _logService.CreateAsync(new CreateLogDto
        {
            EntityType = domainEvent.EntityType,
            EntityId = domainEvent.EntityId,
            EntityName = domainEvent.EntityName ?? string.Empty,
            Action = domainEvent.Action,
            Detail = domainEvent.Detail,
            UserId = domainEvent.UserId
        });
    }
}
