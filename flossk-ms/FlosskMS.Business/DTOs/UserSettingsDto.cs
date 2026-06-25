namespace FlosskMS.Business.DTOs;

public class UserSettingsDto
{
    public UserDto User { get; set; } = null!;
    public MembershipRequestDto? MembershipRequest { get; set; }
}
