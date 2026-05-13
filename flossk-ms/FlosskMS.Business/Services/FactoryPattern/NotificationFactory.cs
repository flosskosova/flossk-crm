using FlosskMS.Business.DTOs;
using FlosskMS.Data.Entities;

namespace FlosskMS.Business.Services.FactoryPattern;

public sealed record NotificationDispatchRequest(
    string UserId,
    string Title,
    string Body,
    string? Metadata = null,
    NotificationPriority Priority = NotificationPriority.Normal,
    string? RecipientEmail = null,
    string? RecipientName = null,
    string? ActionLink = null,
    NotificationType NotificationType = NotificationType.General
);

public abstract class SendNotification
{
    public abstract Task SendAsync(NotificationDispatchRequest request, CancellationToken cancellationToken = default);
}

public sealed class EmailNotification(IEmailService emailService) : SendNotification
{
    private readonly IEmailService _emailService = emailService;

    public override async Task SendAsync(NotificationDispatchRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.RecipientEmail))
            throw new ArgumentException("RecipientEmail is required for email notifications.", nameof(request));

        if (string.IsNullOrWhiteSpace(request.ActionLink))
            throw new ArgumentException("ActionLink is required for email notifications.", nameof(request));

        var recipientName = string.IsNullOrWhiteSpace(request.RecipientName)
            ? request.RecipientEmail
            : request.RecipientName;

        await _emailService.SendPasswordResetEmailAsync(request.RecipientEmail, recipientName!, request.ActionLink);
    }
}

// public sealed class SMSNotification(INotificationService notificationService) : Notification
// {
//     private readonly INotificationService _notificationService = notificationService;

//     public override async Task SendAsync(NotificationDispatchRequest request, CancellationToken cancellationToken = default)
//     {
//         if (string.IsNullOrWhiteSpace(request.UserId))
//             throw new ArgumentException("UserId is required for SMS notifications.", nameof(request));

//         await _notificationService.SendAsync(
//             request.UserId,
//             request.NotificationType,
//             request.Title,
//             request.Body,
//             request.Metadata,
//             request.Priority);
//     }
// }

public sealed class PushNotification(IPushNotificationService pushNotificationService) : SendNotification
{
    private readonly IPushNotificationService _pushNotificationService = pushNotificationService;

    public override async Task SendAsync(NotificationDispatchRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.UserId))
            throw new ArgumentException("UserId is required for push notifications.", nameof(request));

        var dto = new NotificationDto
        {
            Id = Guid.NewGuid(),
            Type = request.NotificationType.ToString(),
            Priority = request.Priority.ToString(),
            Title = request.Title,
            Body = request.Body,
            Metadata = request.Metadata,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        await _pushNotificationService.SendToUserAsync(request.UserId, dto);
    }
}

public sealed class RealtimeNotification(IRealtimeNotificationService realtimeNotificationService) : SendNotification
{
    private readonly IRealtimeNotificationService _realtimeNotificationService = realtimeNotificationService;

    public override async Task SendAsync(NotificationDispatchRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.UserId))
            throw new ArgumentException("UserId is required for realtime notifications.", nameof(request));

        var dto = new NotificationDto
        {
            Id = Guid.NewGuid(),
            Type = request.NotificationType.ToString(),
            Priority = request.Priority.ToString(),
            Title = request.Title,
            Body = request.Body,
            Metadata = request.Metadata,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        await _realtimeNotificationService.SendToUserAsync(request.UserId, dto);
    }
}

public class NotificationFactory(
    IEmailService emailService,
    IRealtimeNotificationService realtimeNotificationService,
    IPushNotificationService pushNotificationService)
{
    private readonly IEmailService _emailService = emailService;
    private readonly IRealtimeNotificationService _realtimeNotificationService = realtimeNotificationService;
    private readonly IPushNotificationService _pushNotificationService = pushNotificationService;

    // Kept with requested name/signature style.
    public SendNotification createNotification(string type)
    {
        if (string.IsNullOrWhiteSpace(type))
            throw new ArgumentException("Notification type is required.", nameof(type));

        return type.Trim().ToLowerInvariant() switch
        {
            "email" => new EmailNotification(_emailService),
            // "sms" => new SMSNotification(_notificationService),
            "push" => new PushNotification(_pushNotificationService),
            "realtime" => new RealtimeNotification(_realtimeNotificationService),
            _ => throw new ArgumentException($"Unsupported notification type: {type}", nameof(type))
        };
    }
}
