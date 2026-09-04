using System.Globalization;
using System.Security.Cryptography;
using FlosskMS.Business.DomainEvents;
using FlosskMS.Business.DomainEvents.Access;
using FlosskMS.Business.DTOs;
using FlosskMS.Data;
using FlosskMS.Data.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FlosskMS.Business.Services;

public class AccessService(
    ApplicationDbContext context,
    IAccessProvisioningService provisioning,
    IDomainEventDispatcher events) : IAccessService
{
    private readonly ApplicationDbContext _context = context;
    private readonly IAccessProvisioningService _provisioning = provisioning;
    private readonly IDomainEventDispatcher _events = events;

    private const int DeviceOnlineWindowMinutes = 10;

    // ════════════════════════════ Doors ════════════════════════════

    public async Task<IActionResult> GetDoorsAsync()
    {
        var doors = await _context.AccessDoors
            .Include(d => d.CreatedByUser)
            .Include(d => d.Devices)
            .OrderBy(d => d.Name)
            .ToListAsync();

        return new OkObjectResult(doors.Select(MapDoor));
    }

    public async Task<IActionResult> GetDoorAsync(Guid id)
    {
        var door = await _context.AccessDoors
            .Include(d => d.CreatedByUser)
            .Include(d => d.Devices)
            .FirstOrDefaultAsync(d => d.Id == id);

        return door is null
            ? NotFound("Door not found.")
            : new OkObjectResult(MapDoor(door));
    }

    public async Task<IActionResult> CreateDoorAsync(CreateAccessDoorDto dto, string actorUserId)
    {
        var door = new AccessDoor
        {
            Id = Guid.NewGuid(),
            Name = dto.Name.Trim(),
            Location = dto.Location?.Trim(),
            Description = dto.Description?.Trim(),
            IsActive = dto.IsActive,
            CreatedAt = DateTime.UtcNow,
            CreatedByUserId = actorUserId
        };

        _context.AccessDoors.Add(door);
        await _context.SaveChangesAsync();

        await LogAsync(AccessEventType.DoorCreated, actorUserId, doorId: door.Id, doorName: door.Name,
            reason: $"Door \"{door.Name}\" created.");
        await AuditAsync("AccessDoor", door.Id.ToString(), door.Name, "Created", null, actorUserId);

        await _context.Entry(door).Reference(d => d.CreatedByUser).LoadAsync();
        return new OkObjectResult(MapDoor(door));
    }

    public async Task<IActionResult> UpdateDoorAsync(Guid id, UpdateAccessDoorDto dto, string actorUserId)
    {
        var door = await _context.AccessDoors
            .Include(d => d.CreatedByUser)
            .Include(d => d.Devices)
            .FirstOrDefaultAsync(d => d.Id == id);
        if (door is null)
            return NotFound("Door not found.");

        if (dto.Name is not null) door.Name = dto.Name.Trim();
        if (dto.Location is not null) door.Location = dto.Location.Trim();
        if (dto.Description is not null) door.Description = dto.Description.Trim();
        if (dto.IsActive.HasValue) door.IsActive = dto.IsActive.Value;

        await _context.SaveChangesAsync();

        await LogAsync(AccessEventType.DoorUpdated, actorUserId, doorId: door.Id, doorName: door.Name,
            reason: $"Door \"{door.Name}\" updated.");
        await AuditAsync("AccessDoor", door.Id.ToString(), door.Name, "Updated", null, actorUserId);

        return new OkObjectResult(MapDoor(door));
    }

    public async Task<IActionResult> DeleteDoorAsync(Guid id, string actorUserId)
    {
        var door = await _context.AccessDoors.FirstOrDefaultAsync(d => d.Id == id);
        if (door is null)
            return NotFound("Door not found.");

        _context.AccessDoors.Remove(door);
        await _context.SaveChangesAsync();

        await LogAsync(AccessEventType.DoorDeleted, actorUserId, doorName: door.Name,
            reason: $"Door \"{door.Name}\" deleted.");
        await AuditAsync("AccessDoor", id.ToString(), door.Name, "Deleted", null, actorUserId);

        return new OkObjectResult(new { message = "Door deleted." });
    }

    // ════════════════════════════ Devices ════════════════════════════

    public async Task<IActionResult> GetDevicesAsync(Guid? doorId = null)
    {
        var query = _context.AccessDevices.Include(d => d.Door).AsQueryable();
        if (doorId.HasValue)
            query = query.Where(d => d.DoorId == doorId.Value);

        var devices = await query.OrderBy(d => d.Name).ToListAsync();
        return new OkObjectResult(devices.Select(d => MapDevice(d, includeSecret: false)));
    }

    public async Task<IActionResult> GetDeviceAsync(Guid id)
    {
        var device = await _context.AccessDevices.Include(d => d.Door).FirstOrDefaultAsync(d => d.Id == id);
        return device is null
            ? NotFound("Device not found.")
            : new OkObjectResult(MapDevice(device, includeSecret: false));
    }

    public async Task<IActionResult> CreateDeviceAsync(CreateAccessDeviceDto dto, string actorUserId)
    {
        var door = await _context.AccessDoors.FirstOrDefaultAsync(d => d.Id == dto.DoorId);
        if (door is null)
            return new BadRequestObjectResult(new { message = "Door not found." });

        var device = new AccessDevice
        {
            Id = Guid.NewGuid(),
            Name = dto.Name.Trim(),
            DoorId = dto.DoorId,
            IpAddress = dto.IpAddress.Trim(),
            Port = dto.Port,
            Secret = string.IsNullOrWhiteSpace(dto.Secret) ? GenerateSecret() : dto.Secret.Trim(),
            IsAllowed = dto.IsAllowed,
            EnforceIpCheck = dto.EnforceIpCheck,
            CreatedAt = DateTime.UtcNow,
            CreatedByUserId = actorUserId
        };

        _context.AccessDevices.Add(device);
        await _context.SaveChangesAsync();

        await LogAsync(AccessEventType.DeviceRegistered, actorUserId, doorId: door.Id, doorName: door.Name,
            deviceId: device.Id, reason: $"Device \"{device.Name}\" ({device.IpAddress}) registered.");
        await AuditAsync("AccessDevice", device.Id.ToString(), device.Name, "Registered",
            $"{device.IpAddress}:{device.Port} on door {door.Name}", actorUserId);

        device.Door = door;
        return new OkObjectResult(MapDevice(device, includeSecret: true));
    }

    public async Task<IActionResult> UpdateDeviceAsync(Guid id, UpdateAccessDeviceDto dto, string actorUserId)
    {
        var device = await _context.AccessDevices.Include(d => d.Door).FirstOrDefaultAsync(d => d.Id == id);
        if (device is null)
            return NotFound("Device not found.");

        if (dto.DoorId.HasValue && dto.DoorId.Value != device.DoorId)
        {
            var door = await _context.AccessDoors.FirstOrDefaultAsync(d => d.Id == dto.DoorId.Value);
            if (door is null)
                return new BadRequestObjectResult(new { message = "Door not found." });
            device.DoorId = dto.DoorId.Value;
            device.Door = door;
        }

        if (dto.Name is not null) device.Name = dto.Name.Trim();
        if (dto.IpAddress is not null) device.IpAddress = dto.IpAddress.Trim();
        if (dto.Port.HasValue) device.Port = dto.Port.Value;
        if (dto.IsAllowed.HasValue) device.IsAllowed = dto.IsAllowed.Value;
        if (dto.EnforceIpCheck.HasValue) device.EnforceIpCheck = dto.EnforceIpCheck.Value;

        var rotated = false;
        if (dto.RotateSecret)
        {
            device.Secret = GenerateSecret();
            rotated = true;
        }

        await _context.SaveChangesAsync();

        await LogAsync(AccessEventType.DeviceUpdated, actorUserId, doorId: device.DoorId, doorName: device.Door?.Name,
            deviceId: device.Id, reason: $"Device \"{device.Name}\" updated{(rotated ? " (secret rotated)" : "")}.");
        await AuditAsync("AccessDevice", device.Id.ToString(), device.Name, "Updated",
            rotated ? "Secret rotated" : null, actorUserId);

        return new OkObjectResult(MapDevice(device, includeSecret: rotated));
    }

    public async Task<IActionResult> DeleteDeviceAsync(Guid id, string actorUserId)
    {
        var device = await _context.AccessDevices.Include(d => d.Door).FirstOrDefaultAsync(d => d.Id == id);
        if (device is null)
            return NotFound("Device not found.");

        _context.AccessDevices.Remove(device);
        await _context.SaveChangesAsync();

        await LogAsync(AccessEventType.DeviceRemoved, actorUserId, doorId: device.DoorId, doorName: device.Door?.Name,
            reason: $"Device \"{device.Name}\" removed.");
        await AuditAsync("AccessDevice", id.ToString(), device.Name, "Removed", null, actorUserId);

        return new OkObjectResult(new { message = "Device removed." });
    }

    public async Task<IActionResult> SyncDeviceAsync(Guid id)
    {
        var result = await _provisioning.SyncDeviceAsync(id);
        return result.Success
            ? new OkObjectResult(new { message = result.Message, details = result.DeviceMessages })
            : new ObjectResult(new { message = result.Message, details = result.DeviceMessages }) { StatusCode = 502 };
    }

    // ════════════════════════ Credential lifecycle ════════════════════════

    public async Task<IActionResult> AssignCredentialAsync(AssignAccessCredentialDto dto, string actorUserId)
    {
        var member = await _context.Users.FirstOrDefaultAsync(u => u.Id == dto.UserId);
        if (member is null)
            return NotFound("User not found.");

        if (!Enum.TryParse<AccessCredentialType>(dto.CredentialType, ignoreCase: true, out var credentialType))
            return new BadRequestObjectResult(new { message = "credentialType must be 'NfcCard' or 'HomeKey'." });

        var identifier = string.IsNullOrWhiteSpace(dto.CardIdentifier)
            ? credentialType == AccessCredentialType.HomeKey ? $"homekey:{Guid.NewGuid():N}" : null
            : dto.CardIdentifier.Trim();

        if (identifier is null)
            return new BadRequestObjectResult(new { message = "cardIdentifier (UUID) is required for an NFC card." });

        if (await _context.UserRfidCards.AnyAsync(c => c.CardIdentifier == identifier))
            return new ConflictObjectResult(new { message = "A credential with that identifier already exists." });

        List<AccessDoor> doors = [];
        if (!dto.AllDoors && dto.DoorIds.Count > 0)
        {
            doors = await _context.AccessDoors.Where(d => dto.DoorIds.Contains(d.Id)).ToListAsync();
            if (doors.Count != dto.DoorIds.Distinct().Count())
                return new BadRequestObjectResult(new { message = "One or more doors were not found." });
        }

        var now = DateTime.UtcNow;
        var card = new UserRfidCard
        {
            Id = Guid.NewGuid(),
            CardIdentifier = identifier,
            CredentialType = credentialType,
            Status = AccessCredentialStatus.Pending,
            IsActive = false,
            AllDoors = dto.AllDoors,
            Notes = dto.Notes,
            UserId = member.Id,
            RegisteredAt = now,
            RegisteredByUserId = actorUserId,
            AssignedAt = now,
            AssignedByUserId = actorUserId
        };
        _context.UserRfidCards.Add(card);

        foreach (var door in doors)
        {
            _context.AccessDoorGrants.Add(new AccessDoorGrant
            {
                Id = Guid.NewGuid(),
                RfidCardId = card.Id,
                DoorId = door.Id,
                GrantedAt = now,
                GrantedByUserId = actorUserId
            });
        }

        await _context.SaveChangesAsync();

        await LogAsync(AccessEventType.CredentialAssigned, actorUserId, rfidCardId: card.Id,
            credentialType: credentialType, credentialIdentifier: identifier, userId: member.Id,
            reason: $"{credentialType} assigned to {FullName(member)} (pending acceptance).");
        await AuditAsync("AccessCredential", card.Id.ToString(), identifier, "Assigned",
            $"{credentialType} to {FullName(member)}", actorUserId);
        await _events.PublishAsync(new AccessCredentialAssignedEvent(member.Id, credentialType.ToString(), await ActorName(actorUserId)));

        return new OkObjectResult(await BuildCredentialDtoAsync(card.Id));
    }

    public async Task<IActionResult> AcceptCredentialAsync(Guid rfidCardId, string actorUserId)
    {
        var card = await LoadCardAsync(rfidCardId);
        if (card is null)
            return NotFound("Credential not found.");
        if (card.UserId is null)
            return new BadRequestObjectResult(new { message = "Assign the credential to a member first." });
        if (card.Status == AccessCredentialStatus.Active)
            return new BadRequestObjectResult(new { message = "Credential is already active." });
        if (card.CredentialType == AccessCredentialType.HomeKey && card.HomeKeyProvisionedAt is null)
            return new BadRequestObjectResult(new { message = "Provision the Home Key to the member's device before accepting." });

        card.Status = AccessCredentialStatus.Active;
        card.IsActive = true;
        card.DeclineReason = null;
        card.RevokedAt = null;
        card.RevokedByUserId = null;
        card.RevocationReason = null;
        await _context.SaveChangesAsync();

        var prov = await _provisioning.SetUserAsync(card.Id);
        await _provisioning.SetCredentialAsync(card.Id);

        await LogAsync(AccessEventType.CredentialAccepted, actorUserId, rfidCardId: card.Id,
            credentialType: card.CredentialType, credentialIdentifier: card.CardIdentifier, userId: card.UserId,
            granted: true, reason: $"Credential accepted. Provisioning: {prov.Message}");
        await AuditAsync("AccessCredential", card.Id.ToString(), card.CardIdentifier, "Accepted", prov.Message, actorUserId);
        await _events.PublishAsync(new AccessCredentialAcceptedEvent(card.UserId!, card.CredentialType.ToString(), await ActorName(actorUserId)));

        return new OkObjectResult(await BuildCredentialDtoAsync(card.Id));
    }

    public async Task<IActionResult> DeclineCredentialAsync(Guid rfidCardId, DeclineAccessCredentialDto dto, string actorUserId)
    {
        var card = await LoadCardAsync(rfidCardId);
        if (card is null)
            return NotFound("Credential not found.");

        var wasActive = card.Status == AccessCredentialStatus.Active;
        card.Status = AccessCredentialStatus.Declined;
        card.IsActive = false;
        card.DeclineReason = dto.Reason?.Trim();
        await _context.SaveChangesAsync();

        if (wasActive)
            await _provisioning.RemoveCredentialAsync(card.Id);

        await LogAsync(AccessEventType.CredentialDeclined, actorUserId, rfidCardId: card.Id,
            credentialType: card.CredentialType, credentialIdentifier: card.CardIdentifier, userId: card.UserId,
            granted: false, reason: dto.Reason is null ? "Credential declined." : $"Credential declined: {dto.Reason}");
        await AuditAsync("AccessCredential", card.Id.ToString(), card.CardIdentifier, "Declined", dto.Reason, actorUserId);
        if (card.UserId is not null)
            await _events.PublishAsync(new AccessCredentialDeclinedEvent(card.UserId, card.CredentialType.ToString(), await ActorName(actorUserId), dto.Reason));

        return new OkObjectResult(await BuildCredentialDtoAsync(card.Id));
    }

    public async Task<IActionResult> DisableCredentialAsync(Guid rfidCardId, string actorUserId)
    {
        var card = await LoadCardAsync(rfidCardId);
        if (card is null)
            return NotFound("Credential not found.");

        card.Status = AccessCredentialStatus.Disabled;
        card.IsActive = false;
        await _context.SaveChangesAsync();

        await _provisioning.RemoveCredentialAsync(card.Id);

        await LogAsync(AccessEventType.CredentialDisabled, actorUserId, rfidCardId: card.Id,
            credentialType: card.CredentialType, credentialIdentifier: card.CardIdentifier, userId: card.UserId,
            granted: false, reason: "Credential disabled.");
        await AuditAsync("AccessCredential", card.Id.ToString(), card.CardIdentifier, "Disabled", null, actorUserId);

        return new OkObjectResult(await BuildCredentialDtoAsync(card.Id));
    }

    public async Task<IActionResult> EnableCredentialAsync(Guid rfidCardId, string actorUserId)
    {
        var card = await LoadCardAsync(rfidCardId);
        if (card is null)
            return NotFound("Credential not found.");
        if (card.UserId is null)
            return new BadRequestObjectResult(new { message = "Assign the credential to a member first." });
        if (card.CredentialType == AccessCredentialType.HomeKey && card.HomeKeyProvisionedAt is null)
            return new BadRequestObjectResult(new { message = "Provision the Home Key before enabling." });

        card.Status = AccessCredentialStatus.Active;
        card.IsActive = true;
        await _context.SaveChangesAsync();

        var prov = await _provisioning.SetCredentialAsync(card.Id);

        await LogAsync(AccessEventType.CredentialEnabled, actorUserId, rfidCardId: card.Id,
            credentialType: card.CredentialType, credentialIdentifier: card.CardIdentifier, userId: card.UserId,
            granted: true, reason: $"Credential enabled. Provisioning: {prov.Message}");
        await AuditAsync("AccessCredential", card.Id.ToString(), card.CardIdentifier, "Enabled", prov.Message, actorUserId);

        return new OkObjectResult(await BuildCredentialDtoAsync(card.Id));
    }

    public async Task<IActionResult> ProvisionHomeKeyAsync(Guid rfidCardId, string actorUserId)
    {
        var card = await LoadCardAsync(rfidCardId);
        if (card is null)
            return NotFound("Credential not found.");
        if (card.CredentialType != AccessCredentialType.HomeKey)
            return new BadRequestObjectResult(new { message = "Only Home Key credentials need provisioning." });
        if (card.UserId is null)
            return new BadRequestObjectResult(new { message = "Assign the credential to a member first." });

        var prov = await _provisioning.SetUserAsync(card.Id);
        var credProv = await _provisioning.SetCredentialAsync(card.Id);
        var devicesOk = prov.Success && credProv.Success;

        // The admin explicitly asserts the Home Key is on the member's device — this is the
        // gate the door respects. Device pushes are best-effort and surfaced as a warning.
        card.HomeKeyProvisionedAt = DateTime.UtcNow;
        card.HomeKeyProvisionedByUserId = actorUserId;
        await _context.SaveChangesAsync();

        await LogAsync(devicesOk ? AccessEventType.HomeKeyProvisioned : AccessEventType.HomeKeyProvisionFailed, actorUserId,
            rfidCardId: card.Id, credentialType: card.CredentialType, credentialIdentifier: card.CardIdentifier,
            userId: card.UserId, granted: devicesOk,
            reason: devicesOk
                ? "Home Key provisioned to member device."
                : $"Home Key marked provisioned, but device push was incomplete: {prov.Message} / {credProv.Message}");
        await AuditAsync("AccessCredential", card.Id.ToString(), card.CardIdentifier, "HomeKeyProvisioned",
            devicesOk ? null : $"{prov.Message}; {credProv.Message}", actorUserId);

        var dto = await BuildCredentialDtoAsync(card.Id);
        return devicesOk
            ? new OkObjectResult(dto)
            : new ObjectResult(new { message = "Marked provisioned. Device push was incomplete — re-run once the ESP32 is reachable.", credential = dto, details = prov.DeviceMessages.Concat(credProv.DeviceMessages) }) { StatusCode = 207 };
    }

    public async Task<IActionResult> SetCredentialDoorsAsync(Guid rfidCardId, SetCredentialDoorsDto dto, string actorUserId)
    {
        var card = await LoadCardAsync(rfidCardId);
        if (card is null)
            return NotFound("Credential not found.");

        List<AccessDoor> doors = [];
        if (!dto.AllDoors && dto.DoorIds.Count > 0)
        {
            doors = await _context.AccessDoors.Where(d => dto.DoorIds.Contains(d.Id)).ToListAsync();
            if (doors.Count != dto.DoorIds.Distinct().Count())
                return new BadRequestObjectResult(new { message = "One or more doors were not found." });
        }

        _context.AccessDoorGrants.RemoveRange(card.DoorGrants);
        card.AllDoors = dto.AllDoors;
        if (!dto.AllDoors)
        {
            foreach (var door in doors)
            {
                _context.AccessDoorGrants.Add(new AccessDoorGrant
                {
                    Id = Guid.NewGuid(),
                    RfidCardId = card.Id,
                    DoorId = door.Id,
                    GrantedAt = DateTime.UtcNow,
                    GrantedByUserId = actorUserId
                });
            }
        }
        await _context.SaveChangesAsync();

        if (card.IsUsable)
        {
            await _provisioning.SetUserAsync(card.Id);
            await _provisioning.SetCredentialAsync(card.Id);
        }

        await LogAsync(AccessEventType.CredentialEnabled, actorUserId, rfidCardId: card.Id,
            credentialType: card.CredentialType, credentialIdentifier: card.CardIdentifier, userId: card.UserId,
            reason: dto.AllDoors ? "Granted access to all doors." : $"Door access set to {doors.Count} door(s).");
        await AuditAsync("AccessCredential", card.Id.ToString(), card.CardIdentifier, "DoorsUpdated",
            dto.AllDoors ? "All doors" : string.Join(", ", doors.Select(d => d.Name)), actorUserId);

        return new OkObjectResult(await BuildCredentialDtoAsync(card.Id));
    }

    // ════════════════════════════ Logs ════════════════════════════

    public async Task<IActionResult> GetLogsAsync(AccessLogQueryDto q)
    {
        var query = _context.AccessLogs
            .Include(l => l.User)
            .Include(l => l.ActorUser)
            .AsQueryable();

        if (q.DoorId.HasValue) query = query.Where(l => l.DoorId == q.DoorId.Value);
        if (q.RfidCardId.HasValue) query = query.Where(l => l.RfidCardId == q.RfidCardId.Value);
        if (!string.IsNullOrEmpty(q.UserId)) query = query.Where(l => l.UserId == q.UserId);
        if (q.Granted.HasValue) query = query.Where(l => l.Granted == q.Granted.Value);
        if (!string.IsNullOrEmpty(q.EventType) &&
            Enum.TryParse<AccessEventType>(q.EventType, ignoreCase: true, out var et))
            query = query.Where(l => l.EventType == et);

        if (!string.IsNullOrEmpty(q.DateFrom) &&
            DateTime.TryParseExact(q.DateFrom, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var rawFrom))
        {
            var from = DateTime.SpecifyKind(rawFrom.Date, DateTimeKind.Utc);
            query = query.Where(l => l.Timestamp >= from);
        }
        if (!string.IsNullOrEmpty(q.DateTo) &&
            DateTime.TryParseExact(q.DateTo, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var rawTo))
        {
            var toExclusive = DateTime.SpecifyKind(rawTo.Date, DateTimeKind.Utc).AddDays(1);
            query = query.Where(l => l.Timestamp < toExclusive);
        }

        var page = Math.Max(1, q.Page);
        var pageSize = Math.Clamp(q.PageSize, 1, 200);
        var total = await query.CountAsync();
        var logs = await query
            .OrderByDescending(l => l.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new OkObjectResult(new
        {
            data = logs.Select(MapLog),
            totalCount = total,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling(total / (double)pageSize)
        });
    }

    public async Task<IActionResult> GetCredentialLogsAsync(Guid rfidCardId)
    {
        var logs = await _context.AccessLogs
            .Include(l => l.User)
            .Include(l => l.ActorUser)
            .Where(l => l.RfidCardId == rfidCardId)
            .OrderByDescending(l => l.Timestamp)
            .Take(200)
            .ToListAsync();

        return new OkObjectResult(logs.Select(MapLog));
    }

    // ════════════════════════════ Webhook ════════════════════════════

    public async Task<(int status, AccessVerifyResponseDto body)> VerifyAccessAsync(string? clientIp, string? deviceKey, AccessVerifyRequestDto dto)
    {
        var device = await ResolveDeviceAsync(clientIp, deviceKey);
        if (device is null)
        {
            await LogAsync(AccessEventType.DeviceRejected, actorUserId: null, granted: false,
                credentialIdentifier: dto.Uuid, reason: $"Unknown or disallowed device (ip {clientIp ?? "?"}).");
            await _context.SaveChangesAsync();
            return (401, new AccessVerifyResponseDto { Granted = false, Reason = "unknown device" });
        }

        device.LastSeenAt = DateTime.UtcNow;

        var door = device.Door;
        Enum.TryParse<AccessCredentialType>(dto.CredentialType, ignoreCase: true, out var reqType);

        async Task<(int, AccessVerifyResponseDto)> Deny(string reason)
        {
            await LogAsync(AccessEventType.Denied, actorUserId: null, granted: false, doorId: door?.Id, doorName: door?.Name,
                deviceId: device.Id, credentialIdentifier: dto.Uuid, reason: reason, metadata: dto.Metadata,
                credentialType: dto.CredentialType is null ? null : reqType);
            await _context.SaveChangesAsync();
            return (200, new AccessVerifyResponseDto { Granted = false, Reason = reason, DoorId = door?.Id });
        }

        if (door is null || !door.IsActive)
            return await Deny("door disabled");

        var card = await _context.UserRfidCards
            .Include(c => c.User)
            .Include(c => c.DoorGrants)
            .FirstOrDefaultAsync(c => c.CardIdentifier == dto.Uuid);

        if (card is null)
            return await Deny("unknown credential");
        if (card.UserId is null)
            return await Deny("credential not assigned");

        var reason = card.Status switch
        {
            AccessCredentialStatus.Pending => "awaiting acceptance",
            AccessCredentialStatus.Declined => "credential declined",
            AccessCredentialStatus.Disabled => "credential disabled",
            AccessCredentialStatus.Revoked => "credential revoked",
            _ => null
        };
        if (reason is not null)
            return await Deny(reason);
        if (card.CredentialType == AccessCredentialType.HomeKey && card.HomeKeyProvisionedAt is null)
            return await Deny("home key not provisioned");
        if (!card.AllDoors && card.DoorGrants.All(g => g.DoorId != door.Id))
            return await Deny("no access to this door");

        card.LastUsedAt = DateTime.UtcNow;
        var name = FullName(card.User);
        await LogAsync(AccessEventType.Unlock, actorUserId: null, granted: true, doorId: door.Id, doorName: door.Name,
            deviceId: device.Id, rfidCardId: card.Id, credentialType: card.CredentialType,
            credentialIdentifier: dto.Uuid, userId: card.UserId, reason: $"Unlocked for {name}.", metadata: dto.Metadata);
        await _context.SaveChangesAsync();

        return (200, new AccessVerifyResponseDto { Granted = true, Reason = "granted", UserName = name, DoorId = door.Id });
    }

    public async Task<(int status, object body)> ReportEventAsync(string? clientIp, string? deviceKey, AccessEventReportDto dto)
    {
        var device = await ResolveDeviceAsync(clientIp, deviceKey);
        if (device is null)
        {
            await LogAsync(AccessEventType.DeviceRejected, actorUserId: null, granted: false,
                reason: $"Event from unknown device (ip {clientIp ?? "?"}).");
            await _context.SaveChangesAsync();
            return (401, new { message = "unknown device" });
        }

        device.LastSeenAt = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(dto.FirmwareVersion))
            device.FirmwareVersion = dto.FirmwareVersion.Trim();

        if (!Enum.TryParse<AccessEventType>(dto.EventType, ignoreCase: true, out var eventType))
            eventType = AccessEventType.DeviceHeartbeat;

        UserRfidCard? card = null;
        if (!string.IsNullOrWhiteSpace(dto.Uuid))
            card = await _context.UserRfidCards.FirstOrDefaultAsync(c => c.CardIdentifier == dto.Uuid);

        await LogAsync(eventType, actorUserId: null, doorId: device.DoorId, doorName: device.Door?.Name,
            deviceId: device.Id, rfidCardId: card?.Id, credentialIdentifier: dto.Uuid, userId: card?.UserId,
            reason: $"Reported by {device.Name}.", metadata: dto.Metadata);
        await _context.SaveChangesAsync();

        return (200, new { message = "recorded" });
    }

    // ════════════════════════════ helpers ════════════════════════════

    private async Task<UserRfidCard?> LoadCardAsync(Guid id) =>
        await _context.UserRfidCards
            .Include(c => c.User)
            .Include(c => c.DoorGrants)
            .FirstOrDefaultAsync(c => c.Id == id);

    private async Task<AccessDevice?> ResolveDeviceAsync(string? clientIp, string? deviceKey)
    {
        if (string.IsNullOrWhiteSpace(deviceKey))
            return null;

        var device = await _context.AccessDevices
            .Include(d => d.Door)
            .FirstOrDefaultAsync(d => d.Secret == deviceKey && d.IsAllowed);

        if (device is null)
            return null;

        // Optional per-device IP allow-list. Off by default because a proxy/NAT usually
        // rewrites the client address (e.g. "::ffff:172.18.0.1" from a Docker bridge).
        if (device.EnforceIpCheck && !string.IsNullOrWhiteSpace(device.IpAddress))
        {
            var normalized = NormalizeIp(clientIp);
            if (!string.Equals(normalized, device.IpAddress.Trim(), StringComparison.OrdinalIgnoreCase))
                return null;
        }

        return device;
    }

    private async Task LogAsync(
        AccessEventType eventType,
        string? actorUserId,
        Guid? doorId = null,
        string? doorName = null,
        Guid? deviceId = null,
        Guid? rfidCardId = null,
        AccessCredentialType? credentialType = null,
        string? credentialIdentifier = null,
        string? userId = null,
        bool? granted = null,
        string? reason = null,
        string? metadata = null)
    {
        _context.AccessLogs.Add(new AccessLog
        {
            Id = Guid.NewGuid(),
            EventType = eventType,
            Granted = granted,
            Reason = Truncate(reason, 500),
            DoorId = doorId,
            DoorName = doorName,
            DeviceId = deviceId,
            RfidCardId = rfidCardId,
            CredentialType = credentialType,
            CredentialIdentifier = Truncate(credentialIdentifier, 200),
            UserId = userId,
            ActorUserId = actorUserId,
            Metadata = Truncate(metadata, 4000),
            Timestamp = DateTime.UtcNow
        });
        // Management calls SaveChanges themselves; webhook path saves explicitly.
        if (actorUserId is not null)
            await _context.SaveChangesAsync();
    }

    private Task AuditAsync(string entityType, string entityId, string entityName, string action, string? detail, string actorUserId) =>
        _events.PublishAsync(new AccessLogEvent(entityType, entityId, entityName, action, detail, actorUserId));

    private async Task<string> ActorName(string userId)
    {
        var u = await _context.Users.FirstOrDefaultAsync(x => x.Id == userId);
        return u is null ? "A board member" : FullName(u);
    }

    private static string FullName(ApplicationUser u) =>
        string.IsNullOrWhiteSpace($"{u.FirstName}{u.LastName}") ? u.Email ?? "Member" : $"{u.FirstName} {u.LastName}".Trim();

    private static string GenerateSecret() =>
        Convert.ToHexString(RandomNumberGenerator.GetBytes(24)).ToLowerInvariant();

    private static string? NormalizeIp(string? ip)
    {
        if (string.IsNullOrWhiteSpace(ip)) return ip;
        ip = ip.Trim();
        // IPv4-mapped IPv6 -> IPv4
        if (ip.StartsWith("::ffff:", StringComparison.OrdinalIgnoreCase))
            ip = ip[7..];
        return ip;
    }

    private static string? Truncate(string? s, int max) =>
        string.IsNullOrEmpty(s) || s.Length <= max ? s : s[..max];

    private static NotFoundObjectResult NotFound(string message) => new(new { message });

    private bool DeviceOnline(AccessDevice d) =>
        d.LastSeenAt.HasValue && d.LastSeenAt.Value > DateTime.UtcNow.AddMinutes(-DeviceOnlineWindowMinutes);

    private AccessDoorDto MapDoor(AccessDoor d) => new()
    {
        Id = d.Id,
        Name = d.Name,
        Location = d.Location,
        Description = d.Description,
        IsActive = d.IsActive,
        CreatedAt = d.CreatedAt,
        CreatedByUserId = d.CreatedByUserId,
        CreatedByName = d.CreatedByUser is null ? null : FullName(d.CreatedByUser),
        DeviceCount = d.Devices?.Count ?? 0,
        OnlineDeviceCount = d.Devices?.Count(DeviceOnline) ?? 0
    };

    private AccessDeviceDto MapDevice(AccessDevice d, bool includeSecret) => new()
    {
        Id = d.Id,
        Name = d.Name,
        DoorId = d.DoorId,
        DoorName = d.Door?.Name,
        IpAddress = d.IpAddress,
        Port = d.Port,
        IsAllowed = d.IsAllowed,
        EnforceIpCheck = d.EnforceIpCheck,
        CreatedAt = d.CreatedAt,
        LastSeenAt = d.LastSeenAt,
        LastSyncAt = d.LastSyncAt,
        FirmwareVersion = d.FirmwareVersion,
        IsOnline = DeviceOnline(d),
        Secret = includeSecret ? d.Secret : null
    };

    private static AccessLogDto MapLog(AccessLog l) => new()
    {
        Id = l.Id,
        EventType = l.EventType.ToString(),
        Granted = l.Granted,
        Reason = l.Reason,
        DoorId = l.DoorId,
        DoorName = l.DoorName,
        DeviceId = l.DeviceId,
        RfidCardId = l.RfidCardId,
        CredentialType = l.CredentialType?.ToString(),
        CredentialIdentifier = l.CredentialIdentifier,
        UserId = l.UserId,
        UserName = l.User is null ? null : FullName(l.User),
        ActorUserId = l.ActorUserId,
        ActorName = l.ActorUser is null ? null : FullName(l.ActorUser),
        Metadata = l.Metadata,
        Timestamp = l.Timestamp
    };

    private async Task<UserRfidCardDto> BuildCredentialDtoAsync(Guid cardId)
    {
        var card = await _context.UserRfidCards
            .Include(c => c.User)
            .Include(c => c.RegisteredByUser)
            .Include(c => c.AssignedByUser)
            .Include(c => c.RevokedByUser)
            .Include(c => c.DoorGrants).ThenInclude(g => g.Door)
            .FirstAsync(c => c.Id == cardId);

        return new UserRfidCardDto
        {
            Id = card.Id,
            CardIdentifier = card.CardIdentifier,
            RegisteredAt = card.RegisteredAt,
            RegisteredByUserId = card.RegisteredByUserId,
            RegisteredByUserEmail = card.RegisteredByUser?.Email,
            IsActive = card.IsActive,
            Notes = card.Notes,
            UserId = card.UserId,
            MemberCode = card.User?.MemberCode,
            UserEmail = card.User?.Email,
            UserFullName = card.User is null ? null : FullName(card.User),
            AssignedAt = card.AssignedAt,
            AssignedByUserId = card.AssignedByUserId,
            AssignedByUserEmail = card.AssignedByUser?.Email,
            RevokedAt = card.RevokedAt,
            RevokedByUserId = card.RevokedByUserId,
            RevokedByUserEmail = card.RevokedByUser?.Email,
            RevocationReason = card.RevocationReason,
            CredentialType = card.CredentialType.ToString(),
            Status = card.Status.ToString(),
            DeclineReason = card.DeclineReason,
            UserNumber = card.UserNumber,
            CredentialNumber = card.CredentialNumber,
            HomeKeyProvisionedAt = card.HomeKeyProvisionedAt,
            AllDoors = card.AllDoors,
            LastUsedAt = card.LastUsedAt,
            Doors = card.DoorGrants.Select(g => new AccessDoorRefDto { Id = g.DoorId, Name = g.Door?.Name ?? "" }).ToList()
        };
    }
}
