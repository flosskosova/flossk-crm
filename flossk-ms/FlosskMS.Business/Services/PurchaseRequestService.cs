using FlosskMS.Business.DomainEvents;
using FlosskMS.Business.DomainEvents.Purchasing;
using FlosskMS.Business.DTOs;
using FlosskMS.Data;
using FlosskMS.Data.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FlosskMS.Business.Services;

public class PurchaseRequestService(
    ApplicationDbContext dbContext,
    IDomainEventDispatcher domainEventDispatcher,
    ILogger<PurchaseRequestService> logger) : IPurchaseRequestService
{
    private readonly ApplicationDbContext _dbContext = dbContext;
    private readonly IDomainEventDispatcher _domainEventDispatcher = domainEventDispatcher;
    private readonly ILogger<PurchaseRequestService> _logger = logger;

    private static PurchaseRequestDto ToDto(PurchaseRequest r) => new()
    {
        Id = r.Id,
        ItemName = r.ItemName,
        Reason = r.Reason,
        Link = r.Link,
        Price = r.Price,
        Quantity = r.Quantity,
        Total = r.Price * r.Quantity,
        NeededByDate = r.NeededByDate,
        Status = r.Status.ToString(),
        CreatedAt = r.CreatedAt,
        CreatedByFirstName = r.CreatedByUser?.FirstName,
        CreatedByLastName = r.CreatedByUser?.LastName,
        ReviewedAt = r.ReviewedAt,
        ReviewedByFirstName = r.ReviewedByUser?.FirstName,
        ReviewedByLastName = r.ReviewedByUser?.LastName,
        RejectionReason = r.RejectionReason
    };

    public async Task<IActionResult> CreateAsync(CreatePurchaseRequestDto request, string userId, string userName)
    {
        if (string.IsNullOrWhiteSpace(request.ItemName))
            return new BadRequestObjectResult(new { message = "Item name is required." });
        if (string.IsNullOrWhiteSpace(request.Reason))
            return new BadRequestObjectResult(new { message = "Reason is required." });
        if (request.Quantity < 1)
            return new BadRequestObjectResult(new { message = "Quantity must be at least 1." });

        var entity = new PurchaseRequest
        {
            Id = Guid.NewGuid(),
            ItemName = request.ItemName,
            Reason = request.Reason,
            Link = request.Link,
            Price = request.Price,
            Quantity = request.Quantity,
            NeededByDate = request.NeededByDate,
            Status = PurchaseRequestStatus.Pending,
            CreatedByUserId = userId
        };

        _dbContext.PurchaseRequests.Add(entity);
        await _dbContext.SaveChangesAsync();
        _logger.LogInformation("Purchase request {Id} created by {UserId}", entity.Id, userId);

        await _domainEventDispatcher.PublishAsync(
            new PurchaseRequestSubmittedEvent(entity.ItemName, userName, userId));

        return new OkObjectResult(ToDto(entity));
    }

    public async Task<IActionResult> GetMineAsync(string userId, int page = 1, int pageSize = 20)
    {
        var query = _dbContext.PurchaseRequests
            .Include(r => r.CreatedByUser)
            .Include(r => r.ReviewedByUser)
            .Where(r => r.CreatedByUserId == userId);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new OkObjectResult(new PurchaseRequestListDto
        {
            Requests = items.Select(ToDto).ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        });
    }

    public async Task<IActionResult> GetAllAsync(string? status = null, int page = 1, int pageSize = 20)
    {
        var query = _dbContext.PurchaseRequests
            .Include(r => r.CreatedByUser)
            .Include(r => r.ReviewedByUser)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) &&
            Enum.TryParse<PurchaseRequestStatus>(status, true, out var parsed))
        {
            query = query.Where(r => r.Status == parsed);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new OkObjectResult(new PurchaseRequestListDto
        {
            Requests = items.Select(ToDto).ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        });
    }

    public async Task<IActionResult> GetByIdAsync(Guid id)
    {
        var entity = await _dbContext.PurchaseRequests
            .Include(r => r.CreatedByUser)
            .Include(r => r.ReviewedByUser)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (entity == null)
            return new NotFoundObjectResult(new { message = "Purchase request not found." });

        return new OkObjectResult(ToDto(entity));
    }

    public async Task<IActionResult> ApproveAsync(Guid id, string reviewerUserId, string reviewerName)
    {
        var entity = await _dbContext.PurchaseRequests
            .Include(r => r.CreatedByUser)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (entity == null)
            return new NotFoundObjectResult(new { message = "Purchase request not found." });
        if (entity.Status != PurchaseRequestStatus.Pending)
            return new BadRequestObjectResult(new { message = $"Cannot approve a request that is already {entity.Status}." });

        entity.Status = PurchaseRequestStatus.Approved;
        entity.ReviewedAt = DateTime.UtcNow;
        entity.ReviewedByUserId = reviewerUserId;

        await _dbContext.SaveChangesAsync();
        _logger.LogInformation("Purchase request {Id} approved by {UserId}", id, reviewerUserId);

        await _domainEventDispatcher.PublishAsync(
            new PurchaseRequestApprovedEvent(entity.ItemName, entity.CreatedByUserId, reviewerName));

        return new OkObjectResult(new { message = "Purchase request approved." });
    }

    public async Task<IActionResult> RejectAsync(Guid id, RejectPurchaseRequestDto request, string reviewerUserId, string reviewerName)
    {
        var entity = await _dbContext.PurchaseRequests
            .Include(r => r.CreatedByUser)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (entity == null)
            return new NotFoundObjectResult(new { message = "Purchase request not found." });
        if (entity.Status != PurchaseRequestStatus.Pending)
            return new BadRequestObjectResult(new { message = $"Cannot reject a request that is already {entity.Status}." });

        entity.Status = PurchaseRequestStatus.Rejected;
        entity.ReviewedAt = DateTime.UtcNow;
        entity.ReviewedByUserId = reviewerUserId;
        entity.RejectionReason = request.RejectionReason;

        await _dbContext.SaveChangesAsync();
        _logger.LogInformation("Purchase request {Id} rejected by {UserId}", id, reviewerUserId);

        await _domainEventDispatcher.PublishAsync(
            new PurchaseRequestRejectedEvent(entity.ItemName, entity.CreatedByUserId, reviewerName, entity.RejectionReason));

        return new OkObjectResult(new { message = "Purchase request rejected." });
    }
}
