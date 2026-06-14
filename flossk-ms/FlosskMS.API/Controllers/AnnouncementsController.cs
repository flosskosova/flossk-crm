using FlosskMS.Business.DTOs;
using FlosskMS.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AnnouncementsController(IAnnouncementService announcementService) : ControllerBase
{
    private readonly IAnnouncementService _announcementService = announcementService;

    /// <summary>
    /// Create a new announcement (Admin only)
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> CreateAnnouncement([FromBody] CreateAnnouncementDto request)
    {
        return await _announcementService.CreateAnnouncementAsync(request, User);
    }

    /// <summary>
    /// Get all announcements with optional filtering and pagination
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAnnouncements(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? category = null,
        [FromQuery] string? importance = null)
    {
        return await _announcementService.GetAnnouncementsAsync(User, page, pageSize, category, importance);
    }

    /// <summary>
    /// Get a specific announcement by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetAnnouncementById(Guid id)
    {
        return await _announcementService.GetAnnouncementByIdAsync(id, User);
    }

    /// <summary>
    /// Delete an announcement (Admin only)
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteAnnouncement(Guid id)
    {
        return await _announcementService.DeleteAnnouncementAsync(id, User);
    }

    /// <summary>
    /// Update an announcement (Admin only)
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateAnnouncement(Guid id, [FromBody] UpdateAnnouncementDto request)
    {
        return await _announcementService.UpdateAnnouncementAsync(id, request, User);
    }

    /// <summary>
    /// Increment the view count of an announcement
    /// </summary>
    [HttpPost("{id:guid}/view")]
    public async Task<IActionResult> IncrementViewCount(Guid id)
    {
        return await _announcementService.IncrementViewCountAsync(id, User);
    }

    /// <summary>
    /// Get the view count of an announcement
    /// </summary>
    [HttpGet("{id:guid}/view-count")]
    public async Task<IActionResult> GetViewCount(Guid id)
    {
        return await _announcementService.GetViewCountAsync(id);
    }

    /// <summary>
    /// Add or toggle a reaction to an announcement
    /// </summary>
    [HttpPost("{id:guid}/reactions")]
    public async Task<IActionResult> AddReaction(Guid id, [FromBody] AddReactionDto request)
    {
        return await _announcementService.AddReactionAsync(id, request, User);
    }

    /// <summary>
    /// Remove a reaction from an announcement
    /// </summary>
    [HttpDelete("{id:guid}/reactions/{emoji}")]
    public async Task<IActionResult> RemoveReaction(Guid id, string emoji)
    {
        return await _announcementService.RemoveReactionAsync(id, emoji, User);
    }

    /// <summary>
    /// Get all reactions for an announcement
    /// </summary>
    [HttpGet("{id:guid}/reactions")]
    public async Task<IActionResult> GetReactions(Guid id)
    {
        return await _announcementService.GetReactionsAsync(id, User);
    }
}
