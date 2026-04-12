using System.ComponentModel.DataAnnotations;

namespace FlosskMS.Business.DTOs;

public class CreateCourseResourceDto
{
    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string Title { get; set; } = string.Empty;

    [Url]
    public string Url { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    /// <summary>Link, Video, Document, Other</summary>
    public string Type { get; set; } = "Link";
}

public class UpdateCourseResourceDto
{
    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string Title { get; set; } = string.Empty;

    [Url]
    public string Url { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    public string Type { get; set; } = "Link";
}
