using System.Text.Json;
using FlosskMS.Business.Configuration;
using FlosskMS.Business.DTOs;
using FlosskMS.Business.Services;
using FlosskMS.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using WebPush;

namespace FlosskMS.API.Services;

public class PushNotificationService(
    ApplicationDbContext dbContext,
    IOptions<VapidSettings> vapidSettings,
    ILogger<PushNotificationService> logger) : IPushNotificationService
{
    private readonly ApplicationDbContext _dbContext = dbContext;
    private readonly VapidSettings _vapidSettings = ResolveVapidSettings(vapidSettings.Value);
    private readonly ILogger<PushNotificationService> _logger = logger;

    private static VapidSettings ResolveVapidSettings(VapidSettings fallback)
    {
        var subject = ReadEnv("VapidSettings__Subject") ?? fallback.Subject;
        var publicKey = ReadEnv("VapidSettings__PublicKey") ?? fallback.PublicKey;
        var privateKey = ReadEnv("VapidSettings__PrivateKey") ?? fallback.PrivateKey;

        return new VapidSettings
        {
            Subject = subject,
            PublicKey = publicKey,
            PrivateKey = privateKey
        };
    }

    private static string? ReadEnv(string key)
    {
        var value = Environment.GetEnvironmentVariable(key);
        return string.IsNullOrWhiteSpace(value) ? null : value;
    }

    public async Task<bool> SendToUserAsync(string userId, NotificationDto notification)
    {
        if (string.IsNullOrEmpty(_vapidSettings.PublicKey) || string.IsNullOrEmpty(_vapidSettings.PrivateKey))
        {
            _logger.LogWarning("VAPID keys not configured. Skipping Web Push delivery.");
            return false;
        }

        var subscriptions = await _dbContext.PushSubscriptions
            .Where(s => s.UserId == userId)
            .ToListAsync();

        if (subscriptions.Count == 0)
            return false;

        var vapidDetails = new VapidDetails(_vapidSettings.Subject, _vapidSettings.PublicKey, _vapidSettings.PrivateKey);
        var webPushClient = new WebPushClient();

        var payload = JsonSerializer.Serialize(new
        {
            title = notification.Title,
            body = notification.Body,
            type = notification.Type,
            notificationId = notification.Id,
            metadata = notification.Metadata
        });

        var staleSubscriptions = new List<Guid>();

        foreach (var sub in subscriptions)
        {
            try
            {
                var pushSubscription = new WebPush.PushSubscription(sub.Endpoint, sub.P256dh, sub.Auth);
                await webPushClient.SendNotificationAsync(pushSubscription, payload, vapidDetails);
            }
            catch (WebPushException ex) when (ex.StatusCode == System.Net.HttpStatusCode.Gone ||
                                                ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                _logger.LogInformation("Push subscription {Endpoint} is stale, marking for removal.", sub.Endpoint);
                staleSubscriptions.Add(sub.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send push notification to {Endpoint}", sub.Endpoint);
            }
        }

        // Clean up stale subscriptions
        if (staleSubscriptions.Count > 0)
        {
            await _dbContext.PushSubscriptions
                .Where(s => staleSubscriptions.Contains(s.Id))
                .ExecuteDeleteAsync();
        }

        return true;
    }
}
