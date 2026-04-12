using System.ComponentModel.DataAnnotations;

namespace FlosskMS.Business.DTOs;

public class CreateCourseSessionDto
{
    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public DateOnly Date { get; set; }

    [Required]
    public TimeOnly Hour { get; set; }

    /// <summary>InPerson or Online</summary>
    [Required]
    public string Type { get; set; } = "InPerson";

    /// <summary>Physical address (InPerson) or meeting link (Online).</summary>
    [Required]
    [StringLength(500)]
    public string Location { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Notes { get; set; }
}

public class UpdateCourseSessionDto
{
    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public DateOnly Date { get; set; }

    [Required]
    public TimeOnly Hour { get; set; }

    [Required]
    public string Type { get; set; } = "InPerson";

    [Required]
    [StringLength(500)]
    public string Location { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Notes { get; set; }
}
