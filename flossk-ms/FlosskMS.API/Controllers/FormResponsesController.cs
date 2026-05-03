using FlosskMS.Business.DTOs;
using FlosskMS.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace FlosskMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FormResponsesController(IFormResponseService formResponseService, IConfiguration configuration) : ControllerBase
{
    private readonly IFormResponseService _formResponseService = formResponseService;
    private readonly IConfiguration _configuration = configuration;

    /// <summary>
    /// Receive a form submission from a Google Apps Script webhook.
    /// The caller must supply the shared secret in the X-Webhook-Secret header.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook(
        [FromHeader(Name = "X-Webhook-Secret")] string? webhookSecret,
        [FromBody] GoogleFormWebhookDto payload,
        CancellationToken cancellationToken)
    {
        var expectedSecret = _configuration["GoogleForms:WebhookSecret"];

        if (string.IsNullOrWhiteSpace(expectedSecret))
            return StatusCode(503, new { Error = "Webhook receiver is not configured." });

        if (!string.Equals(webhookSecret, expectedSecret, StringComparison.Ordinal))
            return Unauthorized(new { Error = "Invalid webhook secret." });

        return await _formResponseService.ReceiveWebhookAsync(payload, cancellationToken);
    }

    /// <summary>
    /// Get all form responses (Admin only). Optionally filter by form title.
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> GetResponses(
        [FromQuery] string? formTitle = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        return await _formResponseService.GetResponsesAsync(formTitle, page, pageSize, cancellationToken);
    }

    /// <summary>
    /// Get a single form response by ID (Admin only).
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetResponseById(Guid id, CancellationToken cancellationToken)
    {
        return await _formResponseService.GetResponseByIdAsync(id, cancellationToken);
    }

    /// <summary>
    /// Delete a form response (Admin only).
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteResponse(Guid id, CancellationToken cancellationToken)
    {
        return await _formResponseService.DeleteResponseAsync(id, cancellationToken);
    }
}
