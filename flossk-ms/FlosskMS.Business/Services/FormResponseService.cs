using System.Text.Json;
using FlosskMS.Business.DTOs;
using FlosskMS.Data;
using FlosskMS.Data.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace FlosskMS.Business.Services;

public class FormResponseService(ApplicationDbContext dbContext, ILogger<FormResponseService> logger) : IFormResponseService
{
    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = false };

    private static string? NormalizeNullable(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private async Task<bool> CanReadCourseResponsesAsync(Guid courseId, string userId, bool isAdmin, CancellationToken cancellationToken)
    {
        if (isAdmin)
            return true;

        return await dbContext.CourseInstructors
            .AsNoTracking()
            .AnyAsync(i => i.CourseId == courseId && i.UserId == userId, cancellationToken);
    }

    public async Task<IActionResult> ReceiveWebhookAsync(
        GoogleFormWebhookDto payload,
        CancellationToken cancellationToken = default)
    {
        var normalizedFormId = NormalizeNullable(payload.FormId);
        if (normalizedFormId is null)
            return new BadRequestObjectResult(new { Error = "FormId is required." });

        var linkedCourse = await dbContext.Courses
            .AsNoTracking()
            .Where(c => c.GoogleFormId == normalizedFormId)
            .Select(c => new { c.Id, c.GoogleFormTitle })
            .FirstOrDefaultAsync(cancellationToken);

        if (linkedCourse is null)
            return new NotFoundObjectResult(new { Error = "No course is linked to this Google Form ID." });

        var normalizedFormTitle = NormalizeNullable(payload.FormTitle)
            ?? NormalizeNullable(linkedCourse.GoogleFormTitle)
            ?? "Google Form";

        var formResponse = new FormResponse
        {
            Id = Guid.NewGuid(),
            CourseId = linkedCourse.Id,
            GoogleFormId = normalizedFormId,
            FormTitle = normalizedFormTitle,
            SubmittedAt = payload.SubmittedAt == default ? DateTime.UtcNow : payload.SubmittedAt,
            ReceivedAt = DateTime.UtcNow,
            ResponsesJson = JsonSerializer.Serialize(payload.Responses, JsonOptions)
        };

        dbContext.FormResponses.Add(formResponse);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Received form response {ResponseId} for course {CourseId} and form '{FormTitle}'",
            formResponse.Id,
            formResponse.CourseId,
            formResponse.FormTitle);

        return new OkObjectResult(new { formResponse.Id, formResponse.CourseId });
    }

    public async Task<IActionResult> GetResponsesAsync(
        string? formTitle,
        string? formId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var query = dbContext.FormResponses.AsQueryable();

        if (!string.IsNullOrWhiteSpace(formTitle))
            query = query.Where(r => r.FormTitle.ToLower().Contains(formTitle.ToLower()));

        if (!string.IsNullOrWhiteSpace(formId))
            query = query.Where(r => r.GoogleFormId == formId.Trim());

        var totalCount = await query.CountAsync(cancellationToken);

        var rows = await query
            .OrderByDescending(r => r.SubmittedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new OkObjectResult(new FormResponseListDto
        {
            Responses = rows.Select(ToDto).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    public async Task<IActionResult> GetResponsesByCourseAsync(
        Guid courseId,
        int page,
        int pageSize,
        ClaimsPrincipal currentUser,
        CancellationToken cancellationToken = default)
    {
        var userId = currentUser.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return new UnauthorizedResult();

        return await GetResponsesByCourseAsync(courseId, page, pageSize, userId, currentUser.IsInRole("Admin"), cancellationToken);
    }

    public async Task<IActionResult> GetResponsesByCourseAsync(
        Guid courseId,
        int page,
        int pageSize,
        string userId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        var courseExists = await dbContext.Courses
            .AsNoTracking()
            .AnyAsync(c => c.Id == courseId, cancellationToken);

        if (!courseExists)
            return new NotFoundObjectResult(new { Error = "Course not found." });

        if (!await CanReadCourseResponsesAsync(courseId, userId, isAdmin, cancellationToken))
            return new ForbidResult();

        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var query = dbContext.FormResponses
            .AsNoTracking()
            .Where(r => r.CourseId == courseId);

        var totalCount = await query.CountAsync(cancellationToken);

        var rows = await query
            .OrderByDescending(r => r.SubmittedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new OkObjectResult(new FormResponseListDto
        {
            Responses = rows.Select(ToDto).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    public async Task<IActionResult> GetResponseByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var row = await dbContext.FormResponses.FindAsync([id], cancellationToken);
        if (row is null)
            return new NotFoundObjectResult(new { Error = "Form response not found." });

        return new OkObjectResult(ToDto(row));
    }

    public async Task<IActionResult> DeleteResponseAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var row = await dbContext.FormResponses.FindAsync([id], cancellationToken);
        if (row is null)
            return new NotFoundObjectResult(new { Error = "Form response not found." });

        dbContext.FormResponses.Remove(row);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Deleted form response {ResponseId}", id);
        return new OkObjectResult(new { Message = "Form response deleted." });
    }

    private static FormResponseDto ToDto(FormResponse row) => new()
    {
        Id = row.Id,
        CourseId = row.CourseId,
        GoogleFormId = row.GoogleFormId,
        FormTitle = row.FormTitle,
        SubmittedAt = row.SubmittedAt,
        ReceivedAt = row.ReceivedAt,
        Responses = JsonSerializer.Deserialize<Dictionary<string, List<string>>>(row.ResponsesJson, JsonOptions) ?? []
    };
}
