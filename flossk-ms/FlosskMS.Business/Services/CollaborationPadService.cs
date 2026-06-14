using AutoMapper;
using FlosskMS.Business.DTOs;
using FlosskMS.Data;
using FlosskMS.Data.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace FlosskMS.Business.Services;

public class CollaborationPadService : ICollaborationPadService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IMapper _mapper;
    private readonly ILogger<CollaborationPadService> _logger;

    public CollaborationPadService(
        ApplicationDbContext dbContext,
        IMapper mapper,
        ILogger<CollaborationPadService> logger)
    {
        _dbContext = dbContext;
        _mapper = mapper;
        _logger = logger;
    }

    private static bool TryGetUserId(ClaimsPrincipal currentUser, out string userId)
    {
        userId = currentUser.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        return !string.IsNullOrEmpty(userId);
    }

    public async Task<IActionResult> CreateCollaborationPadAsync(CreateCollaborationPadDto request, ClaimsPrincipal currentUser)
    {
        if (!TryGetUserId(currentUser, out var userId))
            return new UnauthorizedResult();
        return await CreateCollaborationPadAsync(request, userId);
    }

    public async Task<IActionResult> DeleteCollaborationPadAsync(Guid id, ClaimsPrincipal currentUser)
    {
        if (!TryGetUserId(currentUser, out var userId))
            return new UnauthorizedResult();
        return await DeleteCollaborationPadAsync(id, userId);
    }

    public async Task<IActionResult> UpdateCollaborationPadAsync(Guid id, UpdateCollaborationPadDto request, ClaimsPrincipal currentUser)
    {
        if (!TryGetUserId(currentUser, out var userId))
            return new UnauthorizedResult();
        return await UpdateCollaborationPadAsync(id, request, userId);
    }

    public async Task<IActionResult> CreateCollaborationPadAsync(CreateCollaborationPadDto request, string userId)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return new BadRequestObjectResult(new { Error = "Name is required." });
        }

        if (string.IsNullOrWhiteSpace(request.Url))
        {
            return new BadRequestObjectResult(new { Error = "URL is required." });
        }

        // Validate URL format
        if (!Uri.TryCreate(request.Url, UriKind.Absolute, out var uriResult) ||
            (uriResult.Scheme != Uri.UriSchemeHttp && uriResult.Scheme != Uri.UriSchemeHttps))
        {
            return new BadRequestObjectResult(new { Error = "Invalid URL format. URL must be a valid HTTP or HTTPS URL." });
        }

        var user = await _dbContext.Users.FindAsync(userId);
        if (user == null)
        {
            return new NotFoundObjectResult(new { Error = "User not found." });
        }

        var collaborationPad = _mapper.Map<CollaborationPad>(request);
        collaborationPad.Id = Guid.NewGuid();
        collaborationPad.CreatedAt = DateTime.UtcNow;
        collaborationPad.CreatedByUserId = userId;

        _dbContext.CollaborationPads.Add(collaborationPad);
        await _dbContext.SaveChangesAsync();

        // Reload with user for mapping
        collaborationPad.CreatedByUser = user;

        _logger.LogInformation("Collaboration pad {CollaborationPadId} created by user {UserId}", collaborationPad.Id, userId);

        return new OkObjectResult(_mapper.Map<CollaborationPadDto>(collaborationPad));
    }

    public async Task<IActionResult> GetCollaborationPadsAsync(int page = 1, int pageSize = 10, string? search = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _dbContext.CollaborationPads
            .Include(c => c.CreatedByUser)
            .AsQueryable();

        // Filter by search term (name or description)
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(c => 
                c.Name.ToLower().Contains(searchLower) || 
                (c.Description != null && c.Description.ToLower().Contains(searchLower)));
        }

        var totalCount = await query.CountAsync();

        var collaborationPads = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = new CollaborationPadListDto
        {
            CollaborationPads = _mapper.Map<List<CollaborationPadDto>>(collaborationPads),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };

        return new OkObjectResult(result);
    }

    public async Task<IActionResult> GetCollaborationPadByIdAsync(Guid id)
    {
        var collaborationPad = await _dbContext.CollaborationPads
            .Include(c => c.CreatedByUser)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (collaborationPad == null)
        {
            return new NotFoundObjectResult(new { Error = "Collaboration pad not found." });
        }

        return new OkObjectResult(_mapper.Map<CollaborationPadDto>(collaborationPad));
    }

    public async Task<IActionResult> DeleteCollaborationPadAsync(Guid id, string userId)
    {
        var collaborationPad = await _dbContext.CollaborationPads.FindAsync(id);

        if (collaborationPad == null)
        {
            return new NotFoundObjectResult(new { Error = "Collaboration pad not found." });
        }

        _dbContext.CollaborationPads.Remove(collaborationPad);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Collaboration pad {CollaborationPadId} deleted by user {UserId}", id, userId);

        return new OkObjectResult(new { Message = "Collaboration pad deleted successfully." });
    }

    public async Task<IActionResult> UpdateCollaborationPadAsync(Guid id, UpdateCollaborationPadDto request, string userId)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return new BadRequestObjectResult(new { Error = "Name is required." });
        }

        if (string.IsNullOrWhiteSpace(request.Url))
        {
            return new BadRequestObjectResult(new { Error = "URL is required." });
        }

        // Validate URL format
        if (!Uri.TryCreate(request.Url, UriKind.Absolute, out var uriResult) ||
            (uriResult.Scheme != Uri.UriSchemeHttp && uriResult.Scheme != Uri.UriSchemeHttps))
        {
            return new BadRequestObjectResult(new { Error = "Invalid URL format. URL must be a valid HTTP or HTTPS URL." });
        }

        var collaborationPad = await _dbContext.CollaborationPads
            .Include(c => c.CreatedByUser)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (collaborationPad == null)
        {
            return new NotFoundObjectResult(new { Error = "Collaboration pad not found." });
        }

        // Update fields
        collaborationPad.Name = request.Name;
        collaborationPad.Url = request.Url;
        collaborationPad.Description = request.Description;
        collaborationPad.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Collaboration pad {CollaborationPadId} updated by user {UserId}", id, userId);

        return new OkObjectResult(_mapper.Map<CollaborationPadDto>(collaborationPad));
    }
}
