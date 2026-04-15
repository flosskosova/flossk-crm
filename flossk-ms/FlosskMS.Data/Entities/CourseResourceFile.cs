namespace FlosskMS.Data.Entities;

public class CourseResourceFile
{
    public Guid Id { get; set; }
    public Guid CourseResourceId { get; set; }
    public CourseResource CourseResource { get; set; } = null!;
    public Guid FileId { get; set; }
    public UploadedFile File { get; set; } = null!;
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}
