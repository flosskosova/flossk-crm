using System.Net.Http;
using System.Net.Http.Json;
using FlosskMS.Data;
using FlosskMS.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FlosskMS.Business.Services;

public class AccessProvisioningService(
    ApplicationDbContext context,
    IHttpClientFactory httpClientFactory,
    ILogger<AccessProvisioningService> logger) : IAccessProvisioningService
{
    private readonly ApplicationDbContext _context = context;
    private readonly IHttpClientFactory _httpClientFactory = httpClientFactory;
    private readonly ILogger<AccessProvisioningService> _logger = logger;

    public async Task<ProvisioningResult> SetUserAsync(Guid rfidCardId, CancellationToken ct = default)
    {
        var card = await LoadCardAsync(rfidCardId, ct);
        if (card is null)
            return new ProvisioningResult(false, "Credential not found.");
        if (card.UserId is null)
            return new ProvisioningResult(false, "Credential is not assigned to a user.");

        await EnsureUserNumberAsync(card, ct);

        var name = card.User is not null
            ? $"{card.User.FirstName} {card.User.LastName}".Trim()
            : "Member";

        var payload = new
        {
            op = "SetUser",
            userNumber = card.UserNumber,
            userName = name,
            userStatus = card.IsUsable ? "occupiedEnabled" : "occupiedDisabled"
        };

        return await FanOutAsync(card, "setUser", payload, AccessEventType.SetUserPushed, ct);
    }

    public async Task<ProvisioningResult> SetCredentialAsync(Guid rfidCardId, CancellationToken ct = default)
    {
        var card = await LoadCardAsync(rfidCardId, ct);
        if (card is null)
            return new ProvisioningResult(false, "Credential not found.");
        if (card.UserId is null)
            return new ProvisioningResult(false, "Credential is not assigned to a user.");

        await EnsureUserNumberAsync(card, ct);
        await EnsureCredentialNumberAsync(card, ct);

        var payload = new
        {
            op = "SetCredential",
            userNumber = card.UserNumber,
            credentialNumber = card.CredentialNumber,
            credentialType = card.CredentialType == AccessCredentialType.HomeKey ? "aliro" : "rfid",
            credentialData = card.CardIdentifier,
            userStatus = card.IsUsable ? "occupiedEnabled" : "occupiedDisabled"
        };

        return await FanOutAsync(card, "setCredential", payload, AccessEventType.SetCredentialPushed, ct);
    }

    public async Task<ProvisioningResult> RemoveCredentialAsync(Guid rfidCardId, CancellationToken ct = default)
    {
        var card = await LoadCardAsync(rfidCardId, ct);
        if (card is null)
            return new ProvisioningResult(false, "Credential not found.");

        var payload = new
        {
            op = "RemoveCredential",
            userNumber = card.UserNumber,
            credentialNumber = card.CredentialNumber,
            credentialType = card.CredentialType == AccessCredentialType.HomeKey ? "aliro" : "rfid",
            credentialData = card.CardIdentifier
        };

        return await FanOutAsync(card, "removeCredential", payload, AccessEventType.RemoveCredentialPushed, ct);
    }

    public async Task<ProvisioningResult> SyncDeviceAsync(Guid deviceId, CancellationToken ct = default)
    {
        var device = await _context.AccessDevices
            .Include(d => d.Door)
            .FirstOrDefaultAsync(d => d.Id == deviceId, ct);

        if (device is null)
            return new ProvisioningResult(false, "Device not found.");
        if (!device.IsAllowed)
            return new ProvisioningResult(false, "Device is not allowed.");

        try
        {
            var client = CreateClient(device);
            var response = await client.GetAsync("state", ct);
            var body = await response.Content.ReadAsStringAsync(ct);

            device.LastSyncAt = DateTime.UtcNow;
            device.LastSeenAt = DateTime.UtcNow;

            _context.AccessLogs.Add(new AccessLog
            {
                EventType = AccessEventType.DeviceSync,
                DoorId = device.DoorId,
                DoorName = device.Door?.Name,
                DeviceId = device.Id,
                Granted = response.IsSuccessStatusCode,
                Reason = response.IsSuccessStatusCode ? "State pulled from device." : $"Device returned {(int)response.StatusCode}.",
                Metadata = Trim(body)
            });
            await _context.SaveChangesAsync(ct);

            return response.IsSuccessStatusCode
                ? new ProvisioningResult(true, "Device state synced.") { DeviceMessages = { Trim(body) ?? "" } }
                : new ProvisioningResult(false, $"Device returned HTTP {(int)response.StatusCode}.");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to sync access device {DeviceId}", deviceId);
            _context.AccessLogs.Add(new AccessLog
            {
                EventType = AccessEventType.DeviceSync,
                DoorId = device.DoorId,
                DoorName = device.Door?.Name,
                DeviceId = device.Id,
                Granted = false,
                Reason = $"Unreachable: {ex.Message}"
            });
            await _context.SaveChangesAsync(ct);
            return new ProvisioningResult(false, $"Device unreachable: {ex.Message}");
        }
    }

    // ─────────────────────────── helpers ───────────────────────────

    private async Task<UserRfidCard?> LoadCardAsync(Guid id, CancellationToken ct) =>
        await _context.UserRfidCards
            .Include(c => c.User)
            .Include(c => c.DoorGrants)
            .FirstOrDefaultAsync(c => c.Id == id, ct);

    private async Task EnsureUserNumberAsync(UserRfidCard card, CancellationToken ct)
    {
        if (card.UserNumber is not null || card.UserId is null)
            return;

        // The Matter/Aliro "SetUser" slot must be a small integer, so it is allocated
        // per member (all of a member's credentials share one slot) rather than being the
        // FOSS-… badge code.
        var existing = await _context.UserRfidCards
            .Where(c => c.UserId == card.UserId && c.UserNumber != null && c.Id != card.Id)
            .Select(c => c.UserNumber)
            .FirstOrDefaultAsync(ct);

        card.UserNumber = existing
            ?? (await _context.UserRfidCards.MaxAsync(c => (int?)c.UserNumber, ct) ?? 0) + 1;

        await _context.SaveChangesAsync(ct);
    }

    private async Task EnsureCredentialNumberAsync(UserRfidCard card, CancellationToken ct)
    {
        if (card.CredentialNumber is not null)
            return;

        var max = await _context.UserRfidCards.MaxAsync(c => (int?)c.CredentialNumber, ct) ?? 0;
        card.CredentialNumber = max + 1;
        await _context.SaveChangesAsync(ct);
    }

    private async Task<List<AccessDevice>> ResolveDevicesAsync(UserRfidCard card, CancellationToken ct)
    {
        var query = _context.AccessDevices
            .Include(d => d.Door)
            .Where(d => d.IsAllowed && d.Door.IsActive);

        if (!card.AllDoors)
        {
            var doorIds = card.DoorGrants.Select(g => g.DoorId).ToList();
            query = query.Where(d => doorIds.Contains(d.DoorId));
        }

        return await query.ToListAsync(ct);
    }

    private async Task<ProvisioningResult> FanOutAsync(
        UserRfidCard card, string path, object payload, AccessEventType eventType, CancellationToken ct)
    {
        var devices = await ResolveDevicesAsync(card, ct);
        if (devices.Count == 0)
        {
            var msg = card.AllDoors
                ? "No allowed devices are registered yet."
                : "No allowed devices for the granted doors.";
            _context.AccessLogs.Add(new AccessLog
            {
                EventType = eventType,
                RfidCardId = card.Id,
                CredentialType = card.CredentialType,
                CredentialIdentifier = card.CardIdentifier,
                UserId = card.UserId,
                Granted = false,
                Reason = msg
            });
            await _context.SaveChangesAsync(ct);
            return new ProvisioningResult(false, msg);
        }

        var result = new ProvisioningResult(true, $"Pushed to {devices.Count} device(s).");
        var anyFailed = false;

        foreach (var device in devices)
        {
            try
            {
                var client = CreateClient(device);
                var response = await client.PostAsJsonAsync(path, payload, ct);
                var ok = response.IsSuccessStatusCode;
                anyFailed |= !ok;
                device.LastSeenAt = DateTime.UtcNow;

                result.DeviceMessages.Add($"{device.Name}: HTTP {(int)response.StatusCode}");
                _context.AccessLogs.Add(new AccessLog
                {
                    EventType = ok ? eventType : AccessEventType.ProvisioningFailed,
                    DoorId = device.DoorId,
                    DoorName = device.Door?.Name,
                    DeviceId = device.Id,
                    RfidCardId = card.Id,
                    CredentialType = card.CredentialType,
                    CredentialIdentifier = card.CardIdentifier,
                    UserId = card.UserId,
                    Granted = ok,
                    Reason = ok ? $"{path} accepted by {device.Name}." : $"{device.Name} returned HTTP {(int)response.StatusCode}."
                });
            }
            catch (Exception ex)
            {
                anyFailed = true;
                _logger.LogWarning(ex, "Provisioning {Path} to device {DeviceId} failed", path, device.Id);
                result.DeviceMessages.Add($"{device.Name}: {ex.Message}");
                _context.AccessLogs.Add(new AccessLog
                {
                    EventType = AccessEventType.ProvisioningFailed,
                    DoorId = device.DoorId,
                    DoorName = device.Door?.Name,
                    DeviceId = device.Id,
                    RfidCardId = card.Id,
                    CredentialType = card.CredentialType,
                    CredentialIdentifier = card.CardIdentifier,
                    UserId = card.UserId,
                    Granted = false,
                    Reason = $"{device.Name} unreachable: {ex.Message}"
                });
            }
        }

        await _context.SaveChangesAsync(ct);

        return anyFailed
            ? new ProvisioningResult(false, "One or more devices did not accept the update.") { DeviceMessages = result.DeviceMessages }
            : result;
    }

    private HttpClient CreateClient(AccessDevice device)
    {
        var client = _httpClientFactory.CreateClient("access-device");
        client.BaseAddress = new Uri(device.BaseUrl.TrimEnd('/') + "/");
        client.Timeout = TimeSpan.FromSeconds(5);
        client.DefaultRequestHeaders.Remove("X-Device-Key");
        client.DefaultRequestHeaders.Add("X-Device-Key", device.Secret);
        return client;
    }

    private static string? Trim(string? s) => string.IsNullOrEmpty(s) || s.Length <= 4000 ? s : s[..4000];
}
