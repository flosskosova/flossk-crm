namespace FlosskMS.Business.DTOs;

public class ProjectListDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<string> Types { get; set; } = [];
    public double ProgressPercentage { get; set; }
    public int TeamMemberCount { get; set; }
    public int ObjectiveCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? BannerUrl { get; set; }
    
    // Creator info
    public string CreatedByUserId { get; set; } = string.Empty;
    public string CreatedByFirstName { get; set; } = string.Empty;
    public string CreatedByLastName { get; set; } = string.Empty;

    // Moderator info
    public List<ModeratorInfoDto> Moderators { get; set; } = [];

    // Collections
    public List<TeamMemberDto> TeamMembers { get; set; } = [];
    public List<ObjectiveDto> Objectives { get; set; } = [];
    public List<ResourceDto> Resources { get; set; } = [];
}
