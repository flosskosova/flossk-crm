namespace FlosskMS.Business.DomainEvents.Announcements;

public sealed record AnnouncementCreatedEvent(
    string Title,
    string CreatedByName,
    string CreatedByUserId
) : IDomainEvent;

public sealed record AnnouncementLogEvent(
    string EntityType,
    string EntityId,
    string? EntityName,
    string Action,
    string? Detail,
    string UserId
) : IDomainEvent;
