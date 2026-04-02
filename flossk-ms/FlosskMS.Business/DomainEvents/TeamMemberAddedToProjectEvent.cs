namespace FlosskMS.Business.DomainEvents;

public sealed record TeamMemberAddedToProjectEvent(
    string UserId,
    string ProjectTitle,
    string? AddedByName
) : IDomainEvent;