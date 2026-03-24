namespace FlosskMS.Data.Entities;

public class Project
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public ProjectStatus Status { get; set; } = ProjectStatus.Upcoming;
    public ProjectType Types { get; set; } = ProjectType.None;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public string? BannerUrl { get; set; }

    // Creator tracking
    public string CreatedByUserId { get; set; } = string.Empty;
    public ApplicationUser CreatedByUser { get; set; } = null!;

    // Moderator (optional — assigned by admin, has full project permissions)
    public string? ModeratorUserId { get; set; }
    public ApplicationUser? ModeratorUser { get; set; }

    // Navigation properties
    public ICollection<ProjectTeamMember> TeamMembers { get; set; } = [];
    public ICollection<Objective> Objectives { get; set; } = [];
    public ICollection<Resource> Resources { get; set; } = [];

    // Calculated progress percentage based on completed objectives
    public double ProgressPercentage
    {
        get
        {
            if (Objectives == null || Objectives.Count == 0)
                return 0;

            var completedCount = Objectives.Count(o => o.Status == ObjectiveStatus.Completed);
            return (double)completedCount / Objectives.Count * 100;
        }
    }
}
