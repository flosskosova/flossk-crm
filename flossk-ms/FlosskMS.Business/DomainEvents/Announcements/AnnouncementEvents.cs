namespace FlosskMS.Business.DomainEvents.Announcements;

public sealed record AnnouncementCreatedEvent(
    string Title,
    string CreatedByName,
    string CreatedByUserId
) : IDomainEvent;
