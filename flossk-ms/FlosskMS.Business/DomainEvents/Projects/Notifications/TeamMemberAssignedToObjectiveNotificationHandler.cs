using FlosskMS.Business.DomainEvents.Projects.Events;
using FlosskMS.Business.Services;
using FlosskMS.Data.Entities;

namespace FlosskMS.Business.DomainEvents.Projects.Notifications;

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
