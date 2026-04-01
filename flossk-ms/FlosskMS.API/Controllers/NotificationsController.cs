using System.Security.Claims;
using FlosskMS.Business.DTOs;
using FlosskMS.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController(INotificationService notificationService) : ControllerBase
{
    private readonly INotificationService _notificationService = notificationService;

    private string? UserId => User.FindFirstValue(ClaimTypes.NameIdentifier);

    [HttpGet("unread")]
    public async Task<IActionResult> GetUnread()
        => await _notificationService.GetUnreadAsync(UserId);

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        => await _notificationService.GetAllAsync(UserId, page, pageSize);

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
        => await _notificationService.GetUnreadCountAsync(UserId);

    [HttpPatch("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
        => await _notificationService.MarkAsReadAsync(UserId, id);

    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
        => await _notificationService.MarkAllAsReadAsync(UserId);

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
        => await _notificationService.DeleteAsync(UserId, id);

    [HttpPost("push/subscribe")]
    public async Task<IActionResult> SubscribePush([FromBody] CreatePushSubscriptionDto dto)
        => await _notificationService.SubscribePushAsync(UserId, dto);

    [HttpPost("push/unsubscribe")]
    public async Task<IActionResult> UnsubscribePush([FromBody] UnsubscribeDto dto)
        => await _notificationService.UnsubscribePushAsync(UserId, dto.Endpoint);
}

public class UnsubscribeDto
{
    public string Endpoint { get; set; } = string.Empty;
}
