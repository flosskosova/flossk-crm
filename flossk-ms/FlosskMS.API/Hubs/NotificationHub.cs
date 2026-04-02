using FlosskMS.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace FlosskMS.API.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    private readonly IConnectionTracker _connectionTracker;
    private readonly IPresenceTracker _presenceTracker;
    private readonly IServiceScopeFactory _scopeFactory;

    public NotificationHub(
        IConnectionTracker connectionTracker,
        IPresenceTracker presenceTracker,
        IServiceScopeFactory scopeFactory)
    {
        _connectionTracker = connectionTracker;
        _presenceTracker = presenceTracker;
        _scopeFactory = scopeFactory;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            _connectionTracker.AddConnection(userId, Context.ConnectionId);
            _presenceTracker.SetOnline(userId);
            await Clients.Others.SendAsync("UserStatusChanged", userId, "Online", (DateTime?)null);
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            _connectionTracker.RemoveConnection(userId, Context.ConnectionId);

            // Only mark offline if user has no more connections
            if (!_connectionTracker.IsUserConnected(userId))
            {
                var lastActivity = _presenceTracker.GetPresence(userId).LastActivityAt ?? DateTime.UtcNow;
                _presenceTracker.SetOffline(userId);

                // Persist last activity to DB
                using var scope = _scopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                await dbContext.Users
                    .Where(u => u.Id == userId)
                    .ExecuteUpdateAsync(s => s.SetProperty(u => u.LastActivityAt, lastActivity));

                await Clients.Others.SendAsync("UserStatusChanged", userId, "Offline", lastActivity);
            }
        }
        await base.OnDisconnectedAsync(exception);
    }

    public async Task Heartbeat()
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            var prev = _presenceTracker.GetPresence(userId);
            _presenceTracker.SetActive(userId);

            if (prev.Status != UserPresenceStatus.Online)
            {
                await Clients.Others.SendAsync("UserStatusChanged", userId, "Online", (DateTime?)null);
            }
        }
    }

    public async Task ReportIdle()
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            _presenceTracker.SetIdle(userId);
            await Clients.Others.SendAsync("UserStatusChanged", userId, "Idle", (DateTime?)null);
        }
    }

    public async Task ReportActive()
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            _presenceTracker.SetActive(userId);
            await Clients.Others.SendAsync("UserStatusChanged", userId, "Online", (DateTime?)null);
        }
    }
}
