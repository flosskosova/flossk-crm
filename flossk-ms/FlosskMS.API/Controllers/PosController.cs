using System.Security.Claims;
using FlosskMS.Business.DTOs;
using FlosskMS.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PosController(IPosService posService) : ControllerBase
{
    private readonly IPosService _posService = posService;

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    private string UserName => $"{User.FindFirstValue("firstName")} {User.FindFirstValue("lastName")}".Trim();

    // Categories
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
        => await _posService.GetCategoriesAsync();

    [HttpPost("categories")]
    public async Task<IActionResult> CreateCategory([FromBody] CreatePosCategoryDto request)
        => await _posService.CreateCategoryAsync(request);

    [HttpPut("categories/{id:guid}")]
    public async Task<IActionResult> UpdateCategory(Guid id, [FromBody] CreatePosCategoryDto request)
        => await _posService.UpdateCategoryAsync(id, request);

    [HttpDelete("categories/{id:guid}")]
    public async Task<IActionResult> DeleteCategory(Guid id)
        => await _posService.DeleteCategoryAsync(id);

    // Products
    [HttpGet("products")]
    public async Task<IActionResult> GetProducts([FromQuery] Guid? categoryId = null)
        => await _posService.GetProductsAsync(categoryId);

    [HttpPost("products")]
    public async Task<IActionResult> CreateProduct([FromBody] CreatePosProductDto request)
        => await _posService.CreateProductAsync(request, UserId);

    [HttpPut("products/{id:guid}")]
    public async Task<IActionResult> UpdateProduct(Guid id, [FromBody] CreatePosProductDto request)
        => await _posService.UpdateProductAsync(id, request);

    [HttpDelete("products/{id:guid}")]
    public async Task<IActionResult> DeleteProduct(Guid id)
        => await _posService.DeleteProductAsync(id);

    // Customers
    [HttpGet("customers")]
    public async Task<IActionResult> GetCustomers([FromQuery] string? search = null)
        => await _posService.GetCustomersAsync(search);

    [HttpPost("customers")]
    public async Task<IActionResult> CreateCustomer([FromBody] CreatePosCustomerDto request)
        => await _posService.CreateCustomerAsync(request);

    [HttpPut("customers/{id:guid}")]
    public async Task<IActionResult> UpdateCustomer(Guid id, [FromBody] CreatePosCustomerDto request)
        => await _posService.UpdateCustomerAsync(id, request);

    // Orders
    [HttpPost("orders")]
    public async Task<IActionResult> CreateOrder([FromBody] CreatePosOrderDto request)
        => await _posService.CreateOrderAsync(request, UserId, UserName);

    [HttpGet("orders")]
    public async Task<IActionResult> GetOrders(
        [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        => await _posService.GetOrdersAsync(from, to, page, pageSize);

    // Payment Logs (Admin/Leader only - read-only, no delete)
    [Authorize(Roles = "Admin,Leader")]
    [HttpGet("payment-logs")]
    public async Task<IActionResult> GetPaymentLogs(
        [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        => await _posService.GetPaymentLogsAsync(from, to, page, pageSize);

    // Donation Logs (Admin/Leader only)
    [Authorize(Roles = "Admin,Leader")]
    [HttpGet("donation-logs")]
    public async Task<IActionResult> GetDonationLogs(
        [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        => await _posService.GetDonationLogsAsync(from, to, page, pageSize);

    // Analytics (Admin/Leader only)
    [Authorize(Roles = "Admin,Leader")]
    [HttpGet("analytics")]
    public async Task<IActionResult> GetAnalytics(
        [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
        => await _posService.GetAnalyticsAsync(from, to);

    // Shifts
    [HttpPost("shifts/start")]
    public async Task<IActionResult> StartShift([FromBody] StartPosShiftDto request)
        => await _posService.StartShiftAsync(request, UserId, UserName);

    [HttpPost("shifts/{id:guid}/end")]
    public async Task<IActionResult> EndShift(Guid id, [FromBody] EndPosShiftDto request)
        => await _posService.EndShiftAsync(id, request, UserId, User.IsInRole("Admin"));

    [HttpGet("shifts/open")]
    public async Task<IActionResult> GetOpenShift()
        => await _posService.GetOpenShiftAsync(UserId);

    [HttpGet("shifts")]
    public async Task<IActionResult> GetShifts([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        => await _posService.GetShiftsAsync(page, pageSize);

    // Operator Management (Admin only)
    [Authorize(Roles = "Admin")]
    [HttpGet("operators")]
    public async Task<IActionResult> GetOperators()
        => await _posService.GetOperatorsAsync();

    [Authorize(Roles = "Admin")]
    [HttpPost("operators/{userId}")]
    public async Task<IActionResult> AddOperator(string userId)
        => await _posService.AddOperatorAsync(userId);

    [Authorize(Roles = "Admin")]
    [HttpDelete("operators/{userId}")]
    public async Task<IActionResult> RemoveOperator(string userId)
        => await _posService.RemoveOperatorAsync(userId);
}
