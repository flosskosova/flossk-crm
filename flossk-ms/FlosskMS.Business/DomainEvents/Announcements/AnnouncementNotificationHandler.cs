using FlosskMS.Business.Services;
using FlosskMS.Data;
using FlosskMS.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace FlosskMS.Business.DomainEvents.Announcements.Notifications;

public sealed class AnnouncementCreatedNotificationHandler(
    INotificationService notificationService,
    ApplicationDbContext dbContext)
    : IDomainEventHandler<AnnouncementCreatedEvent>
{
    private readonly INotificationService _notificationService = notificationService;
    private readonly ApplicationDbContext _dbContext = dbContext;

    public async Task HandleAsync(AnnouncementCreatedEvent domainEvent, CancellationToken ct = default)
    {
        var userIds = await _dbContext.Users
            .Where(u => u.Id != domainEvent.CreatedByUserId)
            .Select(u => u.Id)
            .ToListAsync(ct);

        var body = $"{domainEvent.CreatedByName} posted a new announcement: \"{domainEvent.Title}\".";

        await _notificationService.SendToManyAsync(
            userIds,
            NotificationType.Announcement,
            "New Announcement",
            body);
    }
}
