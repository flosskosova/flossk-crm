using FlosskMS.Business.DomainEvents.Projects.Events;
using FlosskMS.Business.Services;
using FlosskMS.Data.Entities;

namespace FlosskMS.Business.DomainEvents.Projects.Notifications;

public sealed class TeamMemberAddedNotificationHandler(INotificationService notificationService)
    : IDomainEventHandler<TeamMemberAddedToProjectEvent>
{
    private readonly INotificationService _notificationService = notificationService;

    public async Task HandleAsync(TeamMemberAddedToProjectEvent domainEvent, CancellationToken ct = default)
    {
        var body = string.IsNullOrEmpty(domainEvent.AddedByName)
            ? $"You have been added to the project \"{domainEvent.ProjectTitle}\"."
            : $"{domainEvent.AddedByName} added you to the project \"{domainEvent.ProjectTitle}\".";

        await _notificationService.SendAsync(
            domainEvent.UserId,
            NotificationType.ProjectInvite,
            "Added to project",
            body);
    }
}