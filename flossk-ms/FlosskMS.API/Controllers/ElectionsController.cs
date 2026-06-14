using FlosskMS.Business.DTOs;
using FlosskMS.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ElectionsController(IElectionService electionService) : ControllerBase
{
    private readonly IElectionService _electionService = electionService;

    /// <summary>
    /// Get all elections (available to all authenticated users).
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetElections()
    {
        return await _electionService.GetElectionsAsync();
    }

    /// <summary>
    /// Get a single election with full candidate details and vote counts.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetElection(Guid id)
    {
        return await _electionService.GetElectionByIdAsync(id, User);
    }

    /// <summary>
    /// Create a new election (Admin only).
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> CreateElection([FromBody] CreateElectionDto request)
    {
        return await _electionService.CreateElectionAsync(request, User);
    }

    /// <summary>
    /// Update an election's dates and candidates (Admin only).
    /// Only allowed when no votes have been cast yet.
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateElection(Guid id, [FromBody] UpdateElectionDto request)
    {
        return await _electionService.UpdateElectionAsync(id, request, User);
    }

    /// <summary>
    /// Delete an election (Admin only).
    /// Only allowed when no votes have been cast yet.
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteElection(Guid id)
    {
        return await _electionService.DeleteElectionAsync(id, User);
    }

    /// <summary>
    /// Cast a vote in an active election (any authenticated member, once per election).
    /// </summary>
    [HttpPost("{id:guid}/vote")]
    public async Task<IActionResult> CastVote(Guid id, [FromBody] CastVoteDto request)
    {
        return await _electionService.CastVoteAsync(id, request, User);
    }

}
