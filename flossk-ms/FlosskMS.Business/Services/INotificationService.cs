using FlosskMS.Business.DTOs;
using FlosskMS.Data.Entities;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.Business.Services;

public interface INotificationService
{
    /// <summary>
    /// Send a notification to a user (persists to DB + delivers via available channels)
    /// </summary>
    Task<NotificationDto> SendAsync(string userId, NotificationType type, string title, string body,
        string? metadata = null, NotificationPriority priority = NotificationPriority.Normal);

    /// <summary>
    /// Send a notification to multiple users
    /// </summary>
    Task SendToManyAsync(IEnumerable<string> userIds, NotificationType type, string title, string body,
        string? metadata = null, NotificationPriority priority = NotificationPriority.Normal);

    Task<IActionResult> GetUnreadAsync(string? userId);
    Task<IActionResult> GetAllAsync(string? userId, int page = 1, int pageSize = 20);
    Task<IActionResult> GetUnreadCountAsync(string? userId);
    Task<IActionResult> MarkAsReadAsync(string? userId, Guid notificationId);
    Task<IActionResult> MarkAllAsReadAsync(string? userId);
    Task<IActionResult> DeleteAsync(string? userId, Guid notificationId);

    // Push subscription management
    Task<IActionResult> SubscribePushAsync(string? userId, CreatePushSubscriptionDto dto);
    Task<IActionResult> UnsubscribePushAsync(string? userId, string endpoint);
}
