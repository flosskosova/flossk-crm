namespace FlosskMS.Business.Services;

public interface IEmailService
{
    Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetLink);
    Task SendMembershipApprovedEmailAsync(string toEmail, string toName, byte[] contractPdf);
}
