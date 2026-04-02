namespace FlosskMS.Business.DomainEvents;

public sealed record TeamMemberAssignedToObjectiveEvent(
    string UserId,
    string ObjectiveTitle,
    string ProjectTitle,
    string? AssignedByName
) : IDomainEvent;
