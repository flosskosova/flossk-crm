namespace FlosskMS.Data.Entities;

public class Course
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public CourseLevel Level { get; set; } = CourseLevel.Beginner;
    public CourseStatus Status { get; set; } = CourseStatus.Draft;

    // Communication channels (e.g. Discord invite, Mattermost server URL)
    public List<string> CommunicationChannels { get; set; } = [];

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // 1:1 with Project — required, cascade delete
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    // Creator tracking
    public string CreatedByUserId { get; set; } = string.Empty;
    public ApplicationUser CreatedByUser { get; set; } = null!;

    // Navigation properties
    public ICollection<CourseInstructor> Instructors { get; set; } = [];
    public ICollection<CourseModule> Modules { get; set; } = [];
    public ICollection<CourseSession> Sessions { get; set; } = [];
    public ICollection<CourseVoucher> Vouchers { get; set; } = [];
}
