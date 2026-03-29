namespace FlosskMS.Data.Entities;

public class Resource
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// Optional external URLs for the resource
    /// </summary>
    public List<string> Urls { get; set; } = [];
    
    public string? Description { get; set; }
    public ResourceType Type { get; set; } = ResourceType.Other;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Creator tracking
    public string? CreatedByUserId { get; set; }
    public ApplicationUser? CreatedByUser { get; set; }

    // Optional relationship to Project (a resource can belong to a project)
    public Guid? ProjectId { get; set; }
    public Project? Project { get; set; }

    // Optional relationship to Objective (a resource can belong to an objective)
    public Guid? ObjectiveId { get; set; }
    public Objective? Objective { get; set; }
    
    /// <summary>
    /// Files attached to this resource (can have multiple)
    /// </summary>
    public ICollection<ResourceFile> Files { get; set; } = new List<ResourceFile>();
}
