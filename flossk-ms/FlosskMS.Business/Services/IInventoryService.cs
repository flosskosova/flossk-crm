using FlosskMS.Business.DTOs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FlosskMS.Business.Services;

public interface IInventoryService
{
    Task<IActionResult> GetAllInventoryItemsAsync(int page = 1, int pageSize = 20, string? category = null, string? status = null, string? condition = null, string? search = null, string? currentUserId = null);
    Task<IActionResult> GetInventoryItemByIdAsync(Guid id);
    Task<IActionResult> GetInventoryItemsByUserAsync(ClaimsPrincipal currentUser);
    Task<IActionResult> GetInventoryItemsByUserAsync(string userId);
    Task<IActionResult> CreateInventoryItemAsync(CreateInventoryItemDto dto, ClaimsPrincipal currentUser);
    Task<IActionResult> CreateInventoryItemAsync(CreateInventoryItemDto dto, string createdByUserId);
    Task<IActionResult> UpdateInventoryItemAsync(Guid id, UpdateInventoryItemDto dto, ClaimsPrincipal currentUser);
    Task<IActionResult> UpdateInventoryItemAsync(Guid id, UpdateInventoryItemDto dto, string userId);
    Task<IActionResult> DeleteInventoryItemAsync(Guid id, ClaimsPrincipal currentUser);
    Task<IActionResult> DeleteInventoryItemAsync(Guid id, string userId);
    Task<IActionResult> CheckOutInventoryItemAsync(Guid id, ClaimsPrincipal currentUser, CheckOutInventoryItemDto? dto = null);
    Task<IActionResult> CheckOutInventoryItemAsync(Guid id, string userId, CheckOutInventoryItemDto? dto = null);
    Task<IActionResult> CheckInInventoryItemAsync(Guid id, ClaimsPrincipal currentUser, CheckInInventoryItemDto? dto = null);
    Task<IActionResult> CheckInInventoryItemAsync(Guid id, string userId, CheckInInventoryItemDto? dto = null);
    Task<IActionResult> ReportDamageAsync(Guid id, ClaimsPrincipal currentUser, string? notes = null);
    Task<IActionResult> ReportDamageAsync(Guid id, string userId, string? notes = null);
    Task<IActionResult> ReportRepairAsync(Guid id, ClaimsPrincipal currentUser, string? notes = null);
    Task<IActionResult> ReportRepairAsync(Guid id, string userId, string? notes = null);
    Task<IActionResult> AddImageToInventoryItemAsync(Guid id, Guid fileId, ClaimsPrincipal currentUser);
    Task<IActionResult> AddImageToInventoryItemAsync(Guid id, Guid fileId, string userId);
    Task<IActionResult> RemoveImageFromInventoryItemAsync(Guid id, Guid imageId, ClaimsPrincipal currentUser);
    Task<IActionResult> RemoveImageFromInventoryItemAsync(Guid id, Guid imageId, string userId);
    Task<IActionResult> SeedInventoryItemsAsync(ClaimsPrincipal currentUser);
    Task<IActionResult> SeedInventoryItemsAsync(string createdByUserId);
    Task<IActionResult> ImportInventoryItemsAsync(IFormFile file, ClaimsPrincipal currentUser);
    Task<IActionResult> ImportInventoryItemsAsync(IFormFile file, string createdByUserId);
    Task<IActionResult> DeleteAllInventoryItemsAsync();
    Task<IActionResult> GetInventoryCountAsync();
    Task<IActionResult> GetInventoryCategoriesAsync();
    Task<IActionResult> GetInventoryExportAsync();
    Task<IActionResult> GetInventoryExportExcelAsync();
    
    // Checkout specific endpoints
    Task<IActionResult> GetAllCheckoutsAsync();
    Task<IActionResult> GetCheckoutsByItemIdAsync(Guid itemId);
    Task<IActionResult> GetCheckoutsByUserIdAsync(ClaimsPrincipal currentUser);
    Task<IActionResult> GetCheckoutsByUserIdAsync(string userId);
    Task<IActionResult> GetUsersWithCheckoutsAsync();
}
