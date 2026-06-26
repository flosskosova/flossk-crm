namespace FlosskMS.Business.DTOs;

public class ChangeEmailDto
{
    public string NewEmail { get; set; } = string.Empty;
    public string CurrentPassword { get; set; } = string.Empty;
}
