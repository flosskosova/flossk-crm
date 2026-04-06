using FlosskMS.Business.Services;
using FlosskMS.Data.Entities;

namespace FlosskMS.Business.DomainEvents.Projects;

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

public sealed class TeamMemberRemovedFromProjectNotificationHandler(INotificationService notificationService)
    : IDomainEventHandler<TeamMemberRemovedFromProjectEvent>
{
    private readonly INotificationService _notificationService = notificationService;

    public async Task HandleAsync(TeamMemberRemovedFromProjectEvent domainEvent, CancellationToken ct = default)
    {
        var body = string.IsNullOrEmpty(domainEvent.RemovedByName)
            ? $"You have been removed from the project \"{domainEvent.ProjectTitle}\"."
            : $"{domainEvent.RemovedByName} removed you from the project \"{domainEvent.ProjectTitle}\".";

        await _notificationService.SendAsync(
            domainEvent.UserId,
            NotificationType.ProjectRemoved,
            "Removed from project",
            body);
    }
}

public sealed class TeamMemberAssignedToObjectiveNotificationHandler(INotificationService notificationService)
    : IDomainEventHandler<TeamMemberAssignedToObjectiveEvent>
{
    private readonly INotificationService _notificationService = notificationService;

    public async Task HandleAsync(TeamMemberAssignedToObjectiveEvent domainEvent, CancellationToken ct = default)
    {
        var body = string.IsNullOrEmpty(domainEvent.AssignedByName)
            ? $"You have been assigned to the objective \"{domainEvent.ObjectiveTitle}\" in project \"{domainEvent.ProjectTitle}\"."
            : $"{domainEvent.AssignedByName} assigned you to the objective \"{domainEvent.ObjectiveTitle}\" in project \"{domainEvent.ProjectTitle}\".";

        await _notificationService.SendAsync(
            domainEvent.UserId,
            NotificationType.ObjectiveAssigned,
            "Assigned to objective",
            body);
    }
}

public sealed class TeamMemberRemovedFromObjectiveNotificationHandler(INotificationService notificationService)
    : IDomainEventHandler<TeamMemberRemovedFromObjectiveEvent>
{
    private readonly INotificationService _notificationService = notificationService;

    public async Task HandleAsync(TeamMemberRemovedFromObjectiveEvent domainEvent, CancellationToken ct = default)
    {
        var body = string.IsNullOrEmpty(domainEvent.RemovedByName)
            ? $"You have been removed from the objective \"{domainEvent.ObjectiveTitle}\" in project \"{domainEvent.ProjectTitle}\"."
            : $"{domainEvent.RemovedByName} removed you from the objective \"{domainEvent.ObjectiveTitle}\" in project \"{domainEvent.ProjectTitle}\".";

        await _notificationService.SendAsync(
            domainEvent.UserId,
            NotificationType.ObjectiveRemoved,
            "Removed from objective",
            body);
    }
}

public sealed class TeamMemberPromotedToModeratorNotificationHandler(INotificationService notificationService)
    : IDomainEventHandler<TeamMemberPromotedToModeratorEvent>
{
    private readonly INotificationService _notificationService = notificationService;

    public async Task HandleAsync(TeamMemberPromotedToModeratorEvent domainEvent, CancellationToken ct = default)
    {
        var body = string.IsNullOrEmpty(domainEvent.PromotedByName)
            ? $"You have been promoted to moderator in the project \"{domainEvent.ProjectTitle}\"."
            : $"{domainEvent.PromotedByName} promoted you to moderator in the project \"{domainEvent.ProjectTitle}\".";

        await _notificationService.SendAsync(
            domainEvent.UserId,
            NotificationType.ProjectModeratorPromoted,
            "Promoted to moderator",
            body);
    }
}

public sealed class TeamMemberDemotedFromModeratorNotificationHandler(INotificationService notificationService)
    : IDomainEventHandler<TeamMemberDemotedFromModeratorEvent>
{
    private readonly INotificationService _notificationService = notificationService;

    public async Task HandleAsync(TeamMemberDemotedFromModeratorEvent domainEvent, CancellationToken ct = default)
    {
        var body = string.IsNullOrEmpty(domainEvent.DemotedByName)
            ? $"You have been removed as moderator from the project \"{domainEvent.ProjectTitle}\"."
            : $"{domainEvent.DemotedByName} removed you as moderator from the project \"{domainEvent.ProjectTitle}\".";

        await _notificationService.SendAsync(
            domainEvent.UserId,
            NotificationType.ProjectModeratorDemoted,
            "Removed as moderator",
            body);
    }
}
