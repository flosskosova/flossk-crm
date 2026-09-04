using FlosskMS.Business.DTOs;
using FlosskMS.Data;
using FlosskMS.Data.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FlosskMS.Business.Services;

public class RfidCardService : IRfidCardService
{
    private readonly ApplicationDbContext _context;

    public RfidCardService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> GetAllCardsAsync(int page = 1, int pageSize = 20, bool? activeOnly = null, bool? assignedOnly = null)
    {
        var query = _context.UserRfidCards
            .Include(c => c.User)
            .Include(c => c.RegisteredByUser)
            .Include(c => c.AssignedByUser)
            .Include(c => c.RevokedByUser)
            .Include(c => c.DoorGrants).ThenInclude(g => g.Door)
            .AsQueryable();

        if (activeOnly.HasValue)
        {
            query = query.Where(c => c.IsActive == activeOnly.Value);
        }

        if (assignedOnly.HasValue)
        {
            query = assignedOnly.Value
                ? query.Where(c => c.UserId != null)
                : query.Where(c => c.UserId == null);
        }

        var totalCount = await query.CountAsync();
        var cards = await query
            .OrderByDescending(c => c.RegisteredAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new OkObjectResult(new
        {
            Data = cards.Select(MapToDto),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    public async Task<IActionResult> GetCardByIdAsync(Guid id)
    {
        var card = await GetCardWithIncludesAsync(id);

        if (card == null)
        {
            return new NotFoundObjectResult(new { Message = "RFID card not found." });
        }

        return new OkObjectResult(MapToDto(card));
    }

    public async Task<IActionResult> GetCardsByUserIdAsync(string userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return new NotFoundObjectResult(new { Message = "User not found." });
        }

        var cards = await _context.UserRfidCards
            .Include(c => c.User)
            .Include(c => c.RegisteredByUser)
            .Include(c => c.AssignedByUser)
            .Include(c => c.RevokedByUser)
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.AssignedAt)
            .ToListAsync();

        return new OkObjectResult(cards.Select(MapToDto));
    }

    public async Task<IActionResult> GetCardByIdentifierAsync(string cardIdentifier)
    {
        var card = await _context.UserRfidCards
            .Include(c => c.User)
            .Include(c => c.RegisteredByUser)
            .Include(c => c.AssignedByUser)
            .Include(c => c.RevokedByUser)
            .FirstOrDefaultAsync(c => c.CardIdentifier == cardIdentifier);

        if (card == null)
        {
            return new NotFoundObjectResult(new { Message = "RFID card not found." });
        }

        return new OkObjectResult(MapToDto(card));
    }

    public async Task<IActionResult> GetUnassignedCardsAsync()
    {
        var cards = await _context.UserRfidCards
            .Include(c => c.RegisteredByUser)
            .Where(c => c.UserId == null && c.IsActive)
            .OrderByDescending(c => c.RegisteredAt)
            .ToListAsync();

        return new OkObjectResult(cards.Select(MapToDto));
    }

    public async Task<IActionResult> HasActiveCardAsync(string userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return new NotFoundObjectResult(new { Message = "User not found." });
        }

        var hasActiveCard = await _context.UserRfidCards
            .AnyAsync(c => c.UserId == userId && c.IsActive);

        return new OkObjectResult(new { UserId = userId, UserEmail = user.Email, HasActiveCard = hasActiveCard });
    }

    public async Task<IActionResult> AssignCardAsync(AssignRfidCardDto dto, string assignedByUserId)
    {
        var user = await _context.Users.FindAsync(dto.UserId);
        if (user == null)
        {
            return new NotFoundObjectResult(new { Message = "User not found." });
        }

        // Create a new card and assign it directly to the user
        var card = new UserRfidCard
        {
            Id = Guid.NewGuid(),
            CardIdentifier = dto.CardIdentifier,
            UserId = dto.UserId,
            RegisteredAt = DateTime.UtcNow,
            RegisteredByUserId = assignedByUserId,
            AssignedAt = DateTime.UtcNow,
            AssignedByUserId = assignedByUserId,
            IsActive = true,
            Notes = dto.Notes
        };

        _context.UserRfidCards.Add(card);

        // Update user's RFID flag
        user.RFID = true;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Reload navigation properties
        await _context.Entry(card).Reference(c => c.User).LoadAsync();
        await _context.Entry(card).Reference(c => c.RegisteredByUser).LoadAsync();
        await _context.Entry(card).Reference(c => c.AssignedByUser).LoadAsync();

        return new CreatedAtActionResult(
            "GetCardById",
            "RfidCards",
            new { id = card.Id },
            new { Message = "Card assigned successfully.", Card = MapToDto(card) });
    }

    public async Task<IActionResult> UnassignCardAsync(Guid cardId)
    {
        var card = await GetCardWithIncludesAsync(cardId);

        if (card == null)
        {
            return new NotFoundObjectResult(new { Message = "RFID card not found." });
        }

        if (card.UserId == null)
        {
            return new BadRequestObjectResult(new { Message = "Card is not assigned to any user." });
        }

        var userId = card.UserId;
        card.UserId = null;
        card.AssignedAt = null;
        card.AssignedByUserId = null;

        // Check if user has any other active cards
        var hasOtherActiveCards = await _context.UserRfidCards
            .AnyAsync(c => c.UserId == userId && c.Id != cardId && c.IsActive);

        if (!hasOtherActiveCards)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                user.RFID = false;
                user.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();

        return new OkObjectResult(new { Message = "Card unassigned successfully.", Card = MapToDto(card) });
    }

    public async Task<IActionResult> UpdateCardAsync(Guid id, UpdateUserRfidCardDto dto)
    {
        var card = await GetCardWithIncludesAsync(id);

        if (card == null)
        {
            return new NotFoundObjectResult(new { Message = "RFID card not found." });
        }

        card.Notes = dto.Notes;

        await _context.SaveChangesAsync();

        return new OkObjectResult(MapToDto(card));
    }

    public async Task<IActionResult> RevokeCardAsync(Guid id, string revokedByUserId, RevokeUserRfidCardDto dto)
    {
        var card = await GetCardWithIncludesAsync(id);

        if (card == null)
        {
            return new NotFoundObjectResult(new { Message = "RFID card not found." });
        }

        if (!card.IsActive)
        {
            return new BadRequestObjectResult(new { Message = "Card is already revoked." });
        }

        card.IsActive = false;
        card.Status = AccessCredentialStatus.Revoked;
        card.RevokedAt = DateTime.UtcNow;
        card.RevokedByUserId = revokedByUserId;
        card.RevocationReason = dto.Reason;

        // If card is assigned, update user's RFID flag if needed
        if (card.UserId != null)
        {
            var hasOtherActiveCards = await _context.UserRfidCards
                .AnyAsync(c => c.UserId == card.UserId && c.Id != id && c.IsActive);

            if (!hasOtherActiveCards)
            {
                var user = await _context.Users.FindAsync(card.UserId);
                if (user != null)
                {
                    user.RFID = false;
                    user.UpdatedAt = DateTime.UtcNow;
                }
            }
        }

        await _context.SaveChangesAsync();

        // Reload RevokedByUser
        await _context.Entry(card).Reference(c => c.RevokedByUser).LoadAsync();

        return new OkObjectResult(new { Message = "Card revoked successfully.", Card = MapToDto(card) });
    }

    public async Task<IActionResult> ReactivateCardAsync(Guid id)
    {
        var card = await GetCardWithIncludesAsync(id);

        if (card == null)
        {
            return new NotFoundObjectResult(new { Message = "RFID card not found." });
        }

        if (card.IsActive)
        {
            return new BadRequestObjectResult(new { Message = "Card is already active." });
        }

        card.IsActive = true;
        card.Status = AccessCredentialStatus.Active;
        card.RevokedAt = null;
        card.RevokedByUserId = null;
        card.RevocationReason = null;

        // If card is assigned, update user's RFID flag
        if (card.UserId != null)
        {
            var user = await _context.Users.FindAsync(card.UserId);
            if (user != null)
            {
                user.RFID = true;
                user.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();

        return new OkObjectResult(new { Message = "Card reactivated successfully.", Card = MapToDto(card) });
    }

    public async Task<IActionResult> DeleteCardAsync(Guid id)
    {
        var card = await _context.UserRfidCards.FindAsync(id);

        if (card == null)
        {
            return new NotFoundObjectResult(new { Message = "RFID card not found." });
        }

        var userId = card.UserId;
        _context.UserRfidCards.Remove(card);

        // If card was assigned, check if user has any other active cards
        if (userId != null)
        {
            var hasOtherActiveCards = await _context.UserRfidCards
                .AnyAsync(c => c.UserId == userId && c.Id != id && c.IsActive);

            if (!hasOtherActiveCards)
            {
                var user = await _context.Users.FindAsync(userId);
                if (user != null)
                {
                    user.RFID = false;
                    user.UpdatedAt = DateTime.UtcNow;
                }
            }
        }

        await _context.SaveChangesAsync();

        return new OkObjectResult(new { Message = "Card deleted successfully." });
    }

    private async Task<UserRfidCard?> GetCardWithIncludesAsync(Guid id)
    {
        return await _context.UserRfidCards
            .Include(c => c.User)
            .Include(c => c.RegisteredByUser)
            .Include(c => c.AssignedByUser)
            .Include(c => c.RevokedByUser)
            .Include(c => c.DoorGrants).ThenInclude(g => g.Door)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    private static UserRfidCardDto MapToDto(UserRfidCard card)
    {
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
            UserFullName = card.User != null ? $"{card.User.FirstName} {card.User.LastName}".Trim() : null,
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
            Doors = card.DoorGrants?.Select(g => new AccessDoorRefDto { Id = g.DoorId, Name = g.Door?.Name ?? "" }).ToList() ?? []
        };
    }
}
