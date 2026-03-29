using System.ComponentModel.DataAnnotations;

namespace FlosskMS.Business.DTOs;

public class CreateResourceDto
{
    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string Title { get; set; } = string.Empty;

    public List<string>? Urls { get; set; }

    [StringLength(1000)]
    public string? Description { get; set; }

    [Required]
    public string Type { get; set; } = "Other";

    /// <summary>
    /// Provide either ProjectId or ObjectiveId, but not both
    /// </summary>
    public Guid? ProjectId { get; set; }

    /// <summary>
    /// Provide either ProjectId or ObjectiveId, but not both
    /// </summary>
    public Guid? ObjectiveId { get; set; }
    
    /// <summary>
    /// Optional list of file IDs to attach to this resource
    /// </summary>
    public List<Guid>? FileIds { get; set; }
}
