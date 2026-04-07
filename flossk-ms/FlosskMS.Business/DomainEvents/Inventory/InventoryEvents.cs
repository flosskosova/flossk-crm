namespace FlosskMS.Business.DomainEvents.Inventory;

public sealed record InventoryLogEvent(
    string EntityType,
    string EntityId,
    string? EntityName,
    string Action,
    string? Detail,
    string UserId
) : IDomainEvent;
