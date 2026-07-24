using FlosskMS.Business.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.Business.Services;

public interface IPurchaseRequestService
{
    Task<IActionResult> CreateAsync(CreatePurchaseRequestDto request, string userId, string userName);
    Task<IActionResult> GetMineAsync(string userId, int page = 1, int pageSize = 20);
    Task<IActionResult> GetAllAsync(string? status = null, int page = 1, int pageSize = 20);
    Task<IActionResult> GetByIdAsync(Guid id);
    Task<IActionResult> ApproveAsync(Guid id, string reviewerUserId, string reviewerName);
    Task<IActionResult> RejectAsync(Guid id, RejectPurchaseRequestDto request, string reviewerUserId, string reviewerName);
}
