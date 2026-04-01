using FlosskMS.Business.DTOs;

namespace FlosskMS.Business.Services;

/// <summary>
/// Delivers notifications via Web Push (VAPID).
/// Implemented in the API layer where VAPID keys are configured.
/// </summary>
public interface IPushNotificationService
{
    Task<bool> SendToUserAsync(string userId, NotificationDto notification);
}
