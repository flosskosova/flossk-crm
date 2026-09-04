using FlosskMS.Business.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.Business.Services;

public interface IAccessService
{
    // Doors
    Task<IActionResult> GetDoorsAsync();
    Task<IActionResult> GetDoorAsync(Guid id);
    Task<IActionResult> CreateDoorAsync(CreateAccessDoorDto dto, string actorUserId);
    Task<IActionResult> UpdateDoorAsync(Guid id, UpdateAccessDoorDto dto, string actorUserId);
    Task<IActionResult> DeleteDoorAsync(Guid id, string actorUserId);

    // Devices (ESP32)
    Task<IActionResult> GetDevicesAsync(Guid? doorId = null);
    Task<IActionResult> GetDeviceAsync(Guid id);
    Task<IActionResult> CreateDeviceAsync(CreateAccessDeviceDto dto, string actorUserId);
    Task<IActionResult> UpdateDeviceAsync(Guid id, UpdateAccessDeviceDto dto, string actorUserId);
    Task<IActionResult> DeleteDeviceAsync(Guid id, string actorUserId);
    Task<IActionResult> SyncDeviceAsync(Guid id);

    // Credential lifecycle (extends the RFID card feature)
    Task<IActionResult> AssignCredentialAsync(AssignAccessCredentialDto dto, string actorUserId);
    Task<IActionResult> AcceptCredentialAsync(Guid rfidCardId, string actorUserId);
    Task<IActionResult> DeclineCredentialAsync(Guid rfidCardId, DeclineAccessCredentialDto dto, string actorUserId);
    Task<IActionResult> DisableCredentialAsync(Guid rfidCardId, string actorUserId);
    Task<IActionResult> EnableCredentialAsync(Guid rfidCardId, string actorUserId);
    Task<IActionResult> ProvisionHomeKeyAsync(Guid rfidCardId, string actorUserId);
    Task<IActionResult> SetCredentialDoorsAsync(Guid rfidCardId, SetCredentialDoorsDto dto, string actorUserId);

    // Logs
    Task<IActionResult> GetLogsAsync(AccessLogQueryDto query);
    Task<IActionResult> GetCredentialLogsAsync(Guid rfidCardId);

    // Webhook (called by ESP32 devices)
    Task<(int status, AccessVerifyResponseDto body)> VerifyAccessAsync(string? clientIp, string? deviceKey, AccessVerifyRequestDto dto);
    Task<(int status, object body)> ReportEventAsync(string? clientIp, string? deviceKey, AccessEventReportDto dto);
}
