using System.Text.Json;
using FlosskMS.Business.DTOs;
using FlosskMS.Data;
using FlosskMS.Data.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FlosskMS.Business.Services;

public class FormResponseService(ApplicationDbContext dbContext, ILogger<FormResponseService> logger) : IFormResponseService
{
    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = false };

    public async Task<IActionResult> ReceiveWebhookAsync(
        GoogleFormWebhookDto payload,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(payload.FormTitle))
            return new BadRequestObjectResult(new { Error = "FormTitle is required." });

        var formResponse = new FormResponse
        {
            Id = Guid.NewGuid(),
            FormTitle = payload.FormTitle.Trim(),
            SubmittedAt = payload.SubmittedAt == default ? DateTime.UtcNow : payload.SubmittedAt,
            ReceivedAt = DateTime.UtcNow,
            ResponsesJson = JsonSerializer.Serialize(payload.Responses, JsonOptions)
        };

        dbContext.FormResponses.Add(formResponse);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Received form response {ResponseId} for form '{FormTitle}'", formResponse.Id, formResponse.FormTitle);

        return new OkObjectResult(new { formResponse.Id });
    }

    public async Task<IActionResult> GetResponsesAsync(
        string? formTitle,
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
        FormTitle = row.FormTitle,
        SubmittedAt = row.SubmittedAt,
        ReceivedAt = row.ReceivedAt,
        Responses = JsonSerializer.Deserialize<Dictionary<string, List<string>>>(row.ResponsesJson, JsonOptions) ?? []
    };
}
