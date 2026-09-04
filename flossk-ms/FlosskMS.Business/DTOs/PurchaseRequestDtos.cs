using System.ComponentModel.DataAnnotations;

namespace FlosskMS.Business.DTOs;

public class CreatePurchaseRequestDto
{
    [Required]
    [MaxLength(200)]
    public string ItemName { get; set; } = string.Empty;

    [Required]
    [MaxLength(2000)]
    public string Reason { get; set; } = string.Empty;

    [MaxLength(2000)]
    [Url]
    public string? Link { get; set; }

    [Range(0, 9999999)]
    public decimal Price { get; set; }

    [Range(1, 100000)]
    public int Quantity { get; set; } = 1;

    [Required]
    public DateTime NeededByDate { get; set; }
}

public class RejectPurchaseRequestDto
{
    [MaxLength(2000)]
    public string? RejectionReason { get; set; }
}

public class PurchaseRequestDto
{
    public Guid Id { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string? Link { get; set; }
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public decimal Total { get; set; }
    public DateTime NeededByDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string? CreatedByFirstName { get; set; }
    public string? CreatedByLastName { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewedByFirstName { get; set; }
    public string? ReviewedByLastName { get; set; }
    public string? RejectionReason { get; set; }
}

public class PurchaseRequestListDto
{
    public List<PurchaseRequestDto> Requests { get; set; } = [];
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
