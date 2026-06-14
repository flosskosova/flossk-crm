using FlosskMS.Business.DTOs;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FlosskMS.Business.Services;

public interface IMembershipRequestService
{
    /// <summary>
    /// Create a new membership request (for unauthorized users)
    /// </summary>
    Task<IActionResult> CreateMembershipRequestAsync(
        CreateMembershipRequestDto request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get all membership requests with optional filtering and pagination
    /// </summary>
    Task<IActionResult> GetMembershipRequestsAsync(
        int page = 1, 
        int pageSize = 10, 
        string? status = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get a specific membership request by ID
    /// </summary>
    Task<IActionResult> GetMembershipRequestByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Approve a membership request (Board members only)
    /// </summary>
    Task<IActionResult> ApproveMembershipRequestAsync(
        Guid id,
        ApproveMembershipRequestDto request,
        ClaimsPrincipal currentUser,
        CancellationToken cancellationToken = default);

    Task<IActionResult> ApproveMembershipRequestAsync(
        Guid id, 
        ApproveMembershipRequestDto request,
        string reviewerUserId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Reject a membership request (Board members only)
    /// </summary>
    Task<IActionResult> RejectMembershipRequestAsync(
        Guid id,
        RejectMembershipRequestDto request,
        ClaimsPrincipal currentUser,
        CancellationToken cancellationToken = default);

    Task<IActionResult> RejectMembershipRequestAsync(
        Guid id, 
        RejectMembershipRequestDto request,
        string reviewerUserId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get all approved members (Public)
    /// </summary>
    Task<IActionResult> GetApprovedMembersAsync(
        int page = 1,
        int pageSize = 10,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Download the membership contract PDF for an approved member
    /// </summary>
    Task<IActionResult> DownloadContractAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Seed test membership requests (Development only - Admin required)
    /// </summary>
    Task<IActionResult> SeedMembershipRequestsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete all membership requests (Development only - Admin required)
    /// </summary>
    Task<IActionResult> DeleteAllMembershipRequestsAsync(CancellationToken cancellationToken = default);
}
