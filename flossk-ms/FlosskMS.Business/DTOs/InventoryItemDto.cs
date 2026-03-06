namespace FlosskMS.Business.DTOs;

public class InventoryItemDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
    public int CheckedOutQuantity { get; set; } = 0;
    public int QuantityInUse { get; set; } = 0;
    public int QuantityAvailable { get; set; } = 0;
    public string Status { get; set; } = string.Empty;
    public string Condition { get; set; } = "Good";
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Current user info (when checked out)
    public string? CurrentUserId { get; set; }
    public string? CurrentUserEmail { get; set; }
    public string? CurrentUserFirstName { get; set; }
    public string? CurrentUserLastName { get; set; }
    public string? CurrentUserFullName { get; set; }
    public string? CurrentUserProfilePictureUrl { get; set; }
    public DateTime? CheckedOutAt { get; set; }

    // Creator info
    public string CreatedByUserId { get; set; } = string.Empty;
    public string CreatedByUserEmail { get; set; } = string.Empty;
    public string CreatedByUserFirstName { get; set; } = string.Empty;
    public string CreatedByUserLastName { get; set; } = string.Empty;
    public string CreatedByUserFullName { get; set; } = string.Empty;
    public string? CreatedByUserProfilePictureUrl { get; set; }

    // Images
    public List<InventoryItemImageDto> Images { get; set; } = [];
    
    // Current checkouts
    public List<InventoryItemCheckoutDto> Checkouts { get; set; } = [];
}

public class InventoryItemImageDto
{
    public Guid Id { get; set; }
    public Guid FileId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public DateTime AddedAt { get; set; }
}
