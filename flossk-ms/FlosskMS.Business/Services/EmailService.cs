using FlosskMS.Business.Configuration;
using Microsoft.Extensions.Options;
using Resend;

namespace FlosskMS.Business.Services;

public class ResendEmailService(IResend resend, IOptions<ResendSettings> settings) : IEmailService
{
    private readonly IResend _resend = resend;
    private readonly ResendSettings _settings = settings.Value;

    public async Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetLink)
    {
        var message = new EmailMessage
        {
            From = $"{_settings.FromName} <{_settings.FromEmail}>",
            Subject = "Reset your password",
            HtmlBody = EmailTemplates.PasswordReset(_settings.FromName, toName, resetLink)
        };
        message.To.Add(toEmail);

        try
        {
            await _resend.EmailSendAsync(message);
        }
        catch (Exception ex) when (ex.Message.Contains("429") || ex.Message.Contains("rate") || ex.Message.Contains("limit", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Email service rate limit reached. Please try again later.", ex);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException("Failed to send email. Please try again later.", ex);
        }
    }
}
