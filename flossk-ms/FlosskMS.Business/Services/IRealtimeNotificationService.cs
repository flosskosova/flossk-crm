using FlosskMS.Business.DTOs;

namespace FlosskMS.Business.Services;

/// <summary>
/// Delivers notifications in real-time via SignalR.
/// Implemented in the API layer where IHubContext is available.
/// </summary>
public interface IRealtimeNotificationService
{
    bool IsUserConnected(string userId);
    Task SendToUserAsync(string userId, NotificationDto notification);
}
