using System.Security.Claims;
using FlosskMS.Business.DTOs;
using FlosskMS.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.API.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class RfidCardsController(IRfidCardService rfidCardService, IAccessService accessService) : ControllerBase
{
    private readonly IRfidCardService _rfidCardService = rfidCardService;
    private readonly IAccessService _accessService = accessService;

    private string? ActorId => User.FindFirstValue(ClaimTypes.NameIdentifier);

    /// <summary>
    /// Get all RFID cards with optional filtering and pagination
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAllCards(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool? activeOnly = null,
        [FromQuery] bool? assignedOnly = null)
    {
        return await _rfidCardService.GetAllCardsAsync(page, pageSize, activeOnly, assignedOnly);
    }

    /// <summary>
    /// Get an RFID card by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetCardById(Guid id)
    {
        return await _rfidCardService.GetCardByIdAsync(id);
    }

    /// <summary>
    /// Get all RFID cards for a specific user
    /// </summary>
    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetCardsByUserId(string userId)
    {
        return await _rfidCardService.GetCardsByUserIdAsync(userId);
    }

    /// <summary>
    /// Get an RFID card by its card identifier
    /// </summary>
    [HttpGet("identifier/{cardIdentifier}")]
    public async Task<IActionResult> GetCardByIdentifier(string cardIdentifier)
    {
        return await _rfidCardService.GetCardByIdentifierAsync(cardIdentifier);
    }

    /// <summary>
    /// Get all unassigned (available) RFID cards
    /// </summary>
    [HttpGet("unassigned")]
    public async Task<IActionResult> GetUnassignedCards()
    {
        return await _rfidCardService.GetUnassignedCardsAsync();
    }

    /// <summary>
    /// Check if a user has an active RFID card
    /// </summary>
    [HttpGet("user/{userId}/has-active-card")]
    public async Task<IActionResult> HasActiveCard(string userId)
    {
        return await _rfidCardService.HasActiveCardAsync(userId);
    }

    /// <summary>
    /// Assign an RFID card to a user (creates a new card entry)
    /// </summary>
    [HttpPost("assign")]
    public async Task<IActionResult> AssignCard([FromBody] AssignRfidCardDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }
        return await _rfidCardService.AssignCardAsync(dto, userId);
    }

    /// <summary>
    /// Unassign an RFID card from its current user
    /// </summary>
    [HttpPatch("{id:guid}/unassign")]
    public async Task<IActionResult> UnassignCard(Guid id)
    {
        return await _rfidCardService.UnassignCardAsync(id);
    }

    /// <summary>
    /// Update an RFID card's notes
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateCard(Guid id, [FromBody] UpdateUserRfidCardDto dto)
    {
        return await _rfidCardService.UpdateCardAsync(id, dto);
    }

    /// <summary>
    /// Revoke an RFID card
    /// </summary>
    [HttpPatch("{id:guid}/revoke")]
    public async Task<IActionResult> RevokeCard(Guid id, [FromBody] RevokeUserRfidCardDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }
        return await _rfidCardService.RevokeCardAsync(id, userId, dto);
    }

    /// <summary>
    /// Reactivate a revoked RFID card
    /// </summary>
    [HttpPatch("{id:guid}/reactivate")]
    public async Task<IActionResult> ReactivateCard(Guid id)
    {
        return await _rfidCardService.ReactivateCardAsync(id);
    }

    /// <summary>
    /// Delete an RFID card
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteCard(Guid id)
    {
        return await _rfidCardService.DeleteCardAsync(id);
    }

    // ─────────────────── Access control (NFC + Aliro / Home Key) ───────────────────

    /// <summary>
    /// Assign a new access credential (NFC card or Aliro / Home Key) to a member.
    /// The credential starts in <c>Pending</c> and does not open any door until accepted.
    /// </summary>
    [HttpPost("credentials/assign")]
    public async Task<IActionResult> AssignCredential([FromBody] AssignAccessCredentialDto dto)
    {
        if (string.IsNullOrEmpty(ActorId)) return Unauthorized();
        return await _accessService.AssignCredentialAsync(dto, ActorId);
    }

    /// <summary>Accept / enable a credential (runs SetUser + SetCredential toward the door devices).</summary>
    [HttpPatch("{id:guid}/accept")]
    public async Task<IActionResult> AcceptCredential(Guid id)
    {
        if (string.IsNullOrEmpty(ActorId)) return Unauthorized();
        return await _accessService.AcceptCredentialAsync(id, ActorId);
    }

    /// <summary>Decline a credential so the door stays locked.</summary>
    [HttpPatch("{id:guid}/decline")]
    public async Task<IActionResult> DeclineCredential(Guid id, [FromBody] DeclineAccessCredentialDto dto)
    {
        if (string.IsNullOrEmpty(ActorId)) return Unauthorized();
        return await _accessService.DeclineCredentialAsync(id, dto, ActorId);
    }

    /// <summary>Temporarily disable a credential.</summary>
    [HttpPatch("{id:guid}/disable")]
    public async Task<IActionResult> DisableCredential(Guid id)
    {
        if (string.IsNullOrEmpty(ActorId)) return Unauthorized();
        return await _accessService.DisableCredentialAsync(id, ActorId);
    }

    /// <summary>Re-enable a previously disabled credential.</summary>
    [HttpPatch("{id:guid}/enable")]
    public async Task<IActionResult> EnableCredential(Guid id)
    {
        if (string.IsNullOrEmpty(ActorId)) return Unauthorized();
        return await _accessService.EnableCredentialAsync(id, ActorId);
    }

    /// <summary>
    /// Provision an Aliro / Home Key credential onto the member's device. Access is not
    /// granted until this succeeds and the credential is accepted.
    /// </summary>
    [HttpPost("{id:guid}/provision-homekey")]
    public async Task<IActionResult> ProvisionHomeKey(Guid id)
    {
        if (string.IsNullOrEmpty(ActorId)) return Unauthorized();
        return await _accessService.ProvisionHomeKeyAsync(id, ActorId);
    }

    /// <summary>Set which doors a credential can open (or all doors).</summary>
    [HttpPut("{id:guid}/doors")]
    public async Task<IActionResult> SetDoors(Guid id, [FromBody] SetCredentialDoorsDto dto)
    {
        if (string.IsNullOrEmpty(ActorId)) return Unauthorized();
        return await _accessService.SetCredentialDoorsAsync(id, dto, ActorId);
    }

    /// <summary>Access-log entries for one credential.</summary>
    [HttpGet("{id:guid}/logs")]
    public Task<IActionResult> GetCredentialLogs(Guid id) => _accessService.GetCredentialLogsAsync(id);
}
