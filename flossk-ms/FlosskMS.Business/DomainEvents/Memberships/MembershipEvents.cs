namespace FlosskMS.Business.DomainEvents.Memberships;

public sealed record MembershipRequestApprovedEvent(
    string ApplicantName,
    string Email,
    string ReviewerUserId
) : IDomainEvent;

public sealed record MembershipRequestRejectedEvent(
    string ApplicantName,
    string Email,
    string ReviewerUserId
) : IDomainEvent;

public sealed record MembershipApplicationSubmittedEvent(
    string ApplicantName,
    string Email
) : IDomainEvent;
