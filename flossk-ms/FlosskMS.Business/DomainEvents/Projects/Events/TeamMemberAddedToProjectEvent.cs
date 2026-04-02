namespace FlosskMS.Business.DomainEvents.Projects.Events;

public sealed record TeamMemberAddedToProjectEvent(
    string UserId,
    string ProjectTitle,
    string? AddedByName
) : IDomainEvent;