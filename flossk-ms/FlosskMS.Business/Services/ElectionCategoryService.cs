using FlosskMS.Business.DTOs;
using FlosskMS.Data;
using FlosskMS.Data.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace FlosskMS.Business.Services;

public class ElectionCategoryService(
    ApplicationDbContext dbContext,
    ILogger<ElectionCategoryService> logger) : IElectionCategoryService
{
    private readonly ApplicationDbContext _dbContext = dbContext;
    private readonly ILogger<ElectionCategoryService> _logger = logger;

    // -------------------------------------------------------------------------
    // GET ALL
    // -------------------------------------------------------------------------

    public async Task<IActionResult> GetElectionCategoriesAsync()
    {
        var categories = await _dbContext.ElectionCategories
            .Include(c => c.CreatedByUser)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        var dtos = categories.Select(MapToDto).ToList();
        return new OkObjectResult(dtos);
    }

    // -------------------------------------------------------------------------
    // GET BY ID
    // -------------------------------------------------------------------------

    public async Task<IActionResult> GetElectionCategoryByIdAsync(Guid id)
    {
        var category = await _dbContext.ElectionCategories
            .Include(c => c.CreatedByUser)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
            return new NotFoundObjectResult(new { Error = "Election category not found." });

        return new OkObjectResult(MapToDto(category));
    }

    public async Task<IActionResult> CreateElectionCategoryAsync(CreateElectionCategoryDto request, ClaimsPrincipal currentUser)
    {
        var userId = currentUser.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return new UnauthorizedResult();

        return await CreateElectionCategoryAsync(request, userId);
    }

    // -------------------------------------------------------------------------
    // CREATE  (Admin only — enforced in controller)
    // -------------------------------------------------------------------------

    public async Task<IActionResult> CreateElectionCategoryAsync(CreateElectionCategoryDto request, string userId)
    {
        if (!Enum.TryParse<ElectionVotingRule>(request.VotingRule, ignoreCase: true, out var votingRule))
            return new BadRequestObjectResult(new
            {
                Error = $"Invalid voting rule '{request.VotingRule}'. Allowed values: AdminOnly, FullMembersOnly, AllUsers."
            });

        var category = new ElectionCategory
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            VotingRule = votingRule,
            CreatedAt = DateTime.UtcNow,
            CreatedByUserId = userId
        };

        _dbContext.ElectionCategories.Add(category);
        await _dbContext.SaveChangesAsync();

        // Re-load with navigation properties for the response
        await _dbContext.Entry(category).Reference(c => c.CreatedByUser).LoadAsync();

        _logger.LogInformation("Election category {CategoryId} created by user {UserId}", category.Id, userId);

        return new ObjectResult(MapToDto(category)) { StatusCode = 201 };
    }

    // -------------------------------------------------------------------------
    // UPDATE  (Admin only — enforced in controller)
    // -------------------------------------------------------------------------

    public async Task<IActionResult> UpdateElectionCategoryAsync(Guid id, UpdateElectionCategoryDto request, string userId)
    {
        var category = await _dbContext.ElectionCategories
            .Include(c => c.CreatedByUser)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
            return new NotFoundObjectResult(new { Error = "Election category not found." });

        if (!Enum.TryParse<ElectionVotingRule>(request.VotingRule, ignoreCase: true, out var votingRule))
            return new BadRequestObjectResult(new
            {
                Error = $"Invalid voting rule '{request.VotingRule}'. Allowed values: AdminOnly, FullMembersOnly, AllUsers."
            });

        category.Title = request.Title;
        category.Description = request.Description;
        category.VotingRule = votingRule;

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Election category {CategoryId} updated by user {UserId}", id, userId);

        return new OkObjectResult(MapToDto(category));
    }

    public async Task<IActionResult> UpdateElectionCategoryAsync(Guid id, UpdateElectionCategoryDto request, ClaimsPrincipal currentUser)
    {
        var userId = currentUser.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return new UnauthorizedResult();

        return await UpdateElectionCategoryAsync(id, request, userId);
    }

    // -------------------------------------------------------------------------
    // DELETE  (Admin only — enforced in controller)
    // -------------------------------------------------------------------------
    public async Task<IActionResult> DeleteElectionCategoryAsync(Guid id, string userId)
    {
        var category = await _dbContext.ElectionCategories.FindAsync(id);

        if (category == null)
            return new NotFoundObjectResult(new { Error = "Election category not found." });

        _dbContext.ElectionCategories.Remove(category);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Election category {CategoryId} deleted by user {UserId}", id, userId);

        return new OkObjectResult(new { Message = "Election category deleted successfully." });
    }

    public async Task<IActionResult> DeleteElectionCategoryAsync(Guid id, ClaimsPrincipal currentUser)
    {
        var userId = currentUser.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return new UnauthorizedResult();

        return await DeleteElectionCategoryAsync(id, userId);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private static ElectionCategoryDto MapToDto(ElectionCategory category) => new()
    {
        Id = category.Id,
        Title = category.Title,
        Description = category.Description,
        VotingRule = category.VotingRule.ToString(),
        CreatedAt = category.CreatedAt,
        CreatedByUserId = category.CreatedByUserId,
        CreatedByName = category.CreatedByUser is { } u
            ? $"{u.FirstName} {u.LastName}".Trim()
            : string.Empty
    };
}
