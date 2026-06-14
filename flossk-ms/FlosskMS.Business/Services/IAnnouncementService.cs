using FlosskMS.Business.DTOs;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FlosskMS.Business.Services;

public interface IAnnouncementService
{
    Task<IActionResult> CreateAnnouncementAsync(CreateAnnouncementDto request, ClaimsPrincipal currentUser);
    Task<IActionResult> CreateAnnouncementAsync(CreateAnnouncementDto request, string userId);
    Task<IActionResult> UpdateAnnouncementAsync(Guid id, UpdateAnnouncementDto request, ClaimsPrincipal currentUser);
    Task<IActionResult> UpdateAnnouncementAsync(Guid id, UpdateAnnouncementDto request, string userId);
    Task<IActionResult> GetAnnouncementsAsync(ClaimsPrincipal currentUser, int page = 1, int pageSize = 10, string? category = null, string? importance = null);
    Task<IActionResult> GetAnnouncementsAsync(int page = 1, int pageSize = 10, string? category = null, string? importance = null, string? currentUserId = null);
    Task<IActionResult> GetAnnouncementByIdAsync(Guid id, ClaimsPrincipal currentUser);
    Task<IActionResult> GetAnnouncementByIdAsync(Guid id, string? currentUserId = null);
    Task<IActionResult> DeleteAnnouncementAsync(Guid id, ClaimsPrincipal currentUser);
    Task<IActionResult> DeleteAnnouncementAsync(Guid id, string userId);
    Task<IActionResult> IncrementViewCountAsync(Guid id, ClaimsPrincipal currentUser);
    Task<IActionResult> IncrementViewCountAsync(Guid id, string userId);
    Task<IActionResult> GetViewCountAsync(Guid id);
    
    // Reaction methods
    Task<IActionResult> AddReactionAsync(Guid announcementId, AddReactionDto request, ClaimsPrincipal currentUser);
    Task<IActionResult> AddReactionAsync(Guid announcementId, AddReactionDto request, string userId);
    Task<IActionResult> RemoveReactionAsync(Guid announcementId, string emoji, ClaimsPrincipal currentUser);
    Task<IActionResult> RemoveReactionAsync(Guid announcementId, string emoji, string userId);
    Task<IActionResult> GetReactionsAsync(Guid announcementId, ClaimsPrincipal currentUser);
    Task<IActionResult> GetReactionsAsync(Guid announcementId, string? currentUserId = null);
}
