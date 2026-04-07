using FlosskMS.Business.DTOs;
using FlosskMS.Business.Services;

namespace FlosskMS.Business.DomainEvents.Inventory;

public class InventoryLogHandler(ILogService logService) : IDomainEventHandler<InventoryLogEvent>
{
    private readonly ILogService _logService = logService;

    public async Task HandleAsync(InventoryLogEvent domainEvent, CancellationToken ct = default)
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
