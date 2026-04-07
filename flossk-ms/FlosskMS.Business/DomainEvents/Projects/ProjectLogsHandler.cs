using FlosskMS.Business.DTOs;
using FlosskMS.Business.Services;

namespace FlosskMS.Business.DomainEvents.Projects;

public class ProjectLogHandler(ILogService logService) : IDomainEventHandler<ProjectLogEvent>
{
    private readonly ILogService _logService = logService;

    public async Task HandleAsync(ProjectLogEvent domainEvent, CancellationToken ct = default)
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
