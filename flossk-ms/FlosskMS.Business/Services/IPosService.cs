using FlosskMS.Business.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.Business.Services;

public interface IPosService
{
    Task<IActionResult> GetCategoriesAsync();
    Task<IActionResult> CreateCategoryAsync(CreatePosCategoryDto request);
    Task<IActionResult> UpdateCategoryAsync(Guid id, CreatePosCategoryDto request);
    Task<IActionResult> DeleteCategoryAsync(Guid id);

    Task<IActionResult> GetProductsAsync(Guid? categoryId = null);
    Task<IActionResult> CreateProductAsync(CreatePosProductDto request, string userId);
    Task<IActionResult> UpdateProductAsync(Guid id, CreatePosProductDto request);
    Task<IActionResult> DeleteProductAsync(Guid id);

    Task<IActionResult> GetCustomersAsync(string? search = null);
    Task<IActionResult> CreateCustomerAsync(CreatePosCustomerDto request);
    Task<IActionResult> UpdateCustomerAsync(Guid id, CreatePosCustomerDto request);

    Task<IActionResult> CreateOrderAsync(CreatePosOrderDto request, string userId, string operatorName);
    Task<IActionResult> GetOrdersAsync(DateTime? from = null, DateTime? to = null, int page = 1, int pageSize = 50);

    Task<IActionResult> GetPaymentLogsAsync(DateTime? from = null, DateTime? to = null, int page = 1, int pageSize = 50);
    Task<IActionResult> GetDonationLogsAsync(DateTime? from = null, DateTime? to = null, int page = 1, int pageSize = 50);

    Task<IActionResult> GetAnalyticsAsync(DateTime? from = null, DateTime? to = null);

    Task<IActionResult> StartShiftAsync(StartPosShiftDto request, string userId, string operatorName);
    Task<IActionResult> EndShiftAsync(Guid shiftId, EndPosShiftDto request, string userId, bool isAdmin);
    Task<IActionResult> GetOpenShiftAsync(string userId);
    Task<IActionResult> GetShiftsAsync(int page = 1, int pageSize = 20);

    Task<IActionResult> GetOperatorsAsync();
    Task<IActionResult> AddOperatorAsync(string userId);
    Task<IActionResult> RemoveOperatorAsync(string userId);
}
