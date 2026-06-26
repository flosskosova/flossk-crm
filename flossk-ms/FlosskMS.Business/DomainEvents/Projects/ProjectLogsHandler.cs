using FlosskMS.Business.DTOs;
using FlosskMS.Business.Services;
using Microsoft.AspNetCore.Http;

namespace FlosskMS.Business.DomainEvents.Projects;

public class ProjectLogHandler(ILogService logService, IHttpContextAccessor httpContextAccessor) : IDomainEventHandler<ProjectLogEvent>
{
    private readonly ILogService _logService = logService;

    public async Task HandleAsync(ProjectLogEvent domainEvent, CancellationToken ct = default)
    {
        var ipAddress = httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();
        var userAgent = httpContextAccessor.HttpContext?.Request.Headers["User-Agent"].FirstOrDefault();

        await _logService.CreateAsync(new CreateLogDto
        {
            EntityType = domainEvent.EntityType,
            EntityId = domainEvent.EntityId,
            EntityName = domainEvent.EntityName ?? string.Empty,
            Action = domainEvent.Action,
            Detail = domainEvent.Detail,
            UserId = domainEvent.UserId,
            IpAddress = ipAddress,
            UserAgent = userAgent
        });
    }
}
