using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace FlosskMS.Business.Services;

public class EmailService : IEmailService
{
    private readonly string _host = Environment.GetEnvironmentVariable("SmtpSettings__Host") ?? "smtp.gmail.com";
    private readonly int _port = int.TryParse(Environment.GetEnvironmentVariable("SmtpSettings__Port"), out var p) ? p : 587;
    private readonly string _username = Environment.GetEnvironmentVariable("SmtpSettings__Username") ?? string.Empty;
    private readonly string _password = Environment.GetEnvironmentVariable("SmtpSettings__Password") ?? string.Empty;
    private readonly string _fromEmail = Environment.GetEnvironmentVariable("SmtpSettings__FromEmail") ?? string.Empty;
    private readonly string _fromName = Environment.GetEnvironmentVariable("SmtpSettings__FromName") ?? "FlosskMS";

    public async Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetLink)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_fromName, _fromEmail));
        message.To.Add(new MailboxAddress(toName, toEmail));
        message.Subject = "Reset your password";

        message.Body = new BodyBuilder
        {
            HtmlBody = EmailTemplates.PasswordReset(_fromName, toName, resetLink)
        }.ToMessageBody();

        using var client = new SmtpClient();
        await client.ConnectAsync(_host, _port, SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(_username, _password);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }

    public async Task SendMembershipApprovedEmailAsync(string toEmail, string toName, byte[] contractPdf)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_fromName, _fromEmail));
        message.To.Add(new MailboxAddress(toName, toEmail));
        message.Subject = "Your FLOSSK membership has been approved!";

        var builder = new BodyBuilder
        {
            HtmlBody = EmailTemplates.MembershipApproved(_fromName, toName)
        };

        var fileName = $"FLOSSK_Membership_Contract_{toName.Replace(" ", "_")}.pdf";
        builder.Attachments.Add(fileName, contractPdf, new ContentType("application", "pdf"));

        message.Body = builder.ToMessageBody();

        using var client = new SmtpClient();
        await client.ConnectAsync(_host, _port, SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(_username, _password);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}
