using Microsoft.AspNetCore.Http;

namespace FlosskMS.Business.DTOs;

public class ImportInventoryItemsDto
{
    public IFormFile File { get; set; } = null!;
}
