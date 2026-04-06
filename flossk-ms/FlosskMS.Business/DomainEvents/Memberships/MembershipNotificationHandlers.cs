using FlosskMS.Business.Services;
using FlosskMS.Data.Entities;
using Microsoft.AspNetCore.Identity;

namespace FlosskMS.Business.DomainEvents.Memberships;

public sealed class MembershipApplicationSubmittedNotificationHandler(
    INotificationService notificationService,
    UserManager<ApplicationUser> userManager)
    : IDomainEventHandler<MembershipApplicationSubmittedEvent>
{
    private readonly INotificationService _notificationService = notificationService;
    private readonly UserManager<ApplicationUser> _userManager = userManager;

    public async Task HandleAsync(MembershipApplicationSubmittedEvent domainEvent, CancellationToken ct = default)
    {
        var admins = await _userManager.GetUsersInRoleAsync("Admin");
        var adminIds = admins.Select(a => a.Id);

        await _notificationService.SendToManyAsync(
            adminIds,
            NotificationType.MembershipApplicationReceived,
            "New membership application",
            $"{domainEvent.ApplicantName} ({domainEvent.Email}) has submitted a membership application.");
    }
}

public sealed class MembershipRequestApprovedNotificationHandler(
    INotificationService notificationService,
    UserManager<ApplicationUser> userManager)
    : IDomainEventHandler<MembershipRequestApprovedEvent>
{
    private readonly INotificationService _notificationService = notificationService;
    private readonly UserManager<ApplicationUser> _userManager = userManager;

    public async Task HandleAsync(MembershipRequestApprovedEvent domainEvent, CancellationToken ct = default)
    {
        var admins = await _userManager.GetUsersInRoleAsync("Admin");
        var adminIds = admins
            .Where(a => a.Id != domainEvent.ReviewerUserId)
            .Select(a => a.Id);

        await _notificationService.SendToManyAsync(
            adminIds,
            NotificationType.MembershipApprovedAdmin,
            "Membership approved",
            $"{domainEvent.ReviewerName} approved the membership request from {domainEvent.ApplicantName} ({domainEvent.Email}).");
    }
}

public sealed class MembershipRequestRejectedNotificationHandler(
    INotificationService notificationService,
    UserManager<ApplicationUser> userManager)
    : IDomainEventHandler<MembershipRequestRejectedEvent>
{
    private readonly INotificationService _notificationService = notificationService;
    private readonly UserManager<ApplicationUser> _userManager = userManager;

    public async Task HandleAsync(MembershipRequestRejectedEvent domainEvent, CancellationToken ct = default)
    {
        var admins = await _userManager.GetUsersInRoleAsync("Admin");
        var adminIds = admins
            .Where(a => a.Id != domainEvent.ReviewerUserId)
            .Select(a => a.Id);

        await _notificationService.SendToManyAsync(
            adminIds,
            NotificationType.MembershipRejectedAdmin,
            "Membership rejected",
            $"{domainEvent.ReviewerName} rejected the membership request from {domainEvent.ApplicantName} ({domainEvent.Email}).");
    }
}
