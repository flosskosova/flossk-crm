using AutoMapper;
using FlosskMS.Business.DomainEvents;
using FlosskMS.Business.DomainEvents.Announcements.Events;
using FlosskMS.Business.DTOs;
using FlosskMS.Data;
using FlosskMS.Data.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FlosskMS.Business.Services;

public class AnnouncementService : IAnnouncementService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IMapper _mapper;
    private readonly ILogger<AnnouncementService> _logger;
    private readonly IDomainEventDispatcher _domainEventDispatcher;

    public AnnouncementService(
        ApplicationDbContext dbContext,
        IMapper mapper,
        ILogger<AnnouncementService> logger,
        IDomainEventDispatcher domainEventDispatcher)
    {
        _dbContext = dbContext;
        _mapper = mapper;
        _logger = logger;
        _domainEventDispatcher = domainEventDispatcher;
    }

    public async Task<IActionResult> CreateAnnouncementAsync(CreateAnnouncementDto request, string userId)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return new BadRequestObjectResult(new { Error = "Title is required." });
        }

        if (string.IsNullOrWhiteSpace(request.Body))
        {
            return new BadRequestObjectResult(new { Error = "Body is required." });
        }

        if (!Enum.TryParse<AnnouncementImportance>(request.Importance, true, out _))
        {
            return new BadRequestObjectResult(new { Error = "Invalid importance value. Valid values are: Normal, Medium, High, Urgent." });
        }

        if (!Enum.TryParse<AnnouncementCategory>(request.Category, true, out _))
        {
            return new BadRequestObjectResult(new { Error = "Invalid category value. Valid values are: General, Events, Updates, Maintenance, Meetings." });
        }

        var user = await _dbContext.Users.FindAsync(userId);
        if (user == null)
        {
            return new NotFoundObjectResult(new { Error = "User not found." });
        }

        var announcement = _mapper.Map<Announcement>(request);
        announcement.Id = Guid.NewGuid();
        announcement.CreatedAt = DateTime.UtcNow;
        announcement.CreatedByUserId = userId;
        announcement.ViewCount = 0;

        _dbContext.Announcements.Add(announcement);
        await _dbContext.SaveChangesAsync();

        // Reload with user for mapping
        announcement.CreatedByUser = user;
        announcement.Reactions = new List<AnnouncementReaction>();

        _logger.LogInformation("Announcement {AnnouncementId} created by user {UserId}", announcement.Id, userId);

        await _domainEventDispatcher.PublishAsync(
            new AnnouncementCreatedEvent(
                announcement.Title,
                $"{user.FirstName} {user.LastName}".Trim(),
                userId));

        return new OkObjectResult(MapToAnnouncementDto(announcement, userId));
    }

    public async Task<IActionResult> GetAnnouncementsAsync(int page = 1, int pageSize = 10, string? category = null, string? importance = null, string? currentUserId = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _dbContext.Announcements
            .Include(a => a.CreatedByUser)
                .ThenInclude(u => u.UploadedFiles)
            .Include(a => a.Reactions)
                .ThenInclude(r => r.User)
            .AsQueryable();

        // Filter by category
        if (!string.IsNullOrWhiteSpace(category) && Enum.TryParse<AnnouncementCategory>(category, true, out var categoryEnum))
        {
            query = query.Where(a => a.Category == categoryEnum);
        }

        // Filter by importance
        if (!string.IsNullOrWhiteSpace(importance) && Enum.TryParse<AnnouncementImportance>(importance, true, out var importanceEnum))
        {
            query = query.Where(a => a.Importance == importanceEnum);
        }

        var totalCount = await query.CountAsync();

        var announcements = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var announcementDtos = announcements.Select(a => MapToAnnouncementDto(a, currentUserId)).ToList();

        var result = new AnnouncementListDto
        {
            Announcements = announcementDtos,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };

        return new OkObjectResult(result);
    }

    public async Task<IActionResult> GetAnnouncementByIdAsync(Guid id, string? currentUserId = null)
    {
        var announcement = await _dbContext.Announcements
            .Include(a => a.CreatedByUser)
                .ThenInclude(u => u.UploadedFiles)
            .Include(a => a.Reactions)
                .ThenInclude(r => r.User)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (announcement == null)
        {
            return new NotFoundObjectResult(new { Error = "Announcement not found." });
        }

        return new OkObjectResult(MapToAnnouncementDto(announcement, currentUserId));
    }

    public async Task<IActionResult> DeleteAnnouncementAsync(Guid id, string userId)
    {
        var announcement = await _dbContext.Announcements.FindAsync(id);

        if (announcement == null)
        {
            return new NotFoundObjectResult(new { Error = "Announcement not found." });
        }

        // Only the creator can delete their own announcement
        if (announcement.CreatedByUserId != userId)
        {
            return new ForbidResult();
        }

        _dbContext.Announcements.Remove(announcement);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Announcement {AnnouncementId} deleted by user {UserId}", id, userId);

        return new OkObjectResult(new { Message = "Announcement deleted successfully." });
    }

    public async Task<IActionResult> UpdateAnnouncementAsync(Guid id, UpdateAnnouncementDto request, string userId)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return new BadRequestObjectResult(new { Error = "Title is required." });
        }

        if (string.IsNullOrWhiteSpace(request.Body))
        {
            return new BadRequestObjectResult(new { Error = "Body is required." });
        }

        if (!Enum.TryParse<AnnouncementImportance>(request.Importance, true, out var importance))
        {
            return new BadRequestObjectResult(new { Error = "Invalid importance value. Valid values are: Normal, Medium, High, Urgent." });
        }

        if (!Enum.TryParse<AnnouncementCategory>(request.Category, true, out var category))
        {
            return new BadRequestObjectResult(new { Error = "Invalid category value. Valid values are: General, Events, Updates, Maintenance, Meetings." });
        }

        var announcement = await _dbContext.Announcements
            .Include(a => a.CreatedByUser)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (announcement == null)
        {
            return new NotFoundObjectResult(new { Error = "Announcement not found." });
        }

        // Only the creator can edit their own announcement
        if (announcement.CreatedByUserId != userId)
        {
            return new ForbidResult();
        }

        announcement.Title = request.Title;
        announcement.Body = request.Body;
        announcement.Importance = importance;
        announcement.Category = category;
        announcement.IsEdited = true;
        announcement.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        // Reload with reactions for proper mapping
        var updatedAnnouncement = await _dbContext.Announcements
            .Include(a => a.CreatedByUser)
            .Include(a => a.Reactions)
                .ThenInclude(r => r.User)
            .FirstOrDefaultAsync(a => a.Id == id);

        _logger.LogInformation("Announcement {AnnouncementId} updated by user {UserId}", id, userId);

        return new OkObjectResult(MapToAnnouncementDto(updatedAnnouncement!, userId));
    }

    public async Task<IActionResult> IncrementViewCountAsync(Guid id, string userId)
    {
        var announcement = await _dbContext.Announcements.FindAsync(id);

        if (announcement == null)
        {
            return new NotFoundObjectResult(new { Error = "Announcement not found." });
        }

        // Check if this user has already viewed this announcement
        var existingView = await _dbContext.AnnouncementViews
            .FirstOrDefaultAsync(v => v.AnnouncementId == id && v.UserId == userId);

        if (existingView != null)
        {
            // User has already viewed this announcement, don't increment
            return new OkObjectResult(new { ViewCount = announcement.ViewCount, AlreadyViewed = true });
        }

        // Create a new view record
        var view = new AnnouncementView
        {
            Id = Guid.NewGuid(),
            AnnouncementId = id,
            UserId = userId,
            ViewedAt = DateTime.UtcNow
        };

        _dbContext.AnnouncementViews.Add(view);

        // Increment the view count
        announcement.ViewCount++;
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("User {UserId} viewed announcement {AnnouncementId}", userId, id);

        return new OkObjectResult(new { ViewCount = announcement.ViewCount, AlreadyViewed = false });
    }

    public async Task<IActionResult> GetViewCountAsync(Guid id)
    {
        var announcement = await _dbContext.Announcements.FindAsync(id);

        if (announcement == null)
        {
            return new NotFoundObjectResult(new { Error = "Announcement not found." });
        }

        return new OkObjectResult(new { ViewCount = announcement.ViewCount });
    }

    public async Task<IActionResult> AddReactionAsync(Guid announcementId, AddReactionDto request, string userId)
    {
        if (string.IsNullOrWhiteSpace(request.Emoji))
        {
            return new BadRequestObjectResult(new { Error = "Emoji is required." });
        }

        var announcement = await _dbContext.Announcements.FindAsync(announcementId);
        if (announcement == null)
        {
            return new NotFoundObjectResult(new { Error = "Announcement not found." });
        }

        // Check if user already reacted with this emoji
        var existingReaction = await _dbContext.AnnouncementReactions
            .FirstOrDefaultAsync(r => r.AnnouncementId == announcementId && r.UserId == userId && r.Emoji == request.Emoji);

        if (existingReaction != null)
        {
            // Toggle off - remove the reaction
            _dbContext.AnnouncementReactions.Remove(existingReaction);
            await _dbContext.SaveChangesAsync();
            return new OkObjectResult(new { Message = "Reaction removed.", Removed = true });
        }

        // Add new reaction
        var reaction = new AnnouncementReaction
        {
            Id = Guid.NewGuid(),
            AnnouncementId = announcementId,
            UserId = userId,
            Emoji = request.Emoji,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.AnnouncementReactions.Add(reaction);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("User {UserId} added reaction {Emoji} to announcement {AnnouncementId}", userId, request.Emoji, announcementId);

        return new OkObjectResult(new { Message = "Reaction added.", Removed = false });
    }

    public async Task<IActionResult> RemoveReactionAsync(Guid announcementId, string emoji, string userId)
    {
        var reaction = await _dbContext.AnnouncementReactions
            .FirstOrDefaultAsync(r => r.AnnouncementId == announcementId && r.UserId == userId && r.Emoji == emoji);

        if (reaction == null)
        {
            return new NotFoundObjectResult(new { Error = "Reaction not found." });
        }

        _dbContext.AnnouncementReactions.Remove(reaction);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("User {UserId} removed reaction {Emoji} from announcement {AnnouncementId}", userId, emoji, announcementId);

        return new OkObjectResult(new { Message = "Reaction removed." });
    }

    public async Task<IActionResult> GetReactionsAsync(Guid announcementId, string? currentUserId = null)
    {
        var announcement = await _dbContext.Announcements
            .Include(a => a.Reactions)
                .ThenInclude(r => r.User)
            .FirstOrDefaultAsync(a => a.Id == announcementId);

        if (announcement == null)
        {
            return new NotFoundObjectResult(new { Error = "Announcement not found." });
        }

        var reactionSummaries = GetReactionSummaries(announcement.Reactions, currentUserId);
        return new OkObjectResult(reactionSummaries);
    }

    private AnnouncementDto MapToAnnouncementDto(Announcement announcement, string? currentUserId)
    {
        var dto = new AnnouncementDto
        {
            Id = announcement.Id,
            Title = announcement.Title,
            Body = announcement.Body,
            ViewCount = announcement.ViewCount,
            Importance = announcement.Importance.ToString(),
            Category = announcement.Category.ToString(),
            IsEdited = announcement.IsEdited,
            CreatedAt = announcement.CreatedAt,
            UpdatedAt = announcement.UpdatedAt,
            CreatedByUserId = announcement.CreatedByUserId,
            CreatedByFirstName = announcement.CreatedByUser?.FirstName ?? "",
            CreatedByLastName = announcement.CreatedByUser?.LastName ?? "",
            CreatedByProfilePicture = announcement.CreatedByUser?.UploadedFiles?
                .Where(f => f.FileType == FileType.ProfilePicture)
                .Select(f => "/uploads/" + f.FileName)
                .FirstOrDefault(),
            IsCurrentUserCreator = !string.IsNullOrEmpty(currentUserId) && announcement.CreatedByUserId == currentUserId,
            Reactions = GetReactionSummaries(announcement.Reactions ?? new List<AnnouncementReaction>(), currentUserId)
        };
        return dto;
    }

    private List<ReactionSummaryDto> GetReactionSummaries(ICollection<AnnouncementReaction> reactions, string? currentUserId)
    {
        return reactions
            .GroupBy(r => r.Emoji)
            .Select(g => new ReactionSummaryDto
            {
                Emoji = g.Key,
                Count = g.Count(),
                CurrentUserReacted = !string.IsNullOrEmpty(currentUserId) && g.Any(r => r.UserId == currentUserId),
                Users = g.Select(r => new ReactionUserDto
                {
                    UserId = r.UserId,
                    FirstName = r.User?.FirstName ?? "",
                    LastName = r.User?.LastName ?? "",
                    ProfilePicture = null
                }).ToList()
            })
            .OrderByDescending(r => r.Count)
            .ToList();
    }
}
