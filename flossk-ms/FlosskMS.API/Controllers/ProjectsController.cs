using System.Security.Claims;
using FlosskMS.Business.DTOs;
using FlosskMS.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProjectsController(IProjectService projectService) : ControllerBase
{
    private readonly IProjectService _projectService = projectService;

    #region Project Endpoints

    /// <summary>
    /// Create a new project (Admin only)
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> CreateProject([FromBody] CreateProjectDto request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }
        return await _projectService.CreateProjectAsync(request, userId);
    }

    /// <summary>
    /// Get all projects with optional status filter
    /// </summary>
    /// <param name="status">Optional status filter: Upcoming, InProgress, or Completed</param>
    [HttpGet]
    public async Task<IActionResult> GetProjects([FromQuery] string? status = null)
    {
        return await _projectService.GetProjectsAsync(status);
    }

    /// <summary>
    /// Get projects by user ID (projects the user is a team member of)
    /// </summary>
    /// <param name="userId">User ID</param>
    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetProjectsByUserId(string userId)
    {
        return await _projectService.GetProjectsByUserIdAsync(userId);
    }

    /// <summary>
    /// Get a project by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetProject(Guid id)
    {
        return await _projectService.GetProjectByIdAsync(id);
    }

    /// <summary>
    /// Update a project (Admin or project moderator)
    /// </summary>
    [Authorize]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateProject(Guid id, [FromBody] UpdateProjectDto request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin");
        return await _projectService.UpdateProjectAsync(id, request, userId, isAdmin);
    }

    /// <summary>
    /// Delete a project (Admin or project moderator)
    /// </summary>
    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteProject(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin");
        return await _projectService.DeleteProjectAsync(id, userId, isAdmin);
    }

    /// <summary>
    /// Update project status (Admin or project moderator)
    /// </summary>
    /// <param name="id">Project ID</param>
    /// <param name="status">New status: Upcoming, InProgress, or Completed</param>
    [Authorize]
    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateProjectStatus(Guid id, [FromQuery] string status)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin");
        return await _projectService.UpdateProjectStatusAsync(id, status, userId, isAdmin);
    }

    /// <summary>
    /// Assign or remove a project moderator (Admin only).
    /// Send null ModeratorUserId to remove the current moderator.
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}/moderator")]
    public async Task<IActionResult> AssignModerator(Guid id, [FromBody] AssignModeratorDto request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();
        return await _projectService.AssignModeratorAsync(id, request, userId);
    }

    /// <summary>
    /// Upload or replace a project banner image (Admin or project moderator/creator)
    /// </summary>
    [Authorize]
    [HttpPost("{id:guid}/banner")]
    public async Task<IActionResult> UploadBanner(Guid id, IFormFile bannerFile)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();
        var isAdmin = User.IsInRole("Admin");
        return await _projectService.UploadProjectBannerAsync(id, bannerFile, userId, isAdmin);
    }

    /// <summary>
    /// Delete the project banner image (Admin or project moderator/creator)
    /// </summary>
    [Authorize]
    [HttpDelete("{id:guid}/banner")]
    public async Task<IActionResult> DeleteBanner(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();
        var isAdmin = User.IsInRole("Admin");
        return await _projectService.DeleteProjectBannerAsync(id, userId, isAdmin);
    }

    #endregion

    #region Project Team Member Endpoints

    /// <summary>
    /// Get all team members of a project
    /// </summary>
    [HttpGet("{projectId:guid}/team-members")]
    public async Task<IActionResult> GetProjectTeamMembers(Guid projectId)
    {
        return await _projectService.GetProjectTeamMembersAsync(projectId);
    }

    /// <summary>
    /// Add a team member to a project 
    /// </summary>
    [HttpPost("{projectId:guid}/team-members")]
    public async Task<IActionResult> AddTeamMemberToProject(Guid projectId, [FromBody] AddTeamMemberDto request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return await _projectService.AddTeamMemberToProjectAsync(projectId, request, userId);
    }

    /// <summary>
    /// Remove a team member from a project (Project creator only)
    /// </summary>
    [Authorize]
    [HttpDelete("{projectId:guid}/team-members/{userId}")]
    public async Task<IActionResult> RemoveTeamMemberFromProject(Guid projectId, string userId)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(currentUserId))
        {
            return Unauthorized();
        }
        return await _projectService.RemoveTeamMemberFromProjectAsync(projectId, userId, currentUserId);
    }

    /// <summary>
    /// Remove multiple team members from a project (Project creator only)
    /// </summary>
    [Authorize]
    [HttpPost("{projectId:guid}/team-members/remove")]
    public async Task<IActionResult> RemoveTeamMembersFromProject(Guid projectId, [FromBody] RemoveTeamMembersDto request)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(currentUserId))
        {
            return Unauthorized();
        }
        return await _projectService.RemoveTeamMembersFromProjectAsync(projectId, request, currentUserId);
    }

    /// <summary>
    /// Join a project (current user)
    /// </summary>
    [HttpPost("{projectId:guid}/join")]
    public async Task<IActionResult> JoinProject(Guid projectId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }
        return await _projectService.JoinProjectAsync(projectId, userId);
    }

    /// <summary>
    /// Leave a project (current user)
    /// </summary>
    [HttpPost("{projectId:guid}/leave")]
    public async Task<IActionResult> LeaveProject(Guid projectId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }
        return await _projectService.LeaveProjectAsync(projectId, userId);
    }

    #endregion

    #region Objective Endpoints

    /// <summary>
    /// Get all objectives of a project
    /// </summary>
    [HttpGet("{projectId:guid}/objectives")]
    public async Task<IActionResult> GetProjectObjectives(Guid projectId)
    {
        return await _projectService.GetObjectivesByProjectIdAsync(projectId);
    }

    /// <summary>
    /// Create a new objective (Admin or project moderator)
    /// </summary>
    [Authorize]
    [HttpPost("objectives")]
    public async Task<IActionResult> CreateObjective([FromBody] CreateObjectiveDto request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }
        var isAdmin = User.IsInRole("Admin");
        return await _projectService.CreateObjectiveAsync(request, userId, isAdmin);
    }

    /// <summary>
    /// Get an objective by ID
    /// </summary>
    [HttpGet("objectives/{id:guid}")]
    public async Task<IActionResult> GetObjective(Guid id)
    {
        return await _projectService.GetObjectiveByIdAsync(id);
    }

    /// <summary>
    /// Update an objective (Admin or project moderator)
    /// </summary>
    [Authorize]
    [HttpPut("objectives/{id:guid}")]
    public async Task<IActionResult> UpdateObjective(Guid id, [FromBody] UpdateObjectiveDto request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin");
        return await _projectService.UpdateObjectiveAsync(id, request, userId, isAdmin);
    }

    /// <summary>
    /// Delete an objective (Admin or project moderator)
    /// </summary>
    [Authorize]
    [HttpDelete("objectives/{id:guid}")]
    public async Task<IActionResult> DeleteObjective(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin");
        return await _projectService.DeleteObjectiveAsync(id, userId, isAdmin);
    }

    /// <summary>
    /// Update objective status (Admin or project moderator)
    /// </summary>
    /// <param name="id">Objective ID</param>
    /// <param name="status">New status: Todo, InProgress, or Completed</param>
    [Authorize]
    [HttpPatch("objectives/{id:guid}/status")]
    public async Task<IActionResult> UpdateObjectiveStatus(Guid id, [FromQuery] string status)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin");
        return await _projectService.UpdateObjectiveStatusAsync(id, status, userId, isAdmin);
    }

    #endregion

    #region Objective Team Member Endpoints

    /// <summary>
    /// Get all team members of an objective
    /// </summary>
    [HttpGet("objectives/{objectiveId:guid}/team-members")]
    public async Task<IActionResult> GetObjectiveTeamMembers(Guid objectiveId)
    {
        return await _projectService.GetObjectiveTeamMembersAsync(objectiveId);
    }

    /// <summary>
    /// Assign a team member to an objective (Project creator only)
    /// User must already be a team member of the project
    /// </summary>
    [Authorize]
    [HttpPost("objectives/{objectiveId:guid}/team-members")]
    public async Task<IActionResult> AssignTeamMemberToObjective(Guid objectiveId, [FromBody] AssignObjectiveTeamMemberDto request)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(currentUserId))
            return Unauthorized();
        return await _projectService.AssignTeamMemberToObjectiveAsync(objectiveId, request, currentUserId);
    }

    /// <summary>
    /// Remove a team member from an objective (Project creator only)
    /// </summary>
    [Authorize]
    [HttpDelete("objectives/{objectiveId:guid}/team-members/{userId}")]
    public async Task<IActionResult> RemoveTeamMemberFromObjective(Guid objectiveId, string userId)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(currentUserId))
            return Unauthorized();
        return await _projectService.RemoveTeamMemberFromObjectiveAsync(objectiveId, userId, currentUserId);
    }

    /// <summary>
    /// Join an objective (current user)
    /// User must already be a team member of the project
    /// </summary>
    [HttpPost("objectives/{objectiveId:guid}/join")]
    public async Task<IActionResult> JoinObjective(Guid objectiveId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }
        return await _projectService.JoinObjectiveAsync(objectiveId, userId);
    }

    /// <summary>
    /// Leave an objective (current user)
    /// </summary>
    [HttpPost("objectives/{objectiveId:guid}/leave")]
    public async Task<IActionResult> LeaveObjective(Guid objectiveId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }
        return await _projectService.LeaveObjectiveAsync(objectiveId, userId);
    }

    #endregion

    #region Resource Endpoints

    /// <summary>
    /// Get all resources of a project
    /// </summary>
    [HttpGet("{projectId:guid}/resources")]
    public async Task<IActionResult> GetProjectResources(Guid projectId)
    {
        return await _projectService.GetResourcesByProjectIdAsync(projectId);
    }

    /// <summary>
    /// Get all resources of an objective
    /// </summary>
    [HttpGet("objectives/{objectiveId:guid}/resources")]
    public async Task<IActionResult> GetObjectiveResources(Guid objectiveId)
    {
        return await _projectService.GetResourcesByObjectiveIdAsync(objectiveId);
    }

    /// <summary>
    /// Create a new resource (Admin only)
    /// </summary>
    [Authorize]
    [HttpPost("resources")]
    public async Task<IActionResult> CreateResource([FromBody] CreateResourceDto request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        return await _projectService.CreateResourceAsync(request, userId);
    }

    /// <summary>
    /// Get a resource by ID
    /// </summary>
    [HttpGet("resources/{id:guid}")]
    public async Task<IActionResult> GetResource(Guid id)
    {
        return await _projectService.GetResourceByIdAsync(id);
    }

    /// <summary>
    /// Update a resource (Admin only)
    /// </summary>
    [Authorize]
    [HttpPut("resources/{id:guid}")]
    public async Task<IActionResult> UpdateResource(Guid id, [FromBody] UpdateResourceDto request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return await _projectService.UpdateResourceAsync(id, request, userId);
    }

    /// <summary>
    /// Delete a resource (Admin only)
    /// </summary>
    [Authorize]
    [HttpDelete("resources/{id:guid}")]
    public async Task<IActionResult> DeleteResource(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return await _projectService.DeleteResourceAsync(id, userId);
    }

    #endregion

    #region Certificate Eligibility Endpoints

    /// <summary>
    /// Get all users who have participated in at least one completed objective of the project.
    /// These are the users eligible to receive a certificate for this project.
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpGet("{projectId:guid}/eligible-certificate-recipients")]
    public async Task<IActionResult> GetEligibleCertificateRecipients(
        Guid projectId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return await _projectService.GetUsersWithCompletedObjectivesAsync(projectId, currentUserId, page, pageSize);
    }

    #endregion

    #region Seed and Cleanup Endpoints

    /// <summary>
    /// Seed sample projects, objectives, and resources (Admin only)
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPost("seed")]
    public async Task<IActionResult> SeedProjects()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }
        return await _projectService.SeedProjectsAsync(userId);
    }

    /// <summary>
    /// Delete all projects and related data (Admin only)
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpDelete("all")]
    public async Task<IActionResult> DeleteAllProjects()
    {
        return await _projectService.DeleteAllProjectsAsync();
    }

    #endregion
}
