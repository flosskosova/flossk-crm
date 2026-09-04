namespace FlosskMS.Business.DTOs;

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string MemberCode { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Biography { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Location { get; set; }
    public bool RFID { get; set; } 
    public bool DarkTheme { get; set; }
    public string? WebsiteUrl { get; set; }
    public List<string>? SocialLinks { get; set; } = [];
    public List<string>? Skills { get; set; } = [];
    public DateTime CreatedAt { get; set; }
    public List<string> Roles { get; set; } = [];
    public string? ProfilePictureUrl { get; set; }
    public string? CVUrl { get; set; }
    public string? BannerUrl { get; set; }
}
