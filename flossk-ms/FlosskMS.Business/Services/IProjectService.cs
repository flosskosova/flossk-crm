using FlosskMS.Business.DTOs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FlosskMS.Business.Services;

public interface IProjectService
{
    // Project operations
    Task<IActionResult> CreateProjectAsync(CreateProjectDto request, ClaimsPrincipal currentUser);
    Task<IActionResult> GetProjectsAsync(string? status = null);
    Task<IActionResult> GetProjectsByUserIdAsync(string userId);
    Task<IActionResult> GetProjectByIdAsync(Guid id);
    Task<IActionResult> UpdateProjectAsync(Guid id, UpdateProjectDto request, ClaimsPrincipal currentUser);
    Task<IActionResult> UpdateProjectStatusAsync(Guid id, string status, ClaimsPrincipal currentUser);
    Task<IActionResult> DeleteProjectAsync(Guid id, ClaimsPrincipal currentUser);
    Task<IActionResult> AddModeratorAsync(Guid projectId, AssignModeratorDto request, ClaimsPrincipal currentUser);
    Task<IActionResult> RemoveModeratorAsync(Guid projectId, string moderatorUserId, ClaimsPrincipal currentUser);

    // Project team member operations
    Task<IActionResult> AddTeamMemberToProjectAsync(Guid projectId, AddTeamMemberDto request, ClaimsPrincipal currentUser);
    Task<IActionResult> RemoveTeamMemberFromProjectAsync(Guid projectId, string userId, ClaimsPrincipal currentUser);
    Task<IActionResult> RemoveTeamMembersFromProjectAsync(Guid projectId, RemoveTeamMembersDto request, ClaimsPrincipal currentUser);
    Task<IActionResult> GetProjectTeamMembersAsync(Guid projectId);
    Task<IActionResult> JoinProjectAsync(Guid projectId, ClaimsPrincipal currentUser);
    Task<IActionResult> LeaveProjectAsync(Guid projectId, ClaimsPrincipal currentUser);

    // Objective operations
    Task<IActionResult> CreateObjectiveAsync(CreateObjectiveDto request, ClaimsPrincipal currentUser);
    Task<IActionResult> GetObjectiveByIdAsync(Guid id);
    Task<IActionResult> GetObjectivesByProjectIdAsync(Guid projectId);
    Task<IActionResult> UpdateObjectiveAsync(Guid id, UpdateObjectiveDto request, ClaimsPrincipal currentUser);
    Task<IActionResult> UpdateObjectiveStatusAsync(Guid id, string status, ClaimsPrincipal currentUser);
    Task<IActionResult> DeleteObjectiveAsync(Guid id, ClaimsPrincipal currentUser);

    // Objective team member operations
    Task<IActionResult> AssignTeamMemberToObjectiveAsync(Guid objectiveId, AssignObjectiveTeamMemberDto request, ClaimsPrincipal currentUser);
    Task<IActionResult> RemoveTeamMemberFromObjectiveAsync(Guid objectiveId, string userId, ClaimsPrincipal currentUser);
    Task<IActionResult> GetObjectiveTeamMembersAsync(Guid objectiveId);
    Task<IActionResult> JoinObjectiveAsync(Guid objectiveId, ClaimsPrincipal currentUser);
    Task<IActionResult> LeaveObjectiveAsync(Guid objectiveId, ClaimsPrincipal currentUser);

    // Resource operations
    Task<IActionResult> CreateResourceAsync(CreateResourceDto request, ClaimsPrincipal currentUser);
    Task<IActionResult> GetResourceByIdAsync(Guid id);
    Task<IActionResult> GetResourcesByProjectIdAsync(Guid projectId);
    Task<IActionResult> GetResourcesByObjectiveIdAsync(Guid objectiveId);
    Task<IActionResult> UpdateResourceAsync(Guid id, UpdateResourceDto request, ClaimsPrincipal currentUser);
    Task<IActionResult> DeleteResourceAsync(Guid id, ClaimsPrincipal currentUser);

    // Banner operations
    Task<IActionResult> UploadProjectBannerAsync(Guid projectId, IFormFile bannerFile, ClaimsPrincipal currentUser);
    Task<IActionResult> DeleteProjectBannerAsync(Guid projectId, ClaimsPrincipal currentUser);

    // Seed and cleanup operations
    Task<IActionResult> SeedProjectsAsync(ClaimsPrincipal currentUser);
    Task<IActionResult> DeleteAllProjectsAsync();

    // Certificate eligibility
    Task<IActionResult> GetUsersWithCompletedObjectivesAsync(Guid projectId, ClaimsPrincipal currentUser, int page = 1, int pageSize = 20);
}
