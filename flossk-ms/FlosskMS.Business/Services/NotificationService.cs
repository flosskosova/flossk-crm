using FlosskMS.Business.DTOs;
using FlosskMS.Data;
using FlosskMS.Data.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FlosskMS.Business.Services;

public class NotificationService(
    ApplicationDbContext dbContext,
    IRealtimeNotificationService realtimeService,
    IPushNotificationService pushService) : INotificationService
{
    private readonly ApplicationDbContext _dbContext = dbContext;
    private readonly IRealtimeNotificationService _realtimeService = realtimeService;
    private readonly IPushNotificationService _pushService = pushService;

    public async Task<NotificationDto> SendAsync(string userId, NotificationType type, string title, string body,
        string? metadata = null, NotificationPriority priority = NotificationPriority.Normal)
    {
        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Type = type,
            Priority = priority,
            Title = title,
            Body = body,
            Metadata = metadata,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Notifications.Add(notification);
        await _dbContext.SaveChangesAsync();

        var dto = MapToDto(notification);

        // Channel selection: deliver via available channels
        var userIsConnected = _realtimeService.IsUserConnected(userId);

        if (userIsConnected)
        {
            // User has the app open — deliver via SignalR
            await _realtimeService.SendToUserAsync(userId, dto);
        }

        // For Important notifications, always send Web Push (even if connected — tab might be buried)
        // For Normal notifications, only send Web Push if user is NOT connected via SignalR
        if (priority == NotificationPriority.Important || !userIsConnected)
        {
            await _pushService.SendToUserAsync(userId, dto);
        }

        return dto;
    }

    public async Task SendToManyAsync(IEnumerable<string> userIds, NotificationType type, string title, string body,
        string? metadata = null, NotificationPriority priority = NotificationPriority.Normal)
    {
        foreach (var userId in userIds)
        {
            await SendAsync(userId, type, title, body, metadata, priority);
        }
    }

    public async Task<IActionResult> GetUnreadAsync(string? userId)
    {
        if (string.IsNullOrEmpty(userId))
            return new ObjectResult(new { Message = "User not found." }) { StatusCode = 401 };

        var notifications = await _dbContext.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => MapToDto(n))
            .ToListAsync();

        return new OkObjectResult(notifications);
    }

    public async Task<IActionResult> GetAllAsync(string? userId, int page = 1, int pageSize = 20)
    {
        if (string.IsNullOrEmpty(userId))
            return new ObjectResult(new { Message = "User not found." }) { StatusCode = 401 };

        var query = _dbContext.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt);

        var totalCount = await query.CountAsync();
        var notifications = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => MapToDto(n))
            .ToListAsync();

        return new OkObjectResult(new
        {
            Items = notifications,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    public async Task<IActionResult> GetUnreadCountAsync(string? userId)
    {
        if (string.IsNullOrEmpty(userId))
            return new ObjectResult(new { Message = "User not found." }) { StatusCode = 401 };

        var count = await _dbContext.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead);

        return new OkObjectResult(new { Count = count });
    }

    public async Task<IActionResult> MarkAsReadAsync(string? userId, Guid notificationId)
    {
        if (string.IsNullOrEmpty(userId))
            return new ObjectResult(new { Message = "User not found." }) { StatusCode = 401 };

        var notification = await _dbContext.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notification == null)
            return new NotFoundObjectResult(new { Message = "Notification not found." });

        notification.IsRead = true;
        notification.ReadAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return new OkObjectResult(new { Message = "Notification marked as read." });
    }

    public async Task<IActionResult> MarkAllAsReadAsync(string? userId)
    {
        if (string.IsNullOrEmpty(userId))
            return new ObjectResult(new { Message = "User not found." }) { StatusCode = 401 };

        await _dbContext.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s
                .SetProperty(n => n.IsRead, true)
                .SetProperty(n => n.ReadAt, DateTime.UtcNow));

        return new OkObjectResult(new { Message = "All notifications marked as read." });
    }

    public async Task<IActionResult> DeleteAsync(string? userId, Guid notificationId)
    {
        if (string.IsNullOrEmpty(userId))
            return new ObjectResult(new { Message = "User not found." }) { StatusCode = 401 };

        var notification = await _dbContext.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notification == null)
            return new NotFoundObjectResult(new { Message = "Notification not found." });

        _dbContext.Notifications.Remove(notification);
        await _dbContext.SaveChangesAsync();

        return new OkObjectResult(new { Message = "Notification deleted." });
    }

    public async Task<IActionResult> SubscribePushAsync(string? userId, CreatePushSubscriptionDto dto)
    {
        if (string.IsNullOrEmpty(userId))
            return new ObjectResult(new { Message = "User not found." }) { StatusCode = 401 };

        // Remove existing subscription with same endpoint (re-subscribe)
        var existing = await _dbContext.PushSubscriptions
            .FirstOrDefaultAsync(s => s.Endpoint == dto.Endpoint);
        if (existing != null)
            _dbContext.PushSubscriptions.Remove(existing);

        var subscription = new PushSubscription
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Endpoint = dto.Endpoint,
            P256dh = dto.P256dh,
            Auth = dto.Auth,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.PushSubscriptions.Add(subscription);
        await _dbContext.SaveChangesAsync();

        return new OkObjectResult(new { Message = "Push subscription registered." });
    }

    public async Task<IActionResult> UnsubscribePushAsync(string? userId, string endpoint)
    {
        if (string.IsNullOrEmpty(userId))
            return new ObjectResult(new { Message = "User not found." }) { StatusCode = 401 };

        var subscription = await _dbContext.PushSubscriptions
            .FirstOrDefaultAsync(s => s.UserId == userId && s.Endpoint == endpoint);

        if (subscription == null)
            return new NotFoundObjectResult(new { Message = "Subscription not found." });

        _dbContext.PushSubscriptions.Remove(subscription);
        await _dbContext.SaveChangesAsync();

        return new OkObjectResult(new { Message = "Push subscription removed." });
    }

    private static NotificationDto MapToDto(Notification n) => new()
    {
        Id = n.Id,
        Type = n.Type.ToString(),
        Priority = n.Priority.ToString(),
        Title = n.Title,
        Body = n.Body,
        Metadata = n.Metadata,
        IsRead = n.IsRead,
        CreatedAt = n.CreatedAt,
        ReadAt = n.ReadAt
    };
}
