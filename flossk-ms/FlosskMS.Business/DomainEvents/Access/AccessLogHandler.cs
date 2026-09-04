using FlosskMS.Business.DTOs;
using FlosskMS.Business.Services;

namespace FlosskMS.Business.DomainEvents.Access;

public class AccessLogHandler(ILogService logService) : IDomainEventHandler<AccessLogEvent>
{
    private readonly ILogService _logService = logService;

    public async Task HandleAsync(AccessLogEvent domainEvent, CancellationToken ct = default)
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
