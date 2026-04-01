using System.Collections.Concurrent;

namespace FlosskMS.API.Hubs;

public interface IConnectionTracker
{
    void AddConnection(string userId, string connectionId);
    void RemoveConnection(string userId, string connectionId);
    bool IsUserConnected(string userId);
    IReadOnlyCollection<string> GetConnections(string userId);
}

public class ConnectionTracker : IConnectionTracker
{
    private readonly ConcurrentDictionary<string, HashSet<string>> _connections = new();
    private readonly object _lock = new();

    public void AddConnection(string userId, string connectionId)
    {
        lock (_lock)
        {
            if (!_connections.TryGetValue(userId, out var connections))
            {
                connections = [];
                _connections[userId] = connections;
            }
            connections.Add(connectionId);
        }
    }

    public void RemoveConnection(string userId, string connectionId)
    {
        lock (_lock)
        {
            if (_connections.TryGetValue(userId, out var connections))
            {
                connections.Remove(connectionId);
                if (connections.Count == 0)
                    _connections.TryRemove(userId, out _);
            }
        }
    }

    public bool IsUserConnected(string userId)
    {
        return _connections.TryGetValue(userId, out var connections) && connections.Count > 0;
    }

    public IReadOnlyCollection<string> GetConnections(string userId)
    {
        lock (_lock)
        {
            if (_connections.TryGetValue(userId, out var connections))
                return connections.ToList().AsReadOnly();
            return Array.Empty<string>();
        }
    }
}
