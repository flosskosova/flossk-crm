namespace FlosskMS.Business.DomainEvents.Purchasing;

public sealed record PurchaseRequestSubmittedEvent(
    string ItemName,
    string SubmitterName,
    string SubmitterUserId
) : IDomainEvent;

public sealed record PurchaseRequestApprovedEvent(
    string ItemName,
    string SubmitterUserId,
    string ReviewerName
) : IDomainEvent;

public sealed record PurchaseRequestRejectedEvent(
    string ItemName,
    string SubmitterUserId,
    string ReviewerName,
    string? RejectionReason
) : IDomainEvent;
