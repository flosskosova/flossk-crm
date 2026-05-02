namespace FlosskMS.Business.Services;

internal static class EmailTemplates
{
    public static string PasswordReset(string appName, string toName, string resetLink) => $"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 40px 0;">
            <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.08);">
                <div style="background: #ECB91C; padding: 32px 40px; text-align: center;">
                    <h1 style="color: #fff; margin: 0; font-size: 24px;">{appName}</h1>
                </div>
                <div style="padding: 40px;">
                    <h2 style="margin-top: 0; color: #1e293b;">Reset your password</h2>
                    <p style="color: #475569;">Hi {toName},</p>
                    <p style="color: #475569;">We received a request to reset the password for your account. Click the button below to choose a new password.</p>
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="{resetLink}"
                           style="background: #ECB91C; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    <p style="color: #ECB91C; font-size: 13px;">This link expires in 30 minutes. If you didn't request a password reset, you can safely ignore this email.</p>
                </div>
            </div>
        </body>
        </html>
        """;

    public static string MembershipRejected(string appName, string toName, string? rejectionReason) => $"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 40px 0;">
            <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.08);">
                <div style="background: #ECB91C; padding: 32px 40px; text-align: center;">
                    <h1 style="color: #fff; margin: 0; font-size: 24px;">{appName}</h1>
                </div>
                <div style="padding: 40px;">
                    <h2 style="margin-top: 0; color: #1e293b;">Membership Application Update</h2>
                    <p style="color: #475569;">Hi {toName},</p>
                    <p style="color: #475569;">Thank you for your interest in joining <strong>FLOSSK – Free Libre Open Source Software Kosova</strong>.</p>
                    <p style="color: #475569;">After careful review, we regret to inform you that your membership application has not been approved at this time.</p>
                    {(string.IsNullOrWhiteSpace(rejectionReason) ? string.Empty : $"<div style=\"background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px 20px; border-radius: 4px; margin: 20px 0;\"><p style=\"margin: 0; color: #7f1d1d; font-weight: 600; margin-bottom: 6px;\">Reason:</p><p style=\"margin: 0; color: #991b1b;\">{rejectionReason}</p></div>")}
                    <p style="color: #475569;">If you have any questions or believe this decision was made in error, please contact us directly.</p>
                    <p style="color: #64748b; font-size: 13px; margin-top: 32px;">Thank you for your understanding.</p>
                </div>
            </div>
        </body>
        </html>
        """;

    public static string MembershipApproved(string appName, string toName, string loginUrl) => $"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 40px 0;">
            <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.08);">
                <div style="background: #ECB91C; padding: 32px 40px; text-align: center;">
                    <h1 style="color: #fff; margin: 0; font-size: 24px;">{appName}</h1>
                </div>
                <div style="padding: 40px;">
                    <h2 style="margin-top: 0; color: #1e293b;">Your membership has been approved! 🎉</h2>
                    <p style="color: #475569;">Hi {toName},</p>
                    <p style="color: #475569;">We are thrilled to let you know that your membership application to <strong>FLOSSK – Free Libre Open Source Software Kosova</strong> has been approved.</p>
                    <p style="color: #475569;">Your signed membership contract is attached to this email. Please keep it for your records.</p>
                    <p style="color: #475569;">You can now create your account using the email address you submitted in your application.</p>
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="{loginUrl}"
                           style="background: #ECB91C; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                            Create your account
                        </a>
                    </div>
                    <p style="color: #64748b; font-size: 13px; margin-top: 32px;">Welcome to the community!</p>
                </div>
            </div>
        </body>
        </html>
        """;
}
