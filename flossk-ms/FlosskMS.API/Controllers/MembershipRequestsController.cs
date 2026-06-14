using FlosskMS.Business.DTOs;
using FlosskMS.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MembershipRequestsController(IMembershipRequestService membershipRequestService) : ControllerBase
{
    private readonly IMembershipRequestService _membershipRequestService = membershipRequestService;

    /// <summary>
    /// Create a new membership request (Public - no authentication required)
    /// </summary>
    /// <remarks>
    /// This endpoint allows unauthorized users to submit a membership request.
    /// Required files:
    /// - IdCardFile: ID card image/document
    /// - SignatureFile: Applicant signature (if 14 or older) or Guardian signature (if under 14)
    /// </remarks>
    [AllowAnonymous]
    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> CreateMembershipRequest(
        [FromForm] CreateMembershipRequestDto request,
        CancellationToken cancellationToken)
    {
        return await _membershipRequestService.CreateMembershipRequestAsync(request, cancellationToken);
    }

    /// <summary>
    /// Get all membership requests with optional filtering and pagination (Admin/Board Members only)
    /// </summary>
    [Authorize(Roles = "Admin,BoardMember")]
    [HttpGet]
    public async Task<IActionResult> GetMembershipRequests(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        return await _membershipRequestService.GetMembershipRequestsAsync(page, pageSize, status, cancellationToken);
    }

    /// <summary>
    /// Get a specific membership request by ID (Admin/Board Members only)
    /// </summary>
    [Authorize(Roles = "Admin,BoardMember")]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetMembershipRequestById(Guid id, CancellationToken cancellationToken)
    {
        return await _membershipRequestService.GetMembershipRequestByIdAsync(id, cancellationToken);
    }

    /// <summary>
    /// Approve a membership request (Board Members only)
    /// </summary>
    /// <remarks>
    /// Board member must upload their signature image (BoardMemberSignature) to approve the request.
    /// </remarks>
    [Authorize(Roles = "Admin,BoardMember")]
    [HttpPost("approve/{id:guid}")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ApproveMembershipRequest(
        Guid id,
        [FromForm] ApproveMembershipRequestDto request,
        CancellationToken cancellationToken)
    {
        return await _membershipRequestService.ApproveMembershipRequestAsync(id, request, User, cancellationToken);
    }

    /// <summary>
    /// Reject a membership request (Board Members only)
    /// </summary>
    [Authorize(Roles = "Admin, BoardMember")]
    [HttpPost("reject/{id:guid}")]
    public async Task<IActionResult> RejectMembershipRequest(
        Guid id,
        [FromBody] RejectMembershipRequestDto request,
        CancellationToken cancellationToken)
    {
        return await _membershipRequestService.RejectMembershipRequestAsync(id, request, User, cancellationToken);
    }

    /// <summary>
    /// Get all approved members (Public)
    /// </summary>
    [Authorize(Roles = "Admin, BoardMember")]
    [HttpGet("approved")]
    public async Task<IActionResult> GetApprovedMembers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        return await _membershipRequestService.GetApprovedMembersAsync(page, pageSize, cancellationToken);
    }

    /// <summary>
    /// Download membership contract PDF for an approved member (Admin/Board Members only)
    /// </summary>
    /// <remarks>
    /// Returns a PDF contract containing the member's submitted data, their signature,
    /// and the approving board member's name and signature.
    /// </remarks>
    [Authorize(Roles = "Admin, BoardMember")]
    [HttpGet("contract/{id:guid}")]
    [Produces("application/pdf")]
    public async Task<IActionResult> DownloadContract(Guid id, CancellationToken cancellationToken)
    {
        return await _membershipRequestService.DownloadContractAsync(id, cancellationToken);
    }

    /// <summary>
    /// Seed test membership requests (Development only - Admin required)
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPost("seed")]
    public async Task<IActionResult> SeedMembershipRequests(CancellationToken cancellationToken)
    {
        return await _membershipRequestService.SeedMembershipRequestsAsync(cancellationToken);
    }

    /// <summary>
    /// Delete all membership requests (Development only - Admin required)
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpDelete("delete-all")]
    public async Task<IActionResult> DeleteAllMembershipRequests(CancellationToken cancellationToken)
    {
        return await _membershipRequestService.DeleteAllMembershipRequestsAsync(cancellationToken);
    }
}
