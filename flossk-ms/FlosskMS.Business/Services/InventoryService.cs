using System.Text.Json;
using AutoMapper;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;
using FlosskMS.Business.DTOs;
using FlosskMS.Data;
using FlosskMS.Data.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FlosskMS.Business.Services;

public class InventoryService : IInventoryService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IFileService _fileService;
    private readonly ILogService _logService;

    public InventoryService(ApplicationDbContext context, IMapper mapper, IFileService fileService, ILogService logService)
    {
        _context = context;
        _mapper = mapper;
        _fileService = fileService;
        _logService = logService;
    }

    public async Task<IActionResult> GetAllInventoryItemsAsync(int page = 1, int pageSize = 20, string? category = null, string? status = null, string? condition = null, string? search = null, string? currentUserId = null)
    {
        var query = _context.InventoryItems
            .Include(i => i.CreatedByUser!)
                .ThenInclude(u => u.UploadedFiles)
            .Include(i => i.ConditionReportedByUser!)
                .ThenInclude(u => u.UploadedFiles)
            .Include(i => i.Images)
                .ThenInclude(img => img.UploadedFile)
            .Include(i => i.Checkouts)
                .ThenInclude(c => c.User)
                    .ThenInclude(u => u.UploadedFiles)
            .AsQueryable();

        // Filter by category
        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(i => i.Category == category);
        }

        // Filter by status
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<InventoryStatus>(status, true, out var statusEnum))
        {
            query = query.Where(i => i.Status == statusEnum);
        }

        // Filter by condition
        if (!string.IsNullOrEmpty(condition) && Enum.TryParse<InventoryCondition>(condition, true, out var conditionEnum))
        {
            query = query.Where(i => i.Condition == conditionEnum);
        }

        // Filter by current user (usage)
        if (!string.IsNullOrEmpty(currentUserId))
        {
            query = query.Where(i => i.Checkouts.Any(c => c.UserId == currentUserId));
        }

        // Search by name or description
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(i => i.Name.Contains(search) || (i.Description != null && i.Description.Contains(search)));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(i => i.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new OkObjectResult(new
        {
            Data = _mapper.Map<List<InventoryItemListDto>>(items),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    public async Task<IActionResult> GetInventoryItemByIdAsync(Guid id)
    {
        var item = await GetItemWithIncludesAsync(id);

        if (item == null)
        {
            return new NotFoundObjectResult(new { Message = "Inventory item not found." });
        }

        return new OkObjectResult(_mapper.Map<InventoryItemDto>(item));
    }

    public async Task<IActionResult> GetInventoryItemsByUserAsync(string userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return new NotFoundObjectResult(new { Message = "User not found." });
        }

        var items = await _context.InventoryItems
            .Include(i => i.CreatedByUser!)
                .ThenInclude(u => u.UploadedFiles)
            .Include(i => i.Images)
                .ThenInclude(img => img.UploadedFile)
            .Include(i => i.Checkouts)
                .ThenInclude(c => c.User)
                    .ThenInclude(u => u.UploadedFiles)
            .Where(i => i.Checkouts.Any(c => c.UserId == userId) && i.Status == InventoryStatus.InUse)
            .OrderByDescending(i => i.UpdatedAt)
            .ToListAsync();

        return new OkObjectResult(_mapper.Map<List<InventoryItemDto>>(items));
    }

    public async Task<IActionResult> CreateInventoryItemAsync(CreateInventoryItemDto dto, string createdByUserId)
    {
        var user = await _context.Users.FindAsync(createdByUserId);
        if (user == null)
        {
            return new NotFoundObjectResult(new { Message = "Creator user not found." });
        }

        var item = new InventoryItem
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Manufacturer = dto.Manufacturer,
            Category = dto.Category,
            SubCategory = dto.SubCategory,
            Unit = dto.Unit,
            Quantity = dto.Quantity,
            Location = dto.Location,
            ElectricSpecs = dto.ElectricSpecs,
            Description = dto.Description,
            Status = InventoryStatus.Free,
            CreatedByUserId = createdByUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.InventoryItems.Add(item);

        // Upload and add images if provided
        if (dto.Images != null && dto.Images.Count > 0)
        {
            var uploadResult = await _fileService.UploadFilesAsync(dto.Images, createdByUserId);
            foreach (var fileResult in uploadResult.Results.Where(r => r.Success))
            {
                var image = new InventoryItemImage
                {
                    Id = Guid.NewGuid(),
                    InventoryItemId = item.Id,
                    UploadedFileId = fileResult.FileId!.Value,
                    AddedAt = DateTime.UtcNow
                };
                _context.InventoryItemImages.Add(image);
            }
        }

        await _context.SaveChangesAsync();

        await _logService.CreateAsync(new CreateLogDto
        {
            EntityType = "Inventory",
            EntityId = item.Id.ToString(),
            EntityName = item.Name,
            Action = "Item created",
            UserId = createdByUserId
        });

        // Log each image added during creation
        if (dto.Images != null && dto.Images.Count > 0)
        {
            var savedImages = await _context.InventoryItemImages
                .Include(img => img.UploadedFile)
                .Where(img => img.InventoryItemId == item.Id)
                .ToListAsync();
            foreach (var img in savedImages)
            {
                await _logService.CreateAsync(new CreateLogDto
                {
                    EntityType = "Inventory",
                    EntityId = item.Id.ToString(),
                    EntityName = item.Name,
                    Action = "Image added",
                    Detail = "/uploads/" + img.UploadedFile.FileName,
                    UserId = createdByUserId
                });
            }
        }

        // Reload with includes
        var createdItem = await GetItemWithIncludesAsync(item.Id);
        return new OkObjectResult(new { Message = "Inventory item created successfully.", Data = _mapper.Map<InventoryItemDto>(createdItem) });
    }

    public async Task<IActionResult> UpdateInventoryItemAsync(Guid id, UpdateInventoryItemDto dto, string userId)
    {
        var item = await _context.InventoryItems.FindAsync(id);

        if (item == null)
        {
            return new NotFoundObjectResult(new { Message = "Inventory item not found." });
        }

        // Snapshot old values before any mutation
        var oldName           = item.Name;
        var oldManufacturer   = item.Manufacturer;
        var oldCategory       = item.Category;
        var oldSubCategory    = item.SubCategory;
        var oldUnit           = item.Unit;
        var oldDescription    = item.Description;
        var oldQuantity       = item.Quantity;
        var oldLocation       = item.Location;
        var oldElectricSpecs  = item.ElectricSpecs;

        // Track field-level changes for logging
        var fieldChanges = new List<(string Field, string OldValue, string NewValue)>();

        // Update fields if provided
        if (!string.IsNullOrEmpty(dto.Name) && dto.Name != item.Name)
        {
            fieldChanges.Add(("Name", oldName, dto.Name));
            item.Name = dto.Name;
        }

        if (!string.IsNullOrEmpty(dto.Category) && dto.Category != item.Category)
        {
            fieldChanges.Add(("Category", oldCategory ?? string.Empty, dto.Category));
            item.Category = dto.Category;
        }

        if (dto.Description != null && dto.Description != item.Description)
        {
            fieldChanges.Add(("Description",
                string.IsNullOrWhiteSpace(oldDescription) ? "(empty)" : oldDescription,
                string.IsNullOrWhiteSpace(dto.Description) ? "(empty)" : dto.Description));
            item.Description = dto.Description;
        }

        if (dto.Quantity.HasValue && dto.Quantity.Value != item.Quantity)
        {
            fieldChanges.Add(("Quantity", oldQuantity.ToString(), dto.Quantity.Value.ToString()));
            item.Quantity = dto.Quantity.Value;
        }

        if (dto.Manufacturer != null && dto.Manufacturer != item.Manufacturer)
        {
            fieldChanges.Add(("Manufacturer",
                string.IsNullOrWhiteSpace(oldManufacturer) ? "(empty)" : oldManufacturer,
                string.IsNullOrWhiteSpace(dto.Manufacturer) ? "(empty)" : dto.Manufacturer));
            item.Manufacturer = dto.Manufacturer;
        }

        if (dto.SubCategory != null && dto.SubCategory != item.SubCategory)
        {
            fieldChanges.Add(("SubCategory",
                string.IsNullOrWhiteSpace(oldSubCategory) ? "(empty)" : oldSubCategory,
                string.IsNullOrWhiteSpace(dto.SubCategory) ? "(empty)" : dto.SubCategory));
            item.SubCategory = dto.SubCategory;
        }

        if (dto.Unit != null && dto.Unit != item.Unit)
        {
            fieldChanges.Add(("Unit",
                string.IsNullOrWhiteSpace(oldUnit) ? "(empty)" : oldUnit,
                string.IsNullOrWhiteSpace(dto.Unit) ? "(empty)" : dto.Unit));
            item.Unit = dto.Unit;
        }

        if (dto.Location != null && dto.Location != item.Location)
        {
            fieldChanges.Add(("Location",
                string.IsNullOrWhiteSpace(oldLocation) ? "(empty)" : oldLocation,
                string.IsNullOrWhiteSpace(dto.Location) ? "(empty)" : dto.Location));
            item.Location = dto.Location;
        }

        if (dto.ElectricSpecs != null && dto.ElectricSpecs != item.ElectricSpecs)
        {
            fieldChanges.Add(("ElectricSpecs",
                string.IsNullOrWhiteSpace(oldElectricSpecs) ? "(empty)" : oldElectricSpecs,
                string.IsNullOrWhiteSpace(dto.ElectricSpecs) ? "(empty)" : dto.ElectricSpecs));
            item.ElectricSpecs = dto.ElectricSpecs;
        }

        item.UpdatedAt = DateTime.UtcNow;

        // Upload and append new images if provided
        if (dto.Images != null && dto.Images.Count > 0)
        {
            var uploadResult = await _fileService.UploadFilesAsync(dto.Images, userId);
            foreach (var fileResult in uploadResult.Results.Where(r => r.Success))
            {
                var image = new InventoryItemImage
                {
                    Id = Guid.NewGuid(),
                    InventoryItemId = item.Id,
                    UploadedFileId = fileResult.FileId!.Value,
                    AddedAt = DateTime.UtcNow
                };
                _context.InventoryItemImages.Add(image);
            }
        }

        await _context.SaveChangesAsync();

        // Log one entry per changed field
        foreach (var (field, oldValue, newValue) in fieldChanges)
        {
            await _logService.CreateAsync(new CreateLogDto
            {
                EntityType = "Inventory",
                EntityId = item.Id.ToString(),
                EntityName = item.Name,
                Action = "Field updated",
                Detail = $"{field}: \"{oldValue}\" → \"{newValue}\"",
                UserId = userId
            });
        }

        // If nothing changed in fields but the call still hit (e.g. only images), log a generic entry
        if (fieldChanges.Count == 0 && (dto.Images == null || dto.Images.Count == 0))
        {
            await _logService.CreateAsync(new CreateLogDto
            {
                EntityType = "Inventory",
                EntityId = item.Id.ToString(),
                EntityName = item.Name,
                Action = "Item updated",
                Detail = "No changes detected",
                UserId = userId
            });
        }

        // Log each new image appended during update
        if (dto.Images != null && dto.Images.Count > 0)
        {
            var savedImages = await _context.InventoryItemImages
                .Include(img => img.UploadedFile)
                .Where(img => img.InventoryItemId == item.Id)
                .OrderByDescending(img => img.AddedAt)
                .Take(dto.Images.Count)
                .ToListAsync();
            foreach (var img in savedImages)
            {
                await _logService.CreateAsync(new CreateLogDto
                {
                    EntityType = "Inventory",
                    EntityId = item.Id.ToString(),
                    EntityName = item.Name,
                    Action = "Image added",
                    Detail = "/uploads/" + img.UploadedFile.FileName,
                    UserId = userId
                });
            }
        }

        // Reload with includes
        var updatedItem = await GetItemWithIncludesAsync(item.Id);
        return new OkObjectResult(new { Message = "Inventory item updated successfully.", Data = _mapper.Map<InventoryItemDto>(updatedItem) });
    }

    public async Task<IActionResult> DeleteInventoryItemAsync(Guid id, string userId)
    {
        var item = await _context.InventoryItems.FindAsync(id);

        if (item == null)
        {
            return new NotFoundObjectResult(new { Message = "Inventory item not found." });
        }

        var itemName = item.Name;
        var itemId = item.Id.ToString();
        _context.InventoryItems.Remove(item);
        await _context.SaveChangesAsync();

        await _logService.CreateAsync(new CreateLogDto
        {
            EntityType = "Inventory",
            EntityId = itemId,
            EntityName = itemName,
            Action = "Item deleted",
            UserId = userId
        });

        return new OkObjectResult(new { Message = "Inventory item deleted successfully." });
    }

    public async Task<IActionResult> CheckOutInventoryItemAsync(Guid id, string userId, CheckOutInventoryItemDto? dto = null)
    {
        var item = await GetItemWithIncludesAsync(id);

        if (item == null)
        {
            return new NotFoundObjectResult(new { Message = "Inventory item not found." });
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return new NotFoundObjectResult(new { Message = "User not found." });
        }

        // Get requested quantity (default to 1 if not provided)
        int requestedQuantity = dto?.Quantity ?? 1;

        // Calculate available quantity
        int availableQuantity = item.Quantity - item.CheckedOutQuantity;

        if (availableQuantity <= 0)
        {
            return new BadRequestObjectResult(new { Message = "This inventory item is completely checked out. No units available." });
        }

        if (requestedQuantity > availableQuantity)
        {
            return new BadRequestObjectResult(new { Message = $"Cannot check out {requestedQuantity} units. Only {availableQuantity} units available." });
        }

        if (requestedQuantity <= 0)
        {
            return new BadRequestObjectResult(new { Message = "Quantity must be at least 1." });
        }

        // Check if user already has a checkout for this item
        var existingCheckout = await _context.InventoryItemCheckouts
            .FirstOrDefaultAsync(c => c.InventoryItemId == id && c.UserId == userId);

        if (existingCheckout != null)
        {
            // Add to existing checkout
            existingCheckout.Quantity += requestedQuantity;
        }
        else
        {
            // Create new checkout record
            var checkout = new InventoryItemCheckout
            {
                Id = Guid.NewGuid(),
                InventoryItemId = id,
                UserId = userId,
                Quantity = requestedQuantity,
                CheckedOutAt = DateTime.UtcNow
            };
            await _context.InventoryItemCheckouts.AddAsync(checkout);
        }

        // Update item
        item.CheckedOutQuantity += requestedQuantity;
        item.Status = InventoryStatus.InUse;
        item.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _logService.CreateAsync(new CreateLogDto
        {
            EntityType = "Inventory",
            EntityId = item.Id.ToString(),
            EntityName = item.Name,
            Action = $"Checked out {requestedQuantity} unit(s)",
            UserId = userId
        });

        // Reload with includes
        var updatedItem = await GetItemWithIncludesAsync(item.Id);
        return new OkObjectResult(new { Message = $"Successfully checked out {requestedQuantity} unit(s) of {item.Name}.", Data = _mapper.Map<InventoryItemDto>(updatedItem) });
    }

    public async Task<IActionResult> CheckInInventoryItemAsync(Guid id, string userId, CheckInInventoryItemDto? dto = null)
    {
        var item = await GetItemWithIncludesAsync(id);

        if (item == null)
        {
            return new NotFoundObjectResult(new { Message = "Inventory item not found." });
        }

        // Find user's checkout for this item
        var userCheckout = await _context.InventoryItemCheckouts
            .FirstOrDefaultAsync(c => c.InventoryItemId == id && c.UserId == userId);

        if (userCheckout == null)
        {
            return new BadRequestObjectResult(new { Message = "You don't have any checked out units for this item." });
        }

        // Get quantity to return (default to all if not provided)
        int quantityToReturn = dto?.Quantity ?? userCheckout.Quantity;

        // Validate quantity
        if (quantityToReturn <= 0)
        {
            return new BadRequestObjectResult(new { Message = "Quantity must be at least 1." });
        }

        if (quantityToReturn > userCheckout.Quantity)
        {
            return new BadRequestObjectResult(new { Message = $"Cannot check in {quantityToReturn} units. You only have {userCheckout.Quantity} unit(s) checked out." });
        }

        // Update or remove checkout record
        if (quantityToReturn >= userCheckout.Quantity)
        {
            // User is returning all units, remove the checkout record
            _context.InventoryItemCheckouts.Remove(userCheckout);
        }
        else
        {
            // User is returning partial units, update the checkout record
            userCheckout.Quantity -= quantityToReturn;
        }

        // Return the specified quantity
        item.CheckedOutQuantity -= quantityToReturn;
        item.UpdatedAt = DateTime.UtcNow;

        // If all items are returned, mark as free
        if (item.CheckedOutQuantity == 0)
        {
            item.Status = InventoryStatus.Free;
        }

        await _context.SaveChangesAsync();

        await _logService.CreateAsync(new CreateLogDto
        {
            EntityType = "Inventory",
            EntityId = item.Id.ToString(),
            EntityName = item.Name,
            Action = $"Checked in {quantityToReturn} unit(s)",
            UserId = userId
        });

        // Reload with includes
        var updatedItem = await GetItemWithIncludesAsync(item.Id);
        return new OkObjectResult(new { Message = $"Successfully checked in {quantityToReturn} unit(s) of {item.Name}.", Data = _mapper.Map<InventoryItemDto>(updatedItem) });
    }

    public async Task<IActionResult> ReportDamageAsync(Guid id, string userId, string? notes = null)
    {
        var item = await GetItemWithIncludesAsync(id);

        if (item == null)
        {
            return new NotFoundObjectResult(new { Message = "Inventory item not found." });
        }

        if (item.Condition == InventoryCondition.Damaged)
        {
            return new BadRequestObjectResult(new { Message = "This inventory item is already marked as damaged." });
        }

        item.Condition = InventoryCondition.Damaged;
        item.ConditionNotes = notes;
        item.ConditionReportedByUserId = userId;
        item.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _logService.CreateAsync(new CreateLogDto
        {
            EntityType = "Inventory",
            EntityId = item.Id.ToString(),
            EntityName = item.Name,
            Action = "Damage reported",
            UserId = userId
        });

        var updatedItem = await GetItemWithIncludesAsync(item.Id);
        return new OkObjectResult(new { Message = "Damage report submitted. Item marked as damaged.", Data = _mapper.Map<InventoryItemDto>(updatedItem) });
    }

    public async Task<IActionResult> ReportRepairAsync(Guid id, string userId, string? notes = null)
    {
        var item = await GetItemWithIncludesAsync(id);

        if (item == null)
        {
            return new NotFoundObjectResult(new { Message = "Inventory item not found." });
        }

        if (item.Condition != InventoryCondition.Damaged)
        {
            return new BadRequestObjectResult(new { Message = "Only damaged inventory items can be reported as repaired." });
        }

        item.Condition = InventoryCondition.Repaired;
        item.ConditionNotes = notes;
        item.ConditionReportedByUserId = userId;
        item.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _logService.CreateAsync(new CreateLogDto
        {
            EntityType = "Inventory",
            EntityId = item.Id.ToString(),
            EntityName = item.Name,
            Action = "Repair reported",
            UserId = userId
        });

        var updatedItem = await GetItemWithIncludesAsync(item.Id);
        return new OkObjectResult(new { Message = "Repair report submitted. Item marked as repaired.", Data = _mapper.Map<InventoryItemDto>(updatedItem) });
    }

    public async Task<IActionResult> AddImageToInventoryItemAsync(Guid id, Guid fileId, string userId)
    {
        var item = await _context.InventoryItems.FindAsync(id);
        if (item == null)
        {
            return new NotFoundObjectResult(new { Message = "Inventory item not found." });
        }

        var file = await _context.UploadedFiles.FindAsync(fileId);
        if (file == null)
        {
            return new NotFoundObjectResult(new { Message = "File not found." });
        }

        var existingImage = await _context.InventoryItemImages
            .FirstOrDefaultAsync(img => img.InventoryItemId == id && img.UploadedFileId == fileId);

        if (existingImage != null)
        {
            return new BadRequestObjectResult(new { Message = "This image is already associated with the inventory item." });
        }

        var image = new InventoryItemImage
        {
            Id = Guid.NewGuid(),
            InventoryItemId = id,
            UploadedFileId = fileId,
            AddedAt = DateTime.UtcNow
        };

        _context.InventoryItemImages.Add(image);
        await _context.SaveChangesAsync();

        await _logService.CreateAsync(new CreateLogDto
        {
            EntityType = "Inventory",
            EntityId = id.ToString(),
            EntityName = item.Name,
            Action = "Image added",
            Detail = "/uploads/" + file.FileName,
            UserId = userId
        });

        return new OkObjectResult(new { Message = "Image added successfully." });
    }

    public async Task<IActionResult> RemoveImageFromInventoryItemAsync(Guid id, Guid imageId, string userId)
    {
        var item = await _context.InventoryItems.FindAsync(id);
        if (item == null)
        {
            return new NotFoundObjectResult(new { Message = "Inventory item not found." });
        }

        var image = await _context.InventoryItemImages
            .Include(img => img.UploadedFile)
            .FirstOrDefaultAsync(img => img.InventoryItemId == id && img.Id == imageId);

        if (image == null)
        {
            return new NotFoundObjectResult(new { Message = "Image not found for this inventory item." });
        }

        var fileName = image.UploadedFile?.FileName;
        _context.InventoryItemImages.Remove(image);
        await _context.SaveChangesAsync();

        await _logService.CreateAsync(new CreateLogDto
        {
            EntityType = "Inventory",
            EntityId = id.ToString(),
            EntityName = item.Name,
            Action = "Image removed",
            Detail = fileName != null ? "/uploads/" + fileName : null,
            UserId = userId
        });

        return new OkObjectResult(new { Message = "Image removed successfully." });
    }

    public async Task<IActionResult> SeedInventoryItemsAsync(string createdByUserId)
    {
        var user = await _context.Users.FindAsync(createdByUserId);
        if (user == null)
        {
            return new NotFoundObjectResult(new { Message = "Creator user not found." });
        }

        // Check if inventory items already exist
        var existingItemsCount = await _context.InventoryItems.CountAsync();
        if (existingItemsCount > 0)
        {
            return new BadRequestObjectResult(new { Message = "Inventory items already exist. Seeding is only allowed on an empty inventory." });
        }

        var seedItems = new List<InventoryItem>
        {
            new InventoryItem
            {
                Id = Guid.NewGuid(),
                Name = "Arduino Uno R3",
                Category = "Electronic",
                Quantity = 5,
                CheckedOutQuantity = 0,
                Status = InventoryStatus.Free,
                Condition = InventoryCondition.Good,
                Description = "Microcontroller board based on the ATmega328P",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = null,
                CreatedByUserId = createdByUserId,
                Images = [],
                Checkouts = []
            },
            new InventoryItem
            {
                Id = Guid.NewGuid(),
                Name = "Raspberry Pi 4 Model B",
                Category = "Electronic",
                Quantity = 3,
                CheckedOutQuantity = 0,
                Status = InventoryStatus.Free,
                Condition = InventoryCondition.Good,
                Description = "Single-board computer with 4GB RAM",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = null,
                CreatedByUserId = createdByUserId,
                Images = [],
                Checkouts = []
            },
            new InventoryItem
            {
                Id = Guid.NewGuid(),
                Name = "Soldering Iron Station",
                Category = "Tool",
                Quantity = 2,
                CheckedOutQuantity = 0,
                Status = InventoryStatus.Free,
                Condition = InventoryCondition.Good,
                Description = "Digital temperature controlled soldering station",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = null,
                CreatedByUserId = createdByUserId,
                Images = [],
                Checkouts = []
            },
            new InventoryItem
            {
                Id = Guid.NewGuid(),
                Name = "3D Printer Filament (PLA)",
                Category = "Components",
                Quantity = 10,
                CheckedOutQuantity = 0,
                Status = InventoryStatus.Free,
                Condition = InventoryCondition.Good,
                Description = "1kg spools of PLA filament in various colors",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = null,
                CreatedByUserId = createdByUserId,
                Images = [],
                Checkouts = []
            },
            new InventoryItem
            {
                Id = Guid.NewGuid(),
                Name = "Oscilloscope",
                Category = "Electronic",
                Quantity = 1,
                CheckedOutQuantity = 0,
                Status = InventoryStatus.Free,
                Condition = InventoryCondition.Good,
                Description = "Digital storage oscilloscope 100MHz",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = null,
                CreatedByUserId = createdByUserId,
                Images = [],
                Checkouts = []
            },
            new InventoryItem
            {
                Id = Guid.NewGuid(),
                Name = "Breadboards",
                Category = "Components",
                Quantity = 15,
                CheckedOutQuantity = 0,
                Status = InventoryStatus.Free,
                Condition = InventoryCondition.Good,
                Description = "830 point solderless breadboards",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = null,
                CreatedByUserId = createdByUserId,
                Images = [],
                Checkouts = []
            },
            new InventoryItem
            {
                Id = Guid.NewGuid(),
                Name = "Screwdriver Set",
                Category = "Tool",
                Quantity = 4,
                CheckedOutQuantity = 0,
                Status = InventoryStatus.Free,
                Condition = InventoryCondition.Good,
                Description = "Precision screwdriver set with multiple bits",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = null,
                CreatedByUserId = createdByUserId,
                Images = [],
                Checkouts = []
            },
            new InventoryItem
            {
                Id = Guid.NewGuid(),
                Name = "Workbench",
                Category = "Furniture",
                Quantity = 1,
                CheckedOutQuantity = 0,
                Status = InventoryStatus.Free,
                Condition = InventoryCondition.Good,
                Description = "Heavy-duty electronics workbench with ESD protection",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = null,
                CreatedByUserId = createdByUserId,
                Images = [],
                Checkouts = []
            },
            new InventoryItem
            {
                Id = Guid.NewGuid(),
                Name = "Multimeter",
                Category = "Electronic",
                Quantity = 6,
                CheckedOutQuantity = 0,
                Status = InventoryStatus.Free,
                Condition = InventoryCondition.Good,
                Description = "Digital multimeter with auto-ranging",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = null,
                CreatedByUserId = createdByUserId,
                Images = [],
                Checkouts = []
            },
            new InventoryItem
            {
                Id = Guid.NewGuid(),
                Name = "Wire Stripper",
                Category = "Tool",
                Quantity = 3,
                CheckedOutQuantity = 0,
                Status = InventoryStatus.Free,
                Condition = InventoryCondition.Good,
                Description = "Automatic wire stripper and cutter",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = null,
                CreatedByUserId = createdByUserId,
                Images = [],
                Checkouts = []
            }
        };

        _context.InventoryItems.AddRange(seedItems);
        await _context.SaveChangesAsync();

        return new OkObjectResult(new 
        { 
            Message = $"Successfully seeded {seedItems.Count} inventory items.", 
            Count = seedItems.Count,
            Items = seedItems.Select(i => new { i.Id, i.Name, i.Category, i.Status }).ToList()
        });
    }

    public async Task<IActionResult> ImportInventoryItemsAsync(IFormFile file, string createdByUserId)
    {
        if (file == null || file.Length == 0)
            return new BadRequestObjectResult(new { Message = "No file provided." });

        if (!file.FileName.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
            return new BadRequestObjectResult(new { Message = "File must be a .json file." });

        var user = await _context.Users.FindAsync(createdByUserId);
        if (user == null)
            return new NotFoundObjectResult(new { Message = "User not found." });

        JsonDocument doc;
        try
        {
            using var stream = file.OpenReadStream();
            doc = await JsonDocument.ParseAsync(stream);
        }
        catch (JsonException ex)
        {
            return new BadRequestObjectResult(new { Message = $"Invalid JSON: {ex.Message}" });
        }

        if (doc.RootElement.ValueKind != JsonValueKind.Array)
            return new BadRequestObjectResult(new { Message = "JSON must be an array of objects." });

        var elements = doc.RootElement.EnumerateArray().ToList();
        if (elements.Count == 0)
            return new BadRequestObjectResult(new { Message = "JSON file contains no items." });

        int imported = 0;
        var errors = new List<string>();
        var itemsToLog = new List<(string id, string name)>();

        foreach (var (el, index) in elements.Select((e, i) => (e, i)))
        {
            // Return the string value, or null for non-string tokens (NaN, numbers, etc. from pandas)
            static string? ReadAsString(JsonElement parent, string key)
            {
                if (!parent.TryGetProperty(key, out var prop))
                {
                    // Try case-insensitive fallback
                    foreach (var p in parent.EnumerateObject())
                    {
                        if (string.Equals(p.Name, key, StringComparison.OrdinalIgnoreCase))
                        {
                            prop = p.Value;
                            break;
                        }
                    }
                }
                return prop.ValueKind switch
                {
                    JsonValueKind.String => prop.GetString(),
                    _ => null
                };
            }

            static int ReadAsInt(JsonElement parent, string key, int fallback = 1)
            {
                if (!parent.TryGetProperty(key, out var prop))
                {
                    foreach (var p in parent.EnumerateObject())
                    {
                        if (string.Equals(p.Name, key, StringComparison.OrdinalIgnoreCase))
                        { prop = p.Value; break; }
                    }
                }
                return prop.ValueKind switch
                {
                    JsonValueKind.Number when prop.TryGetInt32(out var n) => n,
                    JsonValueKind.String when int.TryParse(prop.GetString(), out var n) => n,
                    _ => fallback
                };
            }

            var name = ReadAsString(el, "Name") ?? ReadAsString(el, "name");
            var categoryStr = ReadAsString(el, "Category");

            if (string.IsNullOrWhiteSpace(name))
            {
                // Only report rows that have some data — truly blank rows are silently skipped
                bool hasAnyValue = el.ValueKind == JsonValueKind.Object &&
                    el.EnumerateObject().Any(p => p.Value.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(p.Value.GetString()));
                if (hasAnyValue)
                    errors.Add($"Item {index + 1}: skipped (has data but no name).");
                continue;
            }

            var quantity = ReadAsInt(el, "Quantity");

            var item = new InventoryItem
            {
                Id = Guid.NewGuid(),
                Name = name,
                Manufacturer = ReadAsString(el, "Manufacturer"),
                Category = categoryStr,
                SubCategory = ReadAsString(el, "SubCategory") ?? ReadAsString(el, "Sub-Category"),
                Unit = ReadAsString(el, "Unit"),
                Quantity = quantity > 0 ? quantity : 1,
                Location = ReadAsString(el, "Location"),
                ElectricSpecs = ReadAsString(el, "ElectricSpecs") ?? ReadAsString(el, "Electric-Specs"),
                Description = ReadAsString(el, "Description"),
                Status = InventoryStatus.Free,
                Condition = InventoryCondition.Good,
                CreatedByUserId = createdByUserId,
                CreatedAt = DateTime.UtcNow
            };

            _context.InventoryItems.Add(item);
            itemsToLog.Add((item.Id.ToString(), item.Name!));
            imported++;
        }

        await _context.SaveChangesAsync();

        foreach (var (id, name) in itemsToLog)
        {
            await _logService.CreateAsync(new CreateLogDto
            {
                EntityType = "Inventory",
                EntityId = id,
                EntityName = name,
                Action = "Item created",
                UserId = createdByUserId
            });
        }

        return new OkObjectResult(new
        {
            Message = $"Successfully imported {imported} item(s).",
            Imported = imported,
            Skipped = errors.Count,
            Errors = errors
        });
    }

    public async Task<IActionResult> GetInventoryCountAsync()
    {
        var count = await _context.InventoryItems.CountAsync();
        return new OkObjectResult(new { Count = count });
    }

    public async Task<IActionResult> GetInventoryCategoriesAsync()
    {
        var categories = await _context.InventoryItems
            .Where(i => i.Category != null && i.Category != string.Empty)
            .Select(i => i.Category)
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync();
        return new OkObjectResult(categories);
    }

    public async Task<IActionResult> GetInventoryExportAsync()
    {
        var items = await _context.InventoryItems
            .AsNoTracking()
            .OrderBy(i => i.Name)
            .Select(i => new
            {
                i.Id,
                i.Name,
                i.Manufacturer,
                i.Description,
                i.Category,
                i.SubCategory,
                i.Unit,
                i.Quantity,
                i.Location,
                i.ElectricSpecs,
                Status = i.Status.ToString(),
                Condition = i.Condition.ToString(),
                i.ConditionNotes,
                i.CreatedAt,
                i.UpdatedAt
            })
            .ToListAsync();
        return new OkObjectResult(items);
    }

    public async Task<IActionResult> GetInventoryExportExcelAsync()
    {
        var items = await _context.InventoryItems
            .AsNoTracking()
            .OrderBy(i => i.Name)
            .Select(i => new
            {
                i.Name,
                i.Manufacturer,
                i.Description,
                i.Category,
                i.SubCategory,
                i.Unit,
                i.Quantity,
                i.Location,
                i.ElectricSpecs,
                Status = i.Status.ToString(),
                Condition = i.Condition.ToString(),
                i.ConditionNotes,
                i.CreatedAt,
                i.UpdatedAt
            })
            .ToListAsync();

        using var stream = new MemoryStream();
        using (var document = SpreadsheetDocument.Create(stream, SpreadsheetDocumentType.Workbook))
        {
            var workbookPart = document.AddWorkbookPart();
            workbookPart.Workbook = new Workbook();

            var worksheetPart = workbookPart.AddNewPart<WorksheetPart>();
            var sheetData = new SheetData();
            worksheetPart.Worksheet = new Worksheet(sheetData);

            var sheets = workbookPart.Workbook.AppendChild(new Sheets());
            sheets.AppendChild(new Sheet
            {
                Id = workbookPart.GetIdOfPart(worksheetPart),
                SheetId = 1,
                Name = "Inventory"
            });

            string[] headers = ["Name", "Manufacturer", "Description", "Category", "Sub-Category", "Unit", "Quantity", "Location", "Electric Specs", "Status", "Condition", "Condition Notes", "Created At", "Updated At"];
            var headerRow = new Row();
            foreach (var h in headers)
                headerRow.AppendChild(new Cell { DataType = CellValues.InlineString, InlineString = new InlineString(new Text(h)) });
            sheetData.AppendChild(headerRow);

            foreach (var item in items)
            {
                var row = new Row();
                string?[] values =
                [
                    item.Name, item.Manufacturer, item.Description, item.Category, item.SubCategory,
                    item.Unit, item.Quantity.ToString(), item.Location, item.ElectricSpecs,
                    item.Status, item.Condition, item.ConditionNotes,
                    item.CreatedAt.ToString("yyyy-MM-dd HH:mm"),
                    item.UpdatedAt?.ToString("yyyy-MM-dd HH:mm")
                ];
                foreach (var v in values)
                    row.AppendChild(new Cell { DataType = CellValues.InlineString, InlineString = new InlineString(new Text(v ?? string.Empty)) });
                sheetData.AppendChild(row);
            }

            workbookPart.Workbook.Save();
        }

        stream.Position = 0;
        var bytes = stream.ToArray();
        return new FileContentResult(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        {
            FileDownloadName = $"inventory_export_{DateTime.UtcNow:yyyyMMdd}.xlsx"
        };
    }

    public async Task<IActionResult> DeleteAllInventoryItemsAsync()
    {
        var allItems = await _context.InventoryItems.ToListAsync();
        var count = allItems.Count;

        if (count == 0)
        {
            return new OkObjectResult(new { Message = "No inventory items to delete." });
        }

        // Delete all associated checkouts first
        var allCheckouts = await _context.InventoryItemCheckouts.ToListAsync();
        _context.InventoryItemCheckouts.RemoveRange(allCheckouts);

        // Delete all associated images
        var allImages = await _context.InventoryItemImages.ToListAsync();
        _context.InventoryItemImages.RemoveRange(allImages);

        // Delete all inventory items
        _context.InventoryItems.RemoveRange(allItems);
        await _context.SaveChangesAsync();

        return new OkObjectResult(new { Message = $"Successfully deleted {count} inventory items.", Count = count });
    }

    #region Helper Methods

    private async Task<InventoryItem?> GetItemWithIncludesAsync(Guid id)
    {
        return await _context.InventoryItems
            .Include(i => i.CreatedByUser!)
                .ThenInclude(u => u.UploadedFiles)
            .Include(i => i.ConditionReportedByUser!)
                .ThenInclude(u => u.UploadedFiles)
            .Include(i => i.Images)
                .ThenInclude(img => img.UploadedFile)
            .Include(i => i.Checkouts)
                .ThenInclude(c => c.User)
                    .ThenInclude(u => u.UploadedFiles)
            .AsSplitQuery()
            .FirstOrDefaultAsync(i => i.Id == id);
    }

    #endregion

    #region Checkout Specific Endpoints

    public async Task<IActionResult> GetAllCheckoutsAsync()
    {
        var checkouts = await _context.InventoryItemCheckouts
            .Include(c => c.User)
                .ThenInclude(u => u.UploadedFiles)
            .Include(c => c.InventoryItem)
            .OrderByDescending(c => c.CheckedOutAt)
            .ToListAsync();

        var checkoutDtos = _mapper.Map<List<InventoryItemCheckoutDto>>(checkouts);
        return new OkObjectResult(new { Data = checkoutDtos, Count = checkoutDtos.Count });
    }

    public async Task<IActionResult> GetCheckoutsByItemIdAsync(Guid itemId)
    {
        var checkouts = await _context.InventoryItemCheckouts
            .Include(c => c.User)
                .ThenInclude(u => u.UploadedFiles)
            .Where(c => c.InventoryItemId == itemId)
            .OrderByDescending(c => c.CheckedOutAt)
            .ToListAsync();

        var checkoutDtos = _mapper.Map<List<InventoryItemCheckoutDto>>(checkouts);
        return new OkObjectResult(new { Data = checkoutDtos, Count = checkoutDtos.Count });
    }

    public async Task<IActionResult> GetCheckoutsByUserIdAsync(string userId)
    {
        var checkouts = await _context.InventoryItemCheckouts
            .Include(c => c.User)
                .ThenInclude(u => u.UploadedFiles)
            .Include(c => c.InventoryItem)
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.CheckedOutAt)
            .ToListAsync();

        var checkoutDtos = _mapper.Map<List<InventoryItemCheckoutDto>>(checkouts);
        return new OkObjectResult(new { Data = checkoutDtos, Count = checkoutDtos.Count });
    }

    public async Task<IActionResult> GetUsersWithCheckoutsAsync()
    {
        var users = await _context.InventoryItemCheckouts
            .Select(c => new { Id = c.UserId, FullName = c.User.FirstName + " " + c.User.LastName })
            .Distinct()
            .ToListAsync();

        return new OkObjectResult(users);
    }
}
    #endregion
