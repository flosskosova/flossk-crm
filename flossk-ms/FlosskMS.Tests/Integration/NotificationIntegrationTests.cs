using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text.Json;
using FlosskMS.API.Services;
using FlosskMS.Business.Configuration;
using FlosskMS.Business.DTOs;
using FlosskMS.Business.Services;
using FlosskMS.Data;
using FlosskMS.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using WebPush;

namespace FlosskMS.Tests.Integration;

public sealed class NotificationIntegrationTests
{
    [Fact]
    public async Task EmailService_SendsPasswordReset_ToSmtpProvider()
    {
        if (!NotificationIntegrationTestSettings.Enabled)
            return;

        var provider = NotificationIntegrationTestSettings.SmtpProvider;
        var recipient = $"integration-{Guid.NewGuid():N}@example.test";
        var uniqueToken = Guid.NewGuid().ToString("N");

        Environment.SetEnvironmentVariable("SmtpSettings__Host", NotificationIntegrationTestSettings.SmtpHost);
        Environment.SetEnvironmentVariable("SmtpSettings__Port", NotificationIntegrationTestSettings.SmtpPort.ToString());
        Environment.SetEnvironmentVariable("SmtpSettings__Username", string.Empty);
        Environment.SetEnvironmentVariable("SmtpSettings__Password", string.Empty);
        Environment.SetEnvironmentVariable("SmtpSettings__DisableStartTls", "true");
        Environment.SetEnvironmentVariable("SmtpSettings__UseSslOnConnect", "false");
        Environment.SetEnvironmentVariable("SmtpSettings__FromEmail", "noreply@flossk.local");
        Environment.SetEnvironmentVariable("SmtpSettings__FromName", "FlosskMS Integration");

        var service = new EmailService();
        await service.SendPasswordResetEmailAsync(
            recipient,
            "Integration Tester",
            $"https://example.test/reset?token={uniqueToken}");

        using var httpClient = new HttpClient();
        var found = await WaitForEmailAsync(httpClient, provider, recipient, TimeSpan.FromSeconds(20));

        Assert.True(found, $"Expected email for recipient '{recipient}' was not found in {provider} API.");
    }

    [Fact]
    public async Task PushNotificationService_SendsWebPush_ToWireMockEndpoint()
    {
        if (!NotificationIntegrationTestSettings.Enabled)
            return;

        using var httpClient = new HttpClient();
        await ResetWireMockJournalAsync(httpClient);

        var dbOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase($"notif-push-it-{Guid.NewGuid():N}")
            .Options;

        await using var dbContext = new ApplicationDbContext(dbOptions);

        var vapidKeys = VapidHelper.GenerateVapidKeys();
        var vapidSettings = Options.Create(new VapidSettings
        {
            Subject = "mailto:integration@flossk.local",
            PublicKey = vapidKeys.PublicKey,
            PrivateKey = vapidKeys.PrivateKey
        });

        dbContext.PushSubscriptions.Add(new FlosskMS.Data.Entities.PushSubscription
        {
            Id = Guid.NewGuid(),
            UserId = "integration-user",
            Endpoint = NotificationIntegrationTestSettings.WireMockPushEndpoint,
            // Any valid EC public key in URL-safe base64 format is acceptable for test encryption.
            P256dh = vapidKeys.PublicKey,
            Auth = Base64UrlEncode(RandomNumberGenerator.GetBytes(16)),
            CreatedAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();

        var service = new PushNotificationService(
            dbContext,
            vapidSettings,
            NullLogger<PushNotificationService>.Instance);

        var result = await service.SendToUserAsync("integration-user", new NotificationDto
        {
            Id = Guid.NewGuid(),
            Type = "General",
            Priority = "Normal",
            Title = "Integration Push Test",
            Body = "Push reached mock endpoint",
            Metadata = "{\"source\":\"integration-test\"}",
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        });

        Assert.True(result);

        var pushed = await WaitForWireMockPushRequestAsync(httpClient, TimeSpan.FromSeconds(20));
        Assert.True(pushed, "Expected WireMock to receive at least one POST /push request.");
    }

    private static async Task<bool> WaitForEmailAsync(HttpClient httpClient, string provider, string recipient,
        TimeSpan timeout)
    {
        var deadline = DateTime.UtcNow + timeout;

        while (DateTime.UtcNow < deadline)
        {
            try
            {
                var payload = provider switch
                {
                    "mailhog" => await httpClient.GetStringAsync(NotificationIntegrationTestSettings.MailhogMessagesUrl),
                    _ => await httpClient.GetStringAsync(NotificationIntegrationTestSettings.Smtp4DevMessagesUrl)
                };

                if (payload.Contains(recipient, StringComparison.OrdinalIgnoreCase))
                    return true;
            }
            catch
            {
                // Service may not be ready yet; keep polling until timeout.
            }

            await Task.Delay(500);
        }

        return false;
    }

    private static async Task ResetWireMockJournalAsync(HttpClient httpClient)
    {
        try
        {
            var response = await httpClient.PostAsync(NotificationIntegrationTestSettings.WireMockResetUrl, content: null);
            response.EnsureSuccessStatusCode();
        }
        catch
        {
            // If reset fails because WireMock is down, assertions later will clearly fail.
        }
    }

    private static async Task<bool> WaitForWireMockPushRequestAsync(HttpClient httpClient, TimeSpan timeout)
    {
        var deadline = DateTime.UtcNow + timeout;

        while (DateTime.UtcNow < deadline)
        {
            try
            {
                using var stream = await httpClient.GetStreamAsync(NotificationIntegrationTestSettings.WireMockRequestsUrl);
                using var document = await JsonDocument.ParseAsync(stream);
                if (!document.RootElement.TryGetProperty("requests", out var requests) ||
                    requests.ValueKind != JsonValueKind.Array)
                {
                    await Task.Delay(500);
                    continue;
                }

                foreach (var req in requests.EnumerateArray())
                {
                    var url = req.GetProperty("request").GetProperty("url").GetString() ?? string.Empty;
                    var method = req.GetProperty("request").GetProperty("method").GetString() ?? string.Empty;

                    if (method.Equals("POST", StringComparison.OrdinalIgnoreCase) && url.Contains("/push", StringComparison.Ordinal))
                        return true;
                }
            }
            catch
            {
                // Service may not be ready yet; keep polling until timeout.
            }

            await Task.Delay(500);
        }

        return false;
    }

    private static string Base64UrlEncode(byte[] bytes)
    {
        return Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }
}

internal static class NotificationIntegrationTestSettings
{
    public static bool Enabled =>
        string.Equals(Environment.GetEnvironmentVariable("RUN_NOTIFICATION_INTEGRATION_TESTS"), "true",
            StringComparison.OrdinalIgnoreCase);

    public static string SmtpProvider =>
        (Environment.GetEnvironmentVariable("NOTIFICATION_TEST_SMTP_PROVIDER") ?? "smtp4dev").Trim().ToLowerInvariant();

    public static string SmtpHost => Environment.GetEnvironmentVariable("NOTIFICATION_TEST_SMTP_HOST") ?? "localhost";

    public static int SmtpPort
    {
        get
        {
            var configured = Environment.GetEnvironmentVariable("NOTIFICATION_TEST_SMTP_PORT");
            if (int.TryParse(configured, out var port))
                return port;

            return SmtpProvider == "mailhog" ? 1025 : 2525;
        }
    }

    public static string Smtp4DevMessagesUrl =>
        Environment.GetEnvironmentVariable("NOTIFICATION_TEST_SMTP4DEV_MESSAGES_URL") ?? "http://localhost:5000/api/messages";

    public static string MailhogMessagesUrl =>
        Environment.GetEnvironmentVariable("NOTIFICATION_TEST_MAILHOG_MESSAGES_URL") ?? "http://localhost:8025/api/v2/messages";

    public static string WireMockPushEndpoint =>
        Environment.GetEnvironmentVariable("NOTIFICATION_TEST_PUSH_ENDPOINT") ?? "http://localhost:8081/push";

    public static string WireMockRequestsUrl =>
        Environment.GetEnvironmentVariable("NOTIFICATION_TEST_WIREMOCK_REQUESTS_URL") ?? "http://localhost:8081/__admin/requests";

    public static string WireMockResetUrl =>
        Environment.GetEnvironmentVariable("NOTIFICATION_TEST_WIREMOCK_RESET_URL") ?? "http://localhost:8081/__admin/reset";
}