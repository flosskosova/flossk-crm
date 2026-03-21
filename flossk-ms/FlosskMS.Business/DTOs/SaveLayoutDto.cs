using System.ComponentModel.DataAnnotations;

namespace FlosskMS.Business.DTOs;

public class SaveLayoutDto
{
    /// <summary>Width of the displayed canvas element in the browser (pixels).</summary>
    [Required]
    public float CanvasWidth { get; set; }

    /// <summary>Height of the displayed canvas element in the browser (pixels).</summary>
    [Required]
    public float CanvasHeight { get; set; }

    public List<TemplateFieldDto> Fields { get; set; } = [];
}
