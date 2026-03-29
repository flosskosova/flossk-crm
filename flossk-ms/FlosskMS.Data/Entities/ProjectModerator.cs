namespace FlosskMS.Data.Entities;

/// <summary>
/// Join table for Project-ApplicationUser many-to-many moderator relationship
/// </summary>
public class ProjectModerator
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
}
