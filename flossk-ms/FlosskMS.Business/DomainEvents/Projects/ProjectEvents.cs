namespace FlosskMS.Business.DomainEvents.Projects;

public sealed record TeamMemberAddedToProjectEvent(
    string UserId,
    string ProjectTitle,
    string? AddedByName
) : IDomainEvent;

public sealed record TeamMemberRemovedFromProjectEvent(
    string UserId,
    string ProjectTitle,
    string? RemovedByName
) : IDomainEvent;

public sealed record TeamMemberAssignedToObjectiveEvent(
    string UserId,
    string ObjectiveTitle,
    string ProjectTitle,
    string? AssignedByName
) : IDomainEvent;

public sealed record TeamMemberRemovedFromObjectiveEvent(
    string UserId,
    string ObjectiveTitle,
    string ProjectTitle,
    string? RemovedByName
) : IDomainEvent;

public sealed record TeamMemberPromotedToModeratorEvent(
    string UserId,
    string ProjectTitle,
    string? PromotedByName
) : IDomainEvent;

public sealed record TeamMemberDemotedFromModeratorEvent(
    string UserId,
    string ProjectTitle,
    string? DemotedByName
) : IDomainEvent;

public sealed record ProjectLogEvent(
    string EntityType,
    string EntityId,
    string? EntityName,
    string Action,
    string? Detail,
    string UserId
) : IDomainEvent;
