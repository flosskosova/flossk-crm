using FlosskMS.Business.DTOs;
using FlosskMS.Business.Services;
using Microsoft.AspNetCore.SignalR;

namespace FlosskMS.API.Hubs;

public class RealtimeNotificationService(
    IHubContext<NotificationHub> hubContext,
    IConnectionTracker connectionTracker) : IRealtimeNotificationService
{
    private readonly IHubContext<NotificationHub> _hubContext = hubContext;
    private readonly IConnectionTracker _connectionTracker = connectionTracker;

    public bool IsUserConnected(string userId)
    {
        return _connectionTracker.IsUserConnected(userId);
    }

    public async Task SendToUserAsync(string userId, NotificationDto notification)
    {
        await _hubContext.Clients.User(userId).SendAsync("ReceiveNotification", notification);
    }
}
