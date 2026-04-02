namespace FlosskMS.Business.DomainEvents.Announcements.Events;

public sealed record AnnouncementCreatedEvent(
    string Title,
    string CreatedByName,
    string CreatedByUserId
) : IDomainEvent;
