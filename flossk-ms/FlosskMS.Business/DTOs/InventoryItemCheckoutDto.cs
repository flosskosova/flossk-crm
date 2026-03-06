namespace FlosskMS.Business.DTOs;

public class InventoryItemCheckoutDto
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string UserFirstName { get; set; } = string.Empty;
    public string UserLastName { get; set; } = string.Empty;
    public string UserFullName { get; set; } = string.Empty;
    public string? UserProfilePictureUrl { get; set; }
    public int Quantity { get; set; }
    public DateTime CheckedOutAt { get; set; }
}
