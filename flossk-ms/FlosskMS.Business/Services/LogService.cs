using AutoMapper;
using FlosskMS.Business.DTOs;
using FlosskMS.Data;
using FlosskMS.Data.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace FlosskMS.Business.Services;

public class LogService(ApplicationDbContext context, IMapper mapper) : ILogService
{
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;

    public async Task CreateAsync(CreateLogDto dto)
    {
        var log = new Log
        {
            Id = Guid.NewGuid(),
            EntityType = dto.EntityType,
            EntityId = dto.EntityId,
            EntityName = dto.EntityName,
            Action = dto.Action,
            Detail = dto.Detail,
            UserId = dto.UserId,
            Timestamp = DateTime.UtcNow
        };

        _context.Logs.Add(log);
        await _context.SaveChangesAsync();
    }

    public async Task<IActionResult> GetAllAsync(string? entityType = null, string? entityId = null, string? userId = null, int page = 1, int pageSize = 50, string? dateFrom = null, string? dateTo = null)
    {
        var query = _context.Logs
            .Include(l => l.User)
                .ThenInclude(u => u.UploadedFiles)
            .AsQueryable();

        if (!string.IsNullOrEmpty(entityType))
            query = query.Where(l => l.EntityType == entityType);

        if (!string.IsNullOrEmpty(entityId))
            query = query.Where(l => l.EntityId == entityId);

        if (!string.IsNullOrEmpty(userId))
            query = query.Where(l => l.UserId == userId);

        if (!string.IsNullOrEmpty(dateFrom) &&
            DateTime.TryParseExact(dateFrom, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var rawFrom))
        {
            var from = new DateTime(rawFrom.Year, rawFrom.Month, rawFrom.Day, 0, 0, 0, DateTimeKind.Utc);
            query = query.Where(l => l.Timestamp >= from);
        }

        if (!string.IsNullOrEmpty(dateTo) &&
            DateTime.TryParseExact(dateTo, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var rawTo))
        {
            var toExclusive = new DateTime(rawTo.Year, rawTo.Month, rawTo.Day, 0, 0, 0, DateTimeKind.Utc).AddDays(1);
            query = query.Where(l => l.Timestamp < toExclusive);
        }

        var totalCount = await query.CountAsync();
        var logs = await query
            .OrderByDescending(l => l.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new OkObjectResult(new
        {
            Data = _mapper.Map<List<LogDto>>(logs),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    public async Task<IActionResult> GetByIdAsync(Guid id)
    {
        var log = await _context.Logs
            .Include(l => l.User)
                .ThenInclude(u => u.UploadedFiles)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (log == null)
            return new NotFoundObjectResult(new { Message = "Log entry not found." });

        return new OkObjectResult(_mapper.Map<LogDto>(log));
    }

    public async Task<IActionResult> GetByEntityAsync(string entityType, string entityId)
    {
        var logs = await _context.Logs
            .Include(l => l.User)
                .ThenInclude(u => u.UploadedFiles)
            .Where(l => l.EntityType == entityType && l.EntityId == entityId)
            .OrderByDescending(l => l.Timestamp)
            .ToListAsync();

        return new OkObjectResult(_mapper.Map<List<LogDto>>(logs));
    }

    public async Task<IActionResult> DeleteAsync(Guid id)
    {
        var log = await _context.Logs.FindAsync(id);
        if (log == null)
            return new NotFoundObjectResult(new { Message = "Log entry not found." });

        _context.Logs.Remove(log);
        await _context.SaveChangesAsync();

        return new OkObjectResult(new { Message = "Log entry deleted." });
    }
}
