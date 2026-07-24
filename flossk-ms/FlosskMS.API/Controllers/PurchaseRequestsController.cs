using System.Security.Claims;
using FlosskMS.Business.DTOs;
using FlosskMS.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PurchaseRequestsController(IPurchaseRequestService purchaseRequestService) : ControllerBase
{
    private readonly IPurchaseRequestService _purchaseRequestService = purchaseRequestService;

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    private string UserName => $"{User.FindFirstValue("firstName")} {User.FindFirstValue("lastName")}".Trim();

    // Any authenticated user can submit a request
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePurchaseRequestDto request)
        => await _purchaseRequestService.CreateAsync(request, UserId, UserName);

    // Any authenticated user can view their own requests
    [HttpGet("mine")]
    public async Task<IActionResult> GetMine([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        => await _purchaseRequestService.GetMineAsync(UserId, page, pageSize);

    // Board (Admin/Leader) — approval queue
    [Authorize(Roles = "Admin,Leader")]
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        => await _purchaseRequestService.GetAllAsync(status, page, pageSize);

    [Authorize(Roles = "Admin,Leader")]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
        => await _purchaseRequestService.GetByIdAsync(id);

    [Authorize(Roles = "Admin,Leader")]
    [HttpPost("approve/{id:guid}")]
    public async Task<IActionResult> Approve(Guid id)
        => await _purchaseRequestService.ApproveAsync(id, UserId, UserName);

    [Authorize(Roles = "Admin,Leader")]
    [HttpPost("reject/{id:guid}")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] RejectPurchaseRequestDto request)
        => await _purchaseRequestService.RejectAsync(id, request, UserId, UserName);
}
