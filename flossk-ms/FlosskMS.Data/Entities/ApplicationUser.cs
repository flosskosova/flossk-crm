using Microsoft.AspNetCore.Identity;

namespace FlosskMS.Data.Entities;

public class ApplicationUser : IdentityUser
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Biography { get; set; }
    public string? Location { get; set; }
    public string? WebsiteUrl { get; set; }
    public List<string>? SocialLinks { get; set; } = [];
    public List<string>? Skills { get; set; } = [];
    public bool RFID { get; set; } = false;
    public bool DarkTheme { get; set; } = false;

    /// <summary>
    /// Stable, random member code printed on access badges, e.g. <c>FOSS-K7M2QX9P</c>.
    /// Assigned automatically on creation (SaveChanges interceptor) and back-filled for
    /// existing members on startup.
    /// </summary>
    public string MemberCode { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? LastActivityAt { get; set; }
    public ICollection<UploadedFile> UploadedFiles { get; set; } = [];
    public ICollection<UserRfidCard> RfidCards { get; set; } = [];
    public ICollection<PushSubscription> PushSubscriptions { get; set; } = [];
}
