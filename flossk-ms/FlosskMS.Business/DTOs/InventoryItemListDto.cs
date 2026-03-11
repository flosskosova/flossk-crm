namespace FlosskMS.Business.DTOs;

public class InventoryItemListDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
    public int CheckedOutQuantity { get; set; } = 0;
    public int QuantityInUse { get; set; } = 0;
    public int QuantityAvailable { get; set; } = 0;
    public string Status { get; set; } = string.Empty;
    public string Condition { get; set; } = "Good";
    public string? ConditionNotes { get; set; }
    public string? ConditionReportedByUserFullName { get; set; }
    public string? ConditionReportedByUserProfilePictureUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Current user (abbreviated)
    public string? CurrentUserId { get; set; }
    public string? CurrentUserEmail { get; set; }
    public string? CurrentUserFirstName { get; set; }
    public string? CurrentUserLastName { get; set; }
    public string? CurrentUserFullName { get; set; }
    public string? CurrentUserProfilePictureUrl { get; set; }

    // Creator (abbreviated)
    public string? CreatedByUserFullName { get; set; }
    public string? CreatedByUserProfilePictureUrl { get; set; }

    // Images
    public List<InventoryItemImageDto> Images { get; set; } = [];
    
    // Current checkouts
    public List<InventoryItemCheckoutDto> Checkouts { get; set; } = [];
}
