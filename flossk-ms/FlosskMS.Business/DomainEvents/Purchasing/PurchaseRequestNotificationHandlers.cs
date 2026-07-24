using FlosskMS.Business.Services;
using FlosskMS.Data.Entities;
using Microsoft.AspNetCore.Identity;

namespace FlosskMS.Business.DomainEvents.Purchasing;

public sealed class PurchaseRequestSubmittedNotificationHandler(
    INotificationService notificationService,
    UserManager<ApplicationUser> userManager)
    : IDomainEventHandler<PurchaseRequestSubmittedEvent>
{
    private readonly INotificationService _notificationService = notificationService;
    private readonly UserManager<ApplicationUser> _userManager = userManager;

    public async Task HandleAsync(PurchaseRequestSubmittedEvent domainEvent, CancellationToken ct = default)
    {
        var admins = await _userManager.GetUsersInRoleAsync("Admin");
        var leaders = await _userManager.GetUsersInRoleAsync("Leader");
        var boardIds = admins.Concat(leaders)
            .Select(u => u.Id)
            .Distinct();

        await _notificationService.SendToManyAsync(
            boardIds,
            NotificationType.PurchaseRequestSubmitted,
            "New purchase request",
            $"{domainEvent.SubmitterName} requested to buy \"{domainEvent.ItemName}\".");
    }
}

public sealed class PurchaseRequestApprovedNotificationHandler(
    INotificationService notificationService)
    : IDomainEventHandler<PurchaseRequestApprovedEvent>
{
    private readonly INotificationService _notificationService = notificationService;

    public async Task HandleAsync(PurchaseRequestApprovedEvent domainEvent, CancellationToken ct = default)
    {
        await _notificationService.SendAsync(
            domainEvent.SubmitterUserId,
            NotificationType.PurchaseRequestApproved,
            "Purchase request approved",
            $"{domainEvent.ReviewerName} approved your request to buy \"{domainEvent.ItemName}\".");
    }
}

public sealed class PurchaseRequestRejectedNotificationHandler(
    INotificationService notificationService)
    : IDomainEventHandler<PurchaseRequestRejectedEvent>
{
    private readonly INotificationService _notificationService = notificationService;

    public async Task HandleAsync(PurchaseRequestRejectedEvent domainEvent, CancellationToken ct = default)
    {
        var reason = string.IsNullOrWhiteSpace(domainEvent.RejectionReason)
            ? ""
            : $" Reason: {domainEvent.RejectionReason}";

        await _notificationService.SendAsync(
            domainEvent.SubmitterUserId,
            NotificationType.PurchaseRequestRejected,
            "Purchase request rejected",
            $"{domainEvent.ReviewerName} rejected your request to buy \"{domainEvent.ItemName}\".{reason}");
    }
}
