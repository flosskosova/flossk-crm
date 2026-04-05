using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.API.Controllers;

/// <summary>
/// Handles /verify/{token} requests so that QR codes that encode the old API base URL
/// (e.g., http://localhost:5267/verify/...) are redirected to the Angular frontend.
/// </summary>
[AllowAnonymous]
[ApiController]
[Route("verify")]
public class VerifyRedirectController(IConfiguration config) : ControllerBase
{
    [HttpGet("{token}")]
    public IActionResult RedirectToVerifyPage(string token)
    {
        var frontendUrl = config["Certificates:BaseUrl"] ?? "http://localhost:4200";
        return Redirect($"{frontendUrl}/verify/{token}");
    }
}
