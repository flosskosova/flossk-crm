namespace FlosskMS.Business.DomainEvents.Access;

/// <summary>Generic audit-log entry for the Administration → Audit Logs screen.</summary>
public sealed record AccessLogEvent(
    string EntityType,
    string EntityId,
    string? EntityName,
    string Action,
    string? Detail,
    string UserId
) : IDomainEvent;

public sealed record AccessCredentialAssignedEvent(
    string MemberUserId,
    string CredentialType,
    string ActorName
) : IDomainEvent;

public sealed record AccessCredentialAcceptedEvent(
    string MemberUserId,
    string CredentialType,
    string ActorName
) : IDomainEvent;

public sealed record AccessCredentialDeclinedEvent(
    string MemberUserId,
    string CredentialType,
    string ActorName,
    string? Reason
) : IDomainEvent;

public sealed record AccessCredentialRevokedEvent(
    string MemberUserId,
    string CredentialType,
    string ActorName,
    string? Reason
) : IDomainEvent;
