using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace FlosskMS.Business.DTOs;

public class UpdateInventoryItemDto
{
    [StringLength(200, MinimumLength = 1)]
    public string? Name { get; set; }

    [StringLength(200)]
    public string? Manufacturer { get; set; }

    [StringLength(2000)]
    public string? Description { get; set; }

    public string? Category { get; set; }

    [StringLength(200)]
    public string? SubCategory { get; set; }

    [StringLength(100)]
    public string? Unit { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1")]
    public int? Quantity { get; set; }

    [StringLength(500)]
    public string? Location { get; set; }

    [StringLength(1000)]
    public string? ElectricSpecs { get; set; }

    public List<IFormFile>? Images { get; set; }
}
