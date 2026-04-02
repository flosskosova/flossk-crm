using System.Collections.Concurrent;

namespace FlosskMS.API.Hubs;

public enum UserPresenceStatus
{
    Online,
    Idle,
    Offline
}

public record UserPresenceInfo(UserPresenceStatus Status, DateTime? LastActivityAt);

public interface IPresenceTracker
{
    void SetOnline(string userId);
    void SetOffline(string userId);
    void SetIdle(string userId);
    void SetActive(string userId);
    UserPresenceInfo GetPresence(string userId);
    Dictionary<string, UserPresenceInfo> GetAllPresences();
    Dictionary<string, UserPresenceInfo> GetPresences(IEnumerable<string> userIds);
}

public class PresenceTracker : IPresenceTracker
{
    private readonly ConcurrentDictionary<string, UserPresenceInfo> _presences = new();

    public void SetOnline(string userId)
    {
        _presences[userId] = new UserPresenceInfo(UserPresenceStatus.Online, DateTime.UtcNow);
    }

    public void SetOffline(string userId)
    {
        var lastActivity = _presences.TryGetValue(userId, out var current)
            ? current.LastActivityAt
            : DateTime.UtcNow;
        _presences[userId] = new UserPresenceInfo(UserPresenceStatus.Offline, lastActivity);
    }

    public void SetIdle(string userId)
    {
        var lastActivity = _presences.TryGetValue(userId, out var current)
            ? current.LastActivityAt
            : DateTime.UtcNow;
        _presences[userId] = new UserPresenceInfo(UserPresenceStatus.Idle, lastActivity);
    }

    public void SetActive(string userId)
    {
        _presences[userId] = new UserPresenceInfo(UserPresenceStatus.Online, DateTime.UtcNow);
    }

    public UserPresenceInfo GetPresence(string userId)
    {
        return _presences.TryGetValue(userId, out var info)
            ? info
            : new UserPresenceInfo(UserPresenceStatus.Offline, null);
    }

    public Dictionary<string, UserPresenceInfo> GetAllPresences()
    {
        return new Dictionary<string, UserPresenceInfo>(_presences);
    }

    public Dictionary<string, UserPresenceInfo> GetPresences(IEnumerable<string> userIds)
    {
        var result = new Dictionary<string, UserPresenceInfo>();
        foreach (var userId in userIds)
        {
            result[userId] = GetPresence(userId);
        }
        return result;
    }
}
