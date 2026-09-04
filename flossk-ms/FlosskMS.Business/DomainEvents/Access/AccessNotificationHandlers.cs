using FlosskMS.Business.Services;
using FlosskMS.Data.Entities;

namespace FlosskMS.Business.DomainEvents.Access;

public sealed class AccessCredentialAssignedNotificationHandler(INotificationService notificationService)
    : IDomainEventHandler<AccessCredentialAssignedEvent>
{
    private readonly INotificationService _notificationService = notificationService;

    public Task HandleAsync(AccessCredentialAssignedEvent e, CancellationToken ct = default) =>
        _notificationService.SendAsync(
            e.MemberUserId,
            NotificationType.AccessCredentialAssigned,
            "Door access credential assigned",
            $"{e.ActorName} assigned you a {Label(e.CredentialType)}. It stays inactive until a board member accepts it.");

    private static string Label(string type) => type == "HomeKey" ? "Home Key credential" : "door access card";
}

public sealed class AccessCredentialAcceptedNotificationHandler(INotificationService notificationService)
    : IDomainEventHandler<AccessCredentialAcceptedEvent>
{
    private readonly INotificationService _notificationService = notificationService;

    public Task HandleAsync(AccessCredentialAcceptedEvent e, CancellationToken ct = default) =>
        _notificationService.SendAsync(
            e.MemberUserId,
            NotificationType.AccessCredentialAccepted,
            "Door access enabled",
            $"{e.ActorName} enabled your {Label(e.CredentialType)}. You can now open the door.");

    private static string Label(string type) => type == "HomeKey" ? "Home Key credential" : "door access card";
}

public sealed class AccessCredentialDeclinedNotificationHandler(INotificationService notificationService)
    : IDomainEventHandler<AccessCredentialDeclinedEvent>
{
    private readonly INotificationService _notificationService = notificationService;

    public Task HandleAsync(AccessCredentialDeclinedEvent e, CancellationToken ct = default)
    {
        var reason = string.IsNullOrWhiteSpace(e.Reason) ? "" : $" Reason: {e.Reason}";
        return _notificationService.SendAsync(
            e.MemberUserId,
            NotificationType.AccessCredentialDeclined,
            "Door access declined",
            $"{e.ActorName} declined your {Label(e.CredentialType)}.{reason}");
    }

    private static string Label(string type) => type == "HomeKey" ? "Home Key credential" : "door access card";
}

public sealed class AccessCredentialRevokedNotificationHandler(INotificationService notificationService)
    : IDomainEventHandler<AccessCredentialRevokedEvent>
{
    private readonly INotificationService _notificationService = notificationService;

    public Task HandleAsync(AccessCredentialRevokedEvent e, CancellationToken ct = default)
    {
        var reason = string.IsNullOrWhiteSpace(e.Reason) ? "" : $" Reason: {e.Reason}";
        return _notificationService.SendAsync(
            e.MemberUserId,
            NotificationType.AccessCredentialRevoked,
            "Door access revoked",
            $"{e.ActorName} revoked your {Label(e.CredentialType)}.{reason}");
    }

    private static string Label(string type) => type == "HomeKey" ? "Home Key credential" : "door access card";
}
