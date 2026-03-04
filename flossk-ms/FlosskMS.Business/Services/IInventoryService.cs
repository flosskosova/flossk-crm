using FlosskMS.Business.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.Business.Services;

public interface IInventoryService
{
    Task<IActionResult> GetAllInventoryItemsAsync(int page = 1, int pageSize = 20, string? category = null, string? status = null, string? condition = null, string? search = null, string? currentUserId = null);
    Task<IActionResult> GetInventoryItemByIdAsync(Guid id);
    Task<IActionResult> GetInventoryItemsByUserAsync(string userId);
    Task<IActionResult> CreateInventoryItemAsync(CreateInventoryItemDto dto, string createdByUserId);
    Task<IActionResult> UpdateInventoryItemAsync(Guid id, UpdateInventoryItemDto dto, string userId);
    Task<IActionResult> DeleteInventoryItemAsync(Guid id, string userId);
    Task<IActionResult> CheckOutInventoryItemAsync(Guid id, string userId, CheckOutInventoryItemDto? dto = null);
    Task<IActionResult> CheckInInventoryItemAsync(Guid id, string userId);
    Task<IActionResult> ReportDamageAsync(Guid id, string userId);
    Task<IActionResult> ReportRepairAsync(Guid id, string userId);
    Task<IActionResult> AddImageToInventoryItemAsync(Guid id, Guid fileId, string userId);
    Task<IActionResult> RemoveImageFromInventoryItemAsync(Guid id, Guid imageId, string userId);
    Task<IActionResult> SeedInventoryItemsAsync(string createdByUserId);
    Task<IActionResult> DeleteAllInventoryItemsAsync();
}
