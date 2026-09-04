using FlosskMS.Business.DTOs;
using FlosskMS.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.API.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class AccessLogsController(IAccessService accessService) : ControllerBase
{
    private readonly IAccessService _accessService = accessService;

    [HttpGet]
    public Task<IActionResult> GetAll([FromQuery] AccessLogQueryDto query) => _accessService.GetLogsAsync(query);
}
