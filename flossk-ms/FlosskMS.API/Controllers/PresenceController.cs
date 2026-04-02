using FlosskMS.API.Hubs;
using FlosskMS.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FlosskMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PresenceController(IPresenceTracker presenceTracker, ApplicationDbContext dbContext) : ControllerBase
{
    private readonly IPresenceTracker _presenceTracker = presenceTracker;
    private readonly ApplicationDbContext _dbContext = dbContext;

    [HttpGet("statuses")]
    public async Task<IActionResult> GetStatuses([FromQuery] string? userIds = null)
    {
        var presences = string.IsNullOrEmpty(userIds)
            ? _presenceTracker.GetAllPresences()
            : _presenceTracker.GetPresences(userIds.Split(',', StringSplitOptions.RemoveEmptyEntries));

        // For offline users not in memory, fetch lastActivityAt from DB
        var offlineWithoutActivity = presences
            .Where(p => p.Value.Status == UserPresenceStatus.Offline && p.Value.LastActivityAt == null)
            .Select(p => p.Key)
            .ToList();

        if (offlineWithoutActivity.Count > 0)
        {
            var dbActivities = await _dbContext.Users
                .Where(u => offlineWithoutActivity.Contains(u.Id))
                .Select(u => new { u.Id, u.LastActivityAt })
                .ToListAsync();

            foreach (var entry in dbActivities)
            {
                if (entry.LastActivityAt.HasValue)
                {
                    presences[entry.Id] = new UserPresenceInfo(UserPresenceStatus.Offline, entry.LastActivityAt);
                }
            }
        }

        // If specific userIds were requested, also fetch DB lastActivity for users never seen online
        if (!string.IsNullOrEmpty(userIds))
        {
            var requestedIds = userIds.Split(',', StringSplitOptions.RemoveEmptyEntries);
            var missingIds = requestedIds.Where(id => !presences.ContainsKey(id) || presences[id].LastActivityAt == null).ToList();

            if (missingIds.Count > 0)
            {
                var dbActivities = await _dbContext.Users
                    .Where(u => missingIds.Contains(u.Id))
                    .Select(u => new { u.Id, u.LastActivityAt })
                    .ToListAsync();

                foreach (var entry in dbActivities)
                {
                    if (!presences.ContainsKey(entry.Id))
                    {
                        presences[entry.Id] = new UserPresenceInfo(UserPresenceStatus.Offline, entry.LastActivityAt);
                    }
                    else if (presences[entry.Id].LastActivityAt == null && entry.LastActivityAt.HasValue)
                    {
                        presences[entry.Id] = presences[entry.Id] with { LastActivityAt = entry.LastActivityAt };
                    }
                }
            }
        }

        var result = presences.ToDictionary(
            p => p.Key,
            p => new
            {
                Status = p.Value.Status.ToString(),
                p.Value.LastActivityAt
            });

        return Ok(result);
    }
}
