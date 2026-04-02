using AutoMapper;
using FlosskMS.Business.DomainEvents;
using FlosskMS.Business.DomainEvents.Projects.Events;
using FlosskMS.Business.DTOs;
using FlosskMS.Data;
using FlosskMS.Data.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FlosskMS.Business.Services;

public class ProjectService : IProjectService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IMapper _mapper;
    private readonly ILogger<ProjectService> _logger;
    private readonly IContributionService _contributionService;
    private readonly ILogService _logService;
    private readonly IFileService _fileService;
    private readonly IDomainEventDispatcher _domainEventDispatcher;

    public ProjectService(
        ApplicationDbContext dbContext,
        IMapper mapper,
        ILogger<ProjectService> logger,
        IContributionService contributionService,
        ILogService logService,
        IFileService fileService,
        IDomainEventDispatcher domainEventDispatcher)
    {
        _dbContext = dbContext;
        _mapper = mapper;
        _logger = logger;
        _contributionService = contributionService;
        _logService = logService;
        _fileService = fileService;
        _domainEventDispatcher = domainEventDispatcher;
    }

    #region Project Operations

    public async Task<IActionResult> CreateProjectAsync(CreateProjectDto request, string userId)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return new BadRequestObjectResult(new { Error = "Title is required." });
        }

        if (!Enum.TryParse<ProjectStatus>(request.Status, true, out _))
        {
            return new BadRequestObjectResult(new { Error = "Invalid status value. Valid values are: Upcoming, InProgress, Completed." });
        }

        if (request.EndDate < request.StartDate)
        {
            return new BadRequestObjectResult(new { Error = "End date must be after start date." });
        }

        var invalidTypes = request.Types
            .Where(t => !Enum.TryParse<ProjectType>(t, true, out _))
            .ToList();
        if (invalidTypes.Count > 0)
        {
            return new BadRequestObjectResult(new { Error = $"Invalid project type(s): {string.Join(", ", invalidTypes)}. Valid values are: Software, Hardware, Event." });
        }

        var user = await _dbContext.Users.FindAsync(userId);
        if (user == null)
        {
            return new NotFoundObjectResult(new { Error = "User not found." });
        }

        var project = _mapper.Map<Project>(request);
        project.Id = Guid.NewGuid();
        project.CreatedAt = DateTime.UtcNow;
        project.CreatedByUserId = userId;
        project.Types = ParseProjectTypes(request.Types);

        _dbContext.Projects.Add(project);
        await _dbContext.SaveChangesAsync();

        project.CreatedByUser = user;

        _logger.LogInformation("Project {ProjectId} created by user {UserId}", project.Id, userId);

        await _logService.CreateAsync(new CreateLogDto
        {
            EntityType = "Project",
            EntityId = project.Id.ToString(),
            EntityName = project.Title,
            Action = "Project created",
            UserId = userId
        });

        return new OkObjectResult(_mapper.Map<ProjectDto>(project));
    }

    public async Task<IActionResult> GetProjectsAsync(string? status = null)
    {
        var query = _dbContext.Projects
            .Include(p => p.CreatedByUser)
            .Include(p => p.Moderators)
                .ThenInclude(m => m.User)
            .Include(p => p.TeamMembers)
                .ThenInclude(tm => tm.User)
                    .ThenInclude(u => u.UploadedFiles)
            .Include(p => p.Objectives)
            .Include(p => p.Resources)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status))
        {
            if (!Enum.TryParse<ProjectStatus>(status, true, out var projectStatus))
            {
                var validStatuses = string.Join(", ", Enum.GetNames<ProjectStatus>());
                return new BadRequestObjectResult(new { Error = $"Invalid status '{status}'. Valid statuses are: {validStatuses}" });
            }
            query = query.Where(p => p.Status == projectStatus);
        }

        var projects = await query
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return new OkObjectResult(_mapper.Map<List<ProjectListDto>>(projects));
    }

    public async Task<IActionResult> GetProjectsByUserIdAsync(string userId)
    {
        var user = await _dbContext.Users.FindAsync(userId);
        if (user == null)
        {
            return new NotFoundObjectResult(new { Error = "User not found." });
        }

        var projects = await _dbContext.Projects
            .Include(p => p.CreatedByUser)
            .Include(p => p.Moderators)
                .ThenInclude(m => m.User)
            .Include(p => p.TeamMembers)
                .ThenInclude(tm => tm.User)
                    .ThenInclude(u => u.UploadedFiles)
            .Include(p => p.Objectives)
            .Include(p => p.Resources)
            .Where(p => p.TeamMembers.Any(tm => tm.UserId == userId))
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return new OkObjectResult(_mapper.Map<List<ProjectListDto>>(projects));
    }

    public async Task<IActionResult> GetProjectByIdAsync(Guid id)
    {
        var project = await _dbContext.Projects
            .Include(p => p.CreatedByUser)
            .Include(p => p.Moderators)
                .ThenInclude(m => m.User)
            .Include(p => p.TeamMembers)
                .ThenInclude(tm => tm.User)
                    .ThenInclude(u => u.UploadedFiles)
            .Include(p => p.Objectives)
                .ThenInclude(o => o.CreatedByUser)
            .Include(p => p.Objectives)
                .ThenInclude(o => o.TeamMembers)
                    .ThenInclude(tm => tm.User)
                        .ThenInclude(u => u.UploadedFiles)
            .Include(p => p.Objectives)
                .ThenInclude(o => o.Resources)
                    .ThenInclude(r => r.CreatedByUser)
            .Include(p => p.Objectives)
                .ThenInclude(o => o.Resources)
                    .ThenInclude(r => r.Files)
                        .ThenInclude(rf => rf.File)
            .Include(p => p.Resources)
                .ThenInclude(r => r.CreatedByUser)
            .Include(p => p.Resources)
                .ThenInclude(r => r.Files)
                    .ThenInclude(rf => rf.File).AsSplitQuery()
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null)
        {
            return new NotFoundObjectResult(new { Error = "Project not found." });
        }

        return new OkObjectResult(_mapper.Map<ProjectDto>(project));
    }

    public async Task<IActionResult> UpdateProjectAsync(Guid id, UpdateProjectDto request, string? userId = null, bool isAdmin = false)
    {
        var project = await _dbContext.Projects
            .Include(p => p.Objectives)
            .Include(p => p.Moderators)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (project == null)
        {
            return new NotFoundObjectResult(new { Error = "Project not found." });
        }

        // Authorization: must be admin or the project's moderator
        if (!isAdmin && !project.Moderators.Any(m => m.UserId == userId))
        {
            return new ObjectResult(new { Error = "Only an admin or the project moderator can edit this project." }) { StatusCode = 403 };
        }

        if (project.Status == ProjectStatus.Completed)
        {
            return new BadRequestObjectResult(new { Error = "Cannot edit a completed project." });
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return new BadRequestObjectResult(new { Error = "Title is required." });
        }

        if (!Enum.TryParse<ProjectStatus>(request.Status, true, out var newStatus))
        {
            return new BadRequestObjectResult(new { Error = "Invalid status value. Valid values are: Upcoming, InProgress, Completed." });
        }

        if (request.EndDate < request.StartDate)
        {
            return new BadRequestObjectResult(new { Error = "End date must be after start date." });
        }

        // Validate types
        var invalidTypes = request.Types
            .Where(t => !Enum.TryParse<ProjectType>(t, true, out _))
            .ToList();
        if (invalidTypes.Count > 0)
        {
            return new BadRequestObjectResult(new { Error = $"Invalid project type(s): {string.Join(", ", invalidTypes)}. Valid values are: Software, Hardware, Event." });
        }

        // Constraint: Cannot move from Upcoming to InProgress unless at least one objective is InProgress
        if (project.Status == ProjectStatus.Upcoming && newStatus == ProjectStatus.InProgress)
        {
            var hasInProgressObjective = project.Objectives.Any(o => o.Status == ObjectiveStatus.InProgress);
            if (!hasInProgressObjective)
            {
                return new BadRequestObjectResult(new { Error = "Cannot start project. At least one objective must be in progress." });
            }
        }

        // Constraint: Cannot move from InProgress to Completed unless all objectives are Completed
        if (project.Status == ProjectStatus.InProgress && newStatus == ProjectStatus.Completed)
        {
            var allObjectivesCompleted = project.Objectives.All(o => o.Status == ObjectiveStatus.Completed);
            if (!allObjectivesCompleted)
            {
                return new BadRequestObjectResult(new { Error = "Cannot complete project. All objectives must be completed first." });
            }
        }

        // Snapshot old values for field-level logging
        var oldTitle      = project.Title;
        var oldDescription = project.Description;
        var oldStatus     = project.Status.ToString();
        var oldStartDate  = project.StartDate;
        var oldEndDate    = project.EndDate;
        var oldTypesStr   = project.Types != ProjectType.None ? project.Types.ToString() : "(none)";

        _mapper.Map(request, project);
        project.Types = ParseProjectTypes(request.Types);
        project.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        // Auto-calculate contributions when project transitions to Completed
        if (newStatus == ProjectStatus.Completed)
        {
            await _contributionService.RecalculateProjectContributionsAsync(project.Id);
        }

        _logger.LogInformation("Project {ProjectId} updated", project.Id);

        // Write per-field audit logs
        if (userId != null)
        {
            var fieldChanges = new List<(string Field, string OldValue, string NewValue)>();

            if (!string.Equals(project.Title, oldTitle))
                fieldChanges.Add(("Title", oldTitle, project.Title));
            if (!string.Equals(project.Description, oldDescription))
                fieldChanges.Add(("Description",
                    string.IsNullOrWhiteSpace(oldDescription) ? "(empty)" : oldDescription,
                    string.IsNullOrWhiteSpace(project.Description) ? "(empty)" : project.Description));
            if (!string.Equals(project.Status.ToString(), oldStatus, StringComparison.OrdinalIgnoreCase))
                fieldChanges.Add(("Status", oldStatus, project.Status.ToString()));
            if (project.StartDate != oldStartDate)
                fieldChanges.Add(("Start Date", oldStartDate.ToString("MMM d, yyyy"), project.StartDate.ToString("MMM d, yyyy")));
            if (project.EndDate != oldEndDate)
                fieldChanges.Add(("End Date", oldEndDate.ToString("MMM d, yyyy"), project.EndDate.ToString("MMM d, yyyy")));
            var newTypesStr = project.Types != ProjectType.None ? project.Types.ToString() : "(none)";
            if (!string.Equals(newTypesStr, oldTypesStr))
                fieldChanges.Add(("Types", oldTypesStr, newTypesStr));

            if (fieldChanges.Count > 0)
            {
                foreach (var (field, oldValue, newValue) in fieldChanges)
                {
                    await _logService.CreateAsync(new CreateLogDto
                    {
                        EntityType = "Project",
                        EntityId = project.Id.ToString(),
                        EntityName = project.Title,
                        Action = "Field updated",
                        Detail = $"{field}: \"{oldValue}\" → \"{newValue}\"",
                        UserId = userId
                    });
                }
            }
            else
            {
                await _logService.CreateAsync(new CreateLogDto
                {
                    EntityType = "Project",
                    EntityId = project.Id.ToString(),
                    EntityName = project.Title,
                    Action = "Project updated",
                    UserId = userId
                });
            }
        }

        // Reload with related data
        return await GetProjectByIdAsync(id);
    }

    public async Task<IActionResult> DeleteProjectAsync(Guid id, string? userId = null, bool isAdmin = false)
    {
        var project = await _dbContext.Projects
            .Include(p => p.Moderators)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (project == null)
        {
            return new NotFoundObjectResult(new { Error = "Project not found." });
        }

        // Authorization: must be admin or the project's moderator
        if (!isAdmin && !project.Moderators.Any(m => m.UserId == userId))
        {
            return new ObjectResult(new { Error = "Only an admin or the project moderator can delete this project." }) { StatusCode = 403 };
        }

        if (project.Status == ProjectStatus.Completed)
        {
            return new BadRequestObjectResult(new { Error = "Cannot delete a completed project." });
        }

        var projectName = project.Title;
        _dbContext.Projects.Remove(project);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Project {ProjectId} deleted", id);

        if (userId != null)
        {
            await _logService.CreateAsync(new CreateLogDto
            {
                EntityType = "Project",
                EntityId = id.ToString(),
                EntityName = projectName,
                Action = "Project deleted",
                UserId = userId
            });
        }

        return new OkObjectResult(new { Message = "Project deleted successfully." });
    }

    public async Task<IActionResult> UpdateProjectStatusAsync(Guid id, string status, string? userId = null, bool isAdmin = false)
    {
        var project = await _dbContext.Projects
            .Include(p => p.Objectives)
            .Include(p => p.Moderators)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (project == null)
        {
            return new NotFoundObjectResult(new { Error = "Project not found." });
        }

        // Authorization: must be admin or the project's moderator
        if (!isAdmin && !project.Moderators.Any(m => m.UserId == userId))
        {
            return new ObjectResult(new { Error = "Only an admin or the project moderator can change the project status." }) { StatusCode = 403 };
        }

        if (!Enum.TryParse<ProjectStatus>(status, true, out var projectStatus))
        {
            var validStatuses = string.Join(", ", Enum.GetNames<ProjectStatus>());
            return new BadRequestObjectResult(new { Error = $"Invalid status '{status}'. Valid statuses are: {validStatuses}" });
        }

        // Constraint: Cannot move from Upcoming to InProgress unless at least one objective is InProgress
        if (project.Status == ProjectStatus.Upcoming && projectStatus == ProjectStatus.InProgress)
        {
            var hasInProgressObjective = project.Objectives.Any(o => o.Status == ObjectiveStatus.InProgress);
            if (!hasInProgressObjective)
            {
                return new BadRequestObjectResult(new { Error = "Cannot start project. At least one objective must be in progress." });
            }
        }

        var oldProjectStatus = project.Status.ToString();
        project.Status = projectStatus;
        project.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        // Auto-calculate contributions when project transitions to Completed
        if (projectStatus == ProjectStatus.Completed)
        {
            await _contributionService.RecalculateProjectContributionsAsync(project.Id);
        }

        _logger.LogInformation("Project {ProjectId} status updated to {Status}", id, status);

        if (userId != null)
        {
            await _logService.CreateAsync(new CreateLogDto
            {
                EntityType = "Project",
                EntityId = project.Id.ToString(),
                EntityName = project.Title,
                Action = "Status updated",
                Detail = $"\"{oldProjectStatus}\" → \"{projectStatus}\"",
                UserId = userId
            });
        }

        return new OkObjectResult(new { Message = $"Project status updated to {projectStatus}." });
    }

    public async Task<IActionResult> AddModeratorAsync(Guid projectId, AssignModeratorDto request, string actingUserId)
    {
        if (string.IsNullOrWhiteSpace(request.ModeratorUserId))
        {
            return new BadRequestObjectResult(new { Error = "ModeratorUserId is required." });
        }

        var project = await _dbContext.Projects
            .Include(p => p.Moderators)
            .FirstOrDefaultAsync(p => p.Id == projectId);
        if (project == null)
        {
            return new NotFoundObjectResult(new { Error = "Project not found." });
        }

        if (project.Moderators.Any(m => m.UserId == request.ModeratorUserId))
        {
            return new BadRequestObjectResult(new { Error = "User is already a moderator of this project." });
        }

        var user = await _dbContext.Users.FindAsync(request.ModeratorUserId);
        if (user == null)
        {
            return new NotFoundObjectResult(new { Error = "User not found." });
        }

        var moderator = new ProjectModerator
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            UserId = user.Id,
            AssignedAt = DateTime.UtcNow
        };

        _dbContext.ProjectModerators.Add(moderator);
        project.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("User {UserId} added as moderator of project {ProjectId}", user.Id, projectId);

        await _logService.CreateAsync(new CreateLogDto
        {
            EntityType = "Project",
            EntityId = project.Id.ToString(),
            EntityName = project.Title,
            Action = "Moderator added",
            Detail = $"{user.FirstName} {user.LastName}".Trim(),
            UserId = actingUserId
        });

        return new OkObjectResult(new { Message = $"{user.FirstName} {user.LastName} added as project moderator." });
    }

    public async Task<IActionResult> RemoveModeratorAsync(Guid projectId, string moderatorUserId, string actingUserId)
    {
        var project = await _dbContext.Projects
            .Include(p => p.Moderators)
                .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(p => p.Id == projectId);
        if (project == null)
        {
            return new NotFoundObjectResult(new { Error = "Project not found." });
        }

        var moderator = project.Moderators.FirstOrDefault(m => m.UserId == moderatorUserId);
        if (moderator == null)
        {
            return new NotFoundObjectResult(new { Error = "User is not a moderator of this project." });
        }

        var moderatorName = $"{moderator.User.FirstName} {moderator.User.LastName}".Trim();
        _dbContext.ProjectModerators.Remove(moderator);
        project.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("User {UserId} removed as moderator of project {ProjectId}", moderatorUserId, projectId);

        await _logService.CreateAsync(new CreateLogDto
        {
            EntityType = "Project",
            EntityId = project.Id.ToString(),
            EntityName = project.Title,
            Action = "Moderator removed",
            Detail = moderatorName,
            UserId = actingUserId
        });

        return new OkObjectResult(new { Message = $"{moderatorName} removed as project moderator." });
    }

    #endregion

    #region Project Team Member Operations

    public async Task<IActionResult> AddTeamMemberToProjectAsync(Guid projectId, AddTeamMemberDto request, string? addedByUserId = null)
    {
        var project = await _dbContext.Projects.FindAsync(projectId);
        if (project == null)
        {
            return new NotFoundObjectResult(new { Error = "Project not found." });
        }

        if (project.Status == ProjectStatus.Completed)
        {
            return new BadRequestObjectResult(new { Error = "Cannot assign members to a completed project." });
        }

        var user = await _dbContext.Users.FindAsync(request.UserId);
        if (user == null)
        {
            return new NotFoundObjectResult(new { Error = "User not found." });
        }

        var existingMember = await _dbContext.ProjectTeamMembers
            .FirstOrDefaultAsync(tm => tm.ProjectId == projectId && tm.UserId == request.UserId);

        if (existingMember != null)
        {
            return new BadRequestObjectResult(new { Error = "User is already a team member of this project." });
        }

        var teamMember = new ProjectTeamMember
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            UserId = request.UserId,
            Role = request.Role,
            JoinedAt = DateTime.UtcNow
        };

        _dbContext.ProjectTeamMembers.Add(teamMember);
        await _dbContext.SaveChangesAsync();

        teamMember.User = user;

        _logger.LogInformation("User {UserId} added to project {ProjectId}", request.UserId, projectId);

        string? addedByName = null;
        if (addedByUserId != null)
        {
            var addedByUser = await _dbContext.Users.FindAsync(addedByUserId);
            if (addedByUser != null)
                addedByName = $"{addedByUser.FirstName} {addedByUser.LastName}".Trim();
        }

        await _domainEventDispatcher.PublishAsync(
            new TeamMemberAddedToProjectEvent(
                request.UserId,
                project.Title,
                addedByName));

        if (addedByUserId != null)
        {
            await _logService.CreateAsync(new CreateLogDto
            {
                EntityType = "Project",
                EntityId = projectId.ToString(),
                EntityName = project.Title,
                Action = "Team member added",
                Detail = $"{user.FirstName} {user.LastName}",
                UserId = addedByUserId
            });
        }

        return new OkObjectResult(_mapper.Map<TeamMemberDto>(teamMember));
    }

    public async Task<IActionResult> RemoveTeamMemberFromProjectAsync(Guid projectId, string userId, string currentUserId)
    {
        // Check if the current user is the project creator, moderator, or admin (admin checked at controller level)
        var project = await _dbContext.Projects
            .Include(p => p.Moderators)
            .FirstOrDefaultAsync(p => p.Id == projectId);
        if (project == null)
        {
            return new NotFoundObjectResult(new { Error = "Project not found." });
        }

        if (project.CreatedByUserId != currentUserId && !project.Moderators.Any(m => m.UserId == currentUserId))
        {
            return new ForbidResult();
        }

        var teamMember = await _dbContext.ProjectTeamMembers
            .Include(tm => tm.User)
            .FirstOrDefaultAsync(tm => tm.ProjectId == projectId && tm.UserId == userId);

        if (teamMember == null)
        {
            return new NotFoundObjectResult(new { Error = "Team member not found in this project." });
        }

        var removedUserName = $"{teamMember.User?.FirstName} {teamMember.User?.LastName}".Trim();

        // Also remove user from all objectives in this project
        var objectiveTeamMembers = await _dbContext.ObjectiveTeamMembers
            .Include(otm => otm.Objective)
            .Where(otm => otm.Objective.ProjectId == projectId && otm.UserId == userId)
            .ToListAsync();

        _dbContext.ObjectiveTeamMembers.RemoveRange(objectiveTeamMembers);
        _dbContext.ProjectTeamMembers.Remove(teamMember);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("User {UserId} removed from project {ProjectId}", userId, projectId);

        await _logService.CreateAsync(new CreateLogDto
        {
            EntityType = "Project",
            EntityId = projectId.ToString(),
            EntityName = project.Title,
            Action = "Team member removed",
            Detail = string.IsNullOrWhiteSpace(removedUserName) ? null : removedUserName,
            UserId = currentUserId
        });

        return new OkObjectResult(new { Message = "Team member removed from project successfully." });
    }

    public async Task<IActionResult> RemoveTeamMembersFromProjectAsync(Guid projectId, RemoveTeamMembersDto request, string currentUserId)
    {
        // Validate input
        if (request.UserIds == null || request.UserIds.Count == 0)
        {
            return new BadRequestObjectResult(new { Error = "At least one user ID must be provided." });
        }

        // Check if the current user is the project creator or moderator (admin bypasses this at controller level)
        var project = await _dbContext.Projects
            .Include(p => p.Moderators)
            .FirstOrDefaultAsync(p => p.Id == projectId);
        if (project == null)
        {
            return new NotFoundObjectResult(new { Error = "Project not found." });
        }

        if (project.CreatedByUserId != currentUserId && !project.Moderators.Any(m => m.UserId == currentUserId))
        {
            return new ForbidResult();
        }

        // Get all team members to remove
        var teamMembers = await _dbContext.ProjectTeamMembers
            .Include(tm => tm.User)
            .Where(tm => tm.ProjectId == projectId && request.UserIds.Contains(tm.UserId))
            .ToListAsync();

        if (teamMembers.Count == 0)
        {
            return new NotFoundObjectResult(new { Error = "No matching team members found in this project." });
        }

        var userIdsFound = teamMembers.Select(tm => tm.UserId).ToList();
        var userIdsNotFound = request.UserIds.Except(userIdsFound).ToList();

        // Also remove users from all objectives in this project
        var objectiveTeamMembers = await _dbContext.ObjectiveTeamMembers
            .Include(otm => otm.Objective)
            .Where(otm => otm.Objective.ProjectId == projectId && request.UserIds.Contains(otm.UserId))
            .ToListAsync();

        _dbContext.ObjectiveTeamMembers.RemoveRange(objectiveTeamMembers);
        _dbContext.ProjectTeamMembers.RemoveRange(teamMembers);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Removed {Count} team members from project {ProjectId}", teamMembers.Count, projectId);

        var removedNames = teamMembers
            .Select(tm => $"{tm.User?.FirstName} {tm.User?.LastName}".Trim())
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .ToList();
        await _logService.CreateAsync(new CreateLogDto
        {
            EntityType = "Project",
            EntityId = projectId.ToString(),
            EntityName = project.Title,
            Action = "Team members removed",
            Detail = removedNames.Count > 0 ? string.Join(", ", removedNames) : null,
            UserId = currentUserId
        });

        var response = new
        {
            Message = $"{teamMembers.Count} team member(s) removed from project successfully.",
            RemovedUserIds = userIdsFound,
            NotFoundUserIds = userIdsNotFound
        };

        return new OkObjectResult(response);
    }

    public async Task<IActionResult> GetProjectTeamMembersAsync(Guid projectId)
    {
        var project = await _dbContext.Projects.FindAsync(projectId);
        if (project == null)
        {
            return new NotFoundObjectResult(new { Error = "Project not found." });
        }

        var teamMembers = await _dbContext.ProjectTeamMembers
            .Include(tm => tm.User)
            .Where(tm => tm.ProjectId == projectId)
            .ToListAsync();

        return new OkObjectResult(_mapper.Map<List<TeamMemberDto>>(teamMembers));
    }

    public async Task<IActionResult> JoinProjectAsync(Guid projectId, string userId)
    {
        var project = await _dbContext.Projects.FindAsync(projectId);
        if (project == null)
        {
            return new NotFoundObjectResult(new { Error = "Project not found." });
        }

        if (project.Status == ProjectStatus.Completed)
        {
            return new BadRequestObjectResult(new { Error = "Cannot join a completed project." });
        }

        var user = await _dbContext.Users.FindAsync(userId);
        if (user == null)
        {
            return new NotFoundObjectResult(new { Error = "User not found." });
        }

        var existingMember = await _dbContext.ProjectTeamMembers
            .FirstOrDefaultAsync(tm => tm.ProjectId == projectId && tm.UserId == userId);

        if (existingMember != null)
        {
            return new BadRequestObjectResult(new { Error = "You are already a member of this project." });
        }

        var teamMember = new ProjectTeamMember
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            UserId = userId,
            Role = "Member",
            JoinedAt = DateTime.UtcNow
        };

        _dbContext.ProjectTeamMembers.Add(teamMember);
        await _dbContext.SaveChangesAsync();

        teamMember.User = user;

        _logger.LogInformation("User {UserId} joined project {ProjectId}", userId, projectId);

        await _logService.CreateAsync(new CreateLogDto
        {
            EntityType = "Project",
            EntityId = projectId.ToString(),
            EntityName = project.Title,
            Action = "Member joined",
            Detail = $"{user.FirstName} {user.LastName}",
            UserId = userId
        });

        return new OkObjectResult(_mapper.Map<TeamMemberDto>(teamMember));
    }

    public async Task<IActionResult> LeaveProjectAsync(Guid projectId, string userId)
    {
        var project = await _dbContext.Projects.FindAsync(projectId);
        if (project == null)
        {
            return new NotFoundObjectResult(new { Error = "Project not found." });
        }

        if (project.Status == ProjectStatus.Completed)
        {
            return new BadRequestObjectResult(new { Error = "Cannot leave a completed project." });
        }

        var teamMember = await _dbContext.ProjectTeamMembers
            .FirstOrDefaultAsync(tm => tm.ProjectId == projectId && tm.UserId == userId);

        if (teamMember == null)
        {
            return new NotFoundObjectResult(new { Error = "You are not a member of this project." });
        }

        // Also remove user from all objectives in this project
        var objectiveTeamMembers = await _dbContext.ObjectiveTeamMembers
            .Include(otm => otm.Objective)
            .Where(otm => otm.Objective.ProjectId == projectId && otm.UserId == userId)
            .ToListAsync();

        _dbContext.ObjectiveTeamMembers.RemoveRange(objectiveTeamMembers);
        _dbContext.ProjectTeamMembers.Remove(teamMember);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("User {UserId} left project {ProjectId}", userId, projectId);

        await _logService.CreateAsync(new CreateLogDto
        {
            EntityType = "Project",
            EntityId = projectId.ToString(),
            EntityName = project.Title,
            Action = "Member left",
            UserId = userId
        });

        return new OkObjectResult(new { Message = "You have left the project successfully." });
    }

    #endregion

    #region Objective Operations

    public async Task<IActionResult> CreateObjectiveAsync(CreateObjectiveDto request, string userId, bool isAdmin = false)
    {
        var project = await _dbContext.Projects
            .Include(p => p.Moderators)
            .FirstOrDefaultAsync(p => p.Id == request.ProjectId);
        if (project == null)
        {
            return new NotFoundObjectResult(new { Error = "Project not found." });
        }

        // Authorization: must be admin or the project's moderator
        if (!isAdmin && !project.Moderators.Any(m => m.UserId == userId))
        {
            return new ObjectResult(new { Error = "Only an admin or the project moderator can add objectives." }) { StatusCode = 403 };
        }

        if (project.Status == ProjectStatus.Completed)
        {
            return new BadRequestObjectResult(new { Error = "Cannot add objectives to a completed project." });
        }

        var user = await _dbContext.Users.FindAsync(userId);
        if (user == null)
        {
            return new NotFoundObjectResult(new { Error = "User not found." });
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return new BadRequestObjectResult(new { Error = "Title is required." });
        }

        if (!Enum.TryParse<ObjectiveStatus>(request.Status, true, out _))
        {
            return new BadRequestObjectResult(new { Error = "Invalid status value. Valid values are: Todo, InProgress, Completed." });
        }

        var objective = _mapper.Map<Objective>(request);
        objective.Id = Guid.NewGuid();
        objective.CreatedAt = DateTime.UtcNow;
        objective.CreatedByUserId = userId;

        _dbContext.Objectives.Add(objective);
        await _dbContext.SaveChangesAsync();

        // Set user for mapping
        objective.CreatedByUser = user;

        _logger.LogInformation("Objective {ObjectiveId} created for project {ProjectId} by user {UserId}", objective.Id, request.ProjectId, userId);

        await _logService.CreateAsync(new CreateLogDto
        {
            EntityType = "Project",
            EntityId = project.Id.ToString(),
            EntityName = project.Title,
            Action = "Objective created",
            Detail = objective.Title,
            UserId = userId
        });

        return new OkObjectResult(_mapper.Map<ObjectiveDto>(objective));
    }

    public async Task<IActionResult> GetObjectiveByIdAsync(Guid id)
    {
        var objective = await _dbContext.Objectives
            .Include(o => o.CreatedByUser)
            .Include(o => o.TeamMembers)
                .ThenInclude(tm => tm.User)
            .Include(o => o.Resources)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (objective == null)
        {
            return new NotFoundObjectResult(new { Error = "Objective not found." });
        }

        return new OkObjectResult(_mapper.Map<ObjectiveDto>(objective));
    }

    public async Task<IActionResult> GetObjectivesByProjectIdAsync(Guid projectId)
    {
        var project = await _dbContext.Projects.FindAsync(projectId);
        if (project == null)
        {
            return new NotFoundObjectResult(new { Error = "Project not found." });
        }

        var objectives = await _dbContext.Objectives
            .Include(o => o.CreatedByUser)
            .Include(o => o.TeamMembers)
                .ThenInclude(tm => tm.User)
            .Include(o => o.Resources)
            .Where(o => o.ProjectId == projectId)
            .OrderBy(o => o.CreatedAt)
            .ToListAsync();

        return new OkObjectResult(_mapper.Map<List<ObjectiveDto>>(objectives));
    }

    public async Task<IActionResult> UpdateObjectiveAsync(Guid id, UpdateObjectiveDto request, string? userId = null, bool isAdmin = false)
    {
        var objective = await _dbContext.Objectives
            .Include(o => o.Project)
                .ThenInclude(p => p!.Moderators)
            .FirstOrDefaultAsync(o => o.Id == id);
        if (objective == null)
        {
            return new NotFoundObjectResult(new { Error = "Objective not found." });
        }

        // Authorization: must be admin or the project's moderator
        if (!isAdmin && !(objective.Project?.Moderators.Any(m => m.UserId == userId) ?? false))
        {
            return new ObjectResult(new { Error = "Only an admin or the project moderator can edit objectives." }) { StatusCode = 403 };
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return new BadRequestObjectResult(new { Error = "Title is required." });
        }

        if (!Enum.TryParse<ObjectiveStatus>(request.Status, true, out _))
        {
            return new BadRequestObjectResult(new { Error = "Invalid status value. Valid values are: Todo, InProgress, Completed." });
        }

        // Snapshot old values for field-level logging
        var oldObjTitle       = objective.Title;
        var oldObjDescription = objective.Description;
        var oldObjStatus      = objective.Status.ToString();

        _mapper.Map(request, objective);
        objective.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Objective {ObjectiveId} updated", objective.Id);

        if (userId != null)
        {
            var objFieldChanges = new List<(string Field, string OldValue, string NewValue)>();
            if (!string.Equals(objective.Title, oldObjTitle))
                objFieldChanges.Add(("Title", oldObjTitle, objective.Title));
            if (!string.Equals(objective.Description, oldObjDescription))
                objFieldChanges.Add(("Description",
                    string.IsNullOrWhiteSpace(oldObjDescription) ? "(empty)" : oldObjDescription,
                    string.IsNullOrWhiteSpace(objective.Description) ? "(empty)" : objective.Description));
            if (!string.Equals(objective.Status.ToString(), oldObjStatus, StringComparison.OrdinalIgnoreCase))
                objFieldChanges.Add(("Status", oldObjStatus, objective.Status.ToString()));

            if (objFieldChanges.Count > 0)
            {
                foreach (var (field, oldValue, newValue) in objFieldChanges)
                {
                    await _logService.CreateAsync(new CreateLogDto
                    {
                        EntityType = "Project",
                        EntityId = objective.ProjectId.ToString(),
                        EntityName = objective.Project?.Title,
                        Action = "Field updated",
                        Detail = $"{field}: \"{oldValue}\" → \"{newValue}\" (Objective: {objective.Title})",
                        UserId = userId
                    });
                }
            }
            else
            {
                await _logService.CreateAsync(new CreateLogDto
                {
                    EntityType = "Project",
                    EntityId = objective.ProjectId.ToString(),
                    EntityName = objective.Project?.Title,
                    Action = "Objective updated",
                    Detail = objective.Title,
                    UserId = userId
                });
            }
        }

        return await GetObjectiveByIdAsync(id);
    }

    public async Task<IActionResult> DeleteObjectiveAsync(Guid id, string? userId = null, bool isAdmin = false)
    {
        var objective = await _dbContext.Objectives
            .Include(o => o.Project)
                .ThenInclude(p => p!.Moderators)
            .FirstOrDefaultAsync(o => o.Id == id);
        if (objective == null)
        {
            return new NotFoundObjectResult(new { Error = "Objective not found." });
        }

        // Authorization: must be admin or the project's moderator
        if (!isAdmin && !(objective.Project?.Moderators.Any(m => m.UserId == userId) ?? false))
        {
            return new ObjectResult(new { Error = "Only an admin or the project moderator can delete objectives." }) { StatusCode = 403 };
        }

        var objectiveTitle = objective.Title;
        var projectId = objective.ProjectId;
        var projectName = objective.Project?.Title;
        _dbContext.Objectives.Remove(objective);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Objective {ObjectiveId} deleted", id);

        if (userId != null)
        {
            await _logService.CreateAsync(new CreateLogDto
            {
                EntityType = "Project",
                EntityId = projectId.ToString(),
                EntityName = projectName,
                Action = "Objective deleted",
                Detail = objectiveTitle,
                UserId = userId
            });
        }

        return new OkObjectResult(new { Message = "Objective deleted successfully." });
    }

    public async Task<IActionResult> UpdateObjectiveStatusAsync(Guid id, string status, string? userId = null, bool isAdmin = false)
    {
        var objective = await _dbContext.Objectives
            .Include(o => o.Project)
                .ThenInclude(p => p!.Moderators)
            .FirstOrDefaultAsync(o => o.Id == id);
        if (objective == null)
        {
            return new NotFoundObjectResult(new { Error = "Objective not found." });
        }

        // Authorization: must be admin or the project's moderator
        if (!isAdmin && !(objective.Project?.Moderators.Any(m => m.UserId == userId) ?? false))
        {
            return new ObjectResult(new { Error = "Only an admin or the project moderator can update objective status." }) { StatusCode = 403 };
        }

        if (!Enum.TryParse<ObjectiveStatus>(status, true, out var objectiveStatus))
        {
            var validStatuses = string.Join(", ", Enum.GetNames<ObjectiveStatus>());
            return new BadRequestObjectResult(new { Error = $"Invalid status '{status}'. Valid statuses are: {validStatuses}" });
        }

        var oldObjectiveStatus = objective.Status.ToString();
        objective.Status = objectiveStatus;
        objective.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Objective {ObjectiveId} status updated to {Status}", id, status);

        if (userId != null)
        {
            await _logService.CreateAsync(new CreateLogDto
            {
                EntityType = "Project",
                EntityId = objective.ProjectId.ToString(),
                EntityName = objective.Project?.Title,
                Action = "Objective status updated",
                Detail = $"{objective.Title}: \"{oldObjectiveStatus}\" → \"{objectiveStatus}\"",
                UserId = userId
            });
        }

        return new OkObjectResult(new { Message = $"Objective status updated to {objectiveStatus}." });
    }

    #endregion

    #region Objective Team Member Operations

    public async Task<IActionResult> AssignTeamMemberToObjectiveAsync(Guid objectiveId, AssignObjectiveTeamMemberDto request, string currentUserId)
    {
        var objective = await _dbContext.Objectives
            .Include(o => o.Project)
                .ThenInclude(p => p.Moderators)
            .FirstOrDefaultAsync(o => o.Id == objectiveId);
        if (objective == null)
        {
            return new NotFoundObjectResult(new { Error = "Objective not found." });
        }

        // Check if current user is the project creator or moderator
        if (objective.Project.CreatedByUserId != currentUserId && !objective.Project.Moderators.Any(m => m.UserId == currentUserId))
        {
            return new ObjectResult(new { Error = "Only the project creator or moderator can assign members to objectives." }) { StatusCode = 401 };
        }

        // Prevent assigning members to completed objectives
        if (objective.Status == ObjectiveStatus.Completed)
        {
            return new BadRequestObjectResult(new { Error = "Cannot assign team members to a completed objective." });
        }

        var user = await _dbContext.Users.FindAsync(request.UserId);
        if (user == null)
        {
            return new NotFoundObjectResult(new { Error = "User not found." });
        }

        // Check if user is a member of the project, if not, add them automatically
        var isProjectMember = await _dbContext.ProjectTeamMembers
            .AnyAsync(tm => tm.ProjectId == objective.ProjectId && tm.UserId == request.UserId);

        if (!isProjectMember)
        {
            var projectTeamMember = new ProjectTeamMember
            {
                Id = Guid.NewGuid(),
                ProjectId = objective.ProjectId,
                UserId = request.UserId,
                Role = "Member",
                JoinedAt = DateTime.UtcNow
            };
            _dbContext.ProjectTeamMembers.Add(projectTeamMember);
            _logger.LogInformation("User {UserId} automatically added to project {ProjectId} when assigned to objective", request.UserId, objective.ProjectId);
        }

        var existingMember = await _dbContext.ObjectiveTeamMembers
            .FirstOrDefaultAsync(tm => tm.ObjectiveId == objectiveId && tm.UserId == request.UserId);

        if (existingMember != null)
        {
            return new BadRequestObjectResult(new { Error = "User is already assigned to this objective." });
        }

        var teamMember = new ObjectiveTeamMember
        {
            Id = Guid.NewGuid(),
            ObjectiveId = objectiveId,
            UserId = request.UserId,
            AssignedAt = DateTime.UtcNow
        };

        _dbContext.ObjectiveTeamMembers.Add(teamMember);
        await _dbContext.SaveChangesAsync();

        teamMember.User = user;

        _logger.LogInformation("User {UserId} assigned to objective {ObjectiveId}", request.UserId, objectiveId);

        var assignedByUser = await _dbContext.Users.FindAsync(currentUserId);
        var assignedByName = assignedByUser != null
            ? $"{assignedByUser.FirstName} {assignedByUser.LastName}".Trim()
            : null;

        await _domainEventDispatcher.PublishAsync(
            new TeamMemberAssignedToObjectiveEvent(
                request.UserId,
                objective.Title,
                objective.Project?.Title ?? "Unknown",
                assignedByName));

        await _logService.CreateAsync(new CreateLogDto
        {
            EntityType = "Project",
            EntityId = objective.ProjectId.ToString(),
            EntityName = objective.Project?.Title,
            Action = "Member assigned to objective",
            Detail = $"{user.FirstName} {user.LastName} → {objective.Title}",
            UserId = currentUserId
        });

        return new OkObjectResult(_mapper.Map<TeamMemberDto>(teamMember));
    }

    public async Task<IActionResult> RemoveTeamMemberFromObjectiveAsync(Guid objectiveId, string userId, string currentUserId)
    {
        var objective = await _dbContext.Objectives
            .Include(o => o.Project)
                .ThenInclude(p => p.Moderators)
            .FirstOrDefaultAsync(o => o.Id == objectiveId);
        if (objective == null)
        {
            return new NotFoundObjectResult(new { Error = "Objective not found." });
        }

        // Check if current user is the project creator or moderator
        if (objective.Project.CreatedByUserId != currentUserId && !objective.Project.Moderators.Any(m => m.UserId == currentUserId))
        {
            return new ObjectResult(new { Error = "Only the project creator or moderator can remove members from objectives." }) { StatusCode = 401 };
        }

        // Prevent removing members from completed objectives
        if (objective.Status == ObjectiveStatus.Completed)
        {
            return new BadRequestObjectResult(new { Error = "Cannot remove team members from a completed objective." });
        }

        var teamMember = await _dbContext.ObjectiveTeamMembers
            .FirstOrDefaultAsync(tm => tm.ObjectiveId == objectiveId && tm.UserId == userId);

        if (teamMember == null)
        {
            return new NotFoundObjectResult(new { Error = "Team member not found in this objective." });
        }

        _dbContext.ObjectiveTeamMembers.Remove(teamMember);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("User {UserId} removed from objective {ObjectiveId}", userId, objectiveId);

        await _logService.CreateAsync(new CreateLogDto
        {
            EntityType = "Project",
            EntityId = objective.ProjectId.ToString(),
            EntityName = objective.Project?.Title,
            Action = "Member removed from objective",
            Detail = objective.Title,
            UserId = currentUserId
        });

        return new OkObjectResult(new { Message = "Team member removed from objective successfully." });
    }

    public async Task<IActionResult> GetObjectiveTeamMembersAsync(Guid objectiveId)
    {
        var objective = await _dbContext.Objectives.FindAsync(objectiveId);
        if (objective == null)
        {
            return new NotFoundObjectResult(new { Error = "Objective not found." });
        }

        var teamMembers = await _dbContext.ObjectiveTeamMembers
            .Include(tm => tm.User)
            .Where(tm => tm.ObjectiveId == objectiveId)
            .ToListAsync();

        return new OkObjectResult(_mapper.Map<List<TeamMemberDto>>(teamMembers));
    }

    public async Task<IActionResult> JoinObjectiveAsync(Guid objectiveId, string userId)
    {
        var objective = await _dbContext.Objectives
            .Include(o => o.Project)
            .FirstOrDefaultAsync(o => o.Id == objectiveId);

        if (objective == null)
        {
            return new NotFoundObjectResult(new { Error = "Objective not found." });
        }

        if (objective.Status == ObjectiveStatus.Completed)
        {
            return new BadRequestObjectResult(new { Error = "Cannot join a completed objective." });
        }

        var user = await _dbContext.Users.FindAsync(userId);
        if (user == null)
        {
            return new NotFoundObjectResult(new { Error = "User not found." });
        }

        // Check if user is a member of the project, if not, add them automatically
        var isProjectMember = await _dbContext.ProjectTeamMembers
            .AnyAsync(tm => tm.ProjectId == objective.ProjectId && tm.UserId == userId);

        if (!isProjectMember)
        {
            var projectTeamMember = new ProjectTeamMember
            {
                Id = Guid.NewGuid(),
                ProjectId = objective.ProjectId,
                UserId = userId,
                Role = "Member",
                JoinedAt = DateTime.UtcNow
            };
            _dbContext.ProjectTeamMembers.Add(projectTeamMember);
            _logger.LogInformation("User {UserId} automatically added to project {ProjectId} when joining objective", userId, objective.ProjectId);
        }

        var existingMember = await _dbContext.ObjectiveTeamMembers
            .FirstOrDefaultAsync(tm => tm.ObjectiveId == objectiveId && tm.UserId == userId);

        if (existingMember != null)
        {
            return new BadRequestObjectResult(new { Error = "You are already a member of this objective." });
        }

        var teamMember = new ObjectiveTeamMember
        {
            Id = Guid.NewGuid(),
            ObjectiveId = objectiveId,
            UserId = userId,
            AssignedAt = DateTime.UtcNow
        };

        _dbContext.ObjectiveTeamMembers.Add(teamMember);
        await _dbContext.SaveChangesAsync();

        teamMember.User = user;

        _logger.LogInformation("User {UserId} joined objective {ObjectiveId}", userId, objectiveId);

        await _logService.CreateAsync(new CreateLogDto
        {
            EntityType = "Project",
            EntityId = objective.ProjectId.ToString(),
            EntityName = objective.Project?.Title,
            Action = "Objective member joined",
            Detail = $"{user.FirstName} {user.LastName} → {objective.Title}",
            UserId = userId
        });

        return new OkObjectResult(_mapper.Map<TeamMemberDto>(teamMember));
    }

    public async Task<IActionResult> LeaveObjectiveAsync(Guid objectiveId, string userId)
    {
        var objective = await _dbContext.Objectives
            .Include(o => o.Project)
            .FirstOrDefaultAsync(o => o.Id == objectiveId);
        if (objective == null)
        {
            return new NotFoundObjectResult(new { Error = "Objective not found." });
        }

        if (objective.Status == ObjectiveStatus.Completed)
        {
            return new BadRequestObjectResult(new { Error = "Cannot leave a completed objective." });
        }

        var teamMember = await _dbContext.ObjectiveTeamMembers
            .FirstOrDefaultAsync(tm => tm.ObjectiveId == objectiveId && tm.UserId == userId);

        if (teamMember == null)
        {
            return new NotFoundObjectResult(new { Error = "You are not a member of this objective." });
        }

        _dbContext.ObjectiveTeamMembers.Remove(teamMember);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("User {UserId} left objective {ObjectiveId}", userId, objectiveId);

        await _logService.CreateAsync(new CreateLogDto
        {
            EntityType = "Project",
            EntityId = objective.ProjectId.ToString(),
            EntityName = objective.Project?.Title,
            Action = "Objective member left",
            Detail = objective.Title,
            UserId = userId
        });

        return new OkObjectResult(new { Message = "You have left the objective successfully." });
    }

    #endregion

    #region Resource Operations

    public async Task<IActionResult> CreateResourceAsync(CreateResourceDto request, string userId)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return new BadRequestObjectResult(new { Error = "Title is required." });
        }

        // Resource must have at least a URL or files
        var hasUrl = request.Urls?.Count > 0;
        var hasFiles = request.FileIds != null && request.FileIds.Count > 0;
        
        if (!hasUrl && !hasFiles)
        {
            return new BadRequestObjectResult(new { Error = "Resource must have at least a URL or attached files." });
        }

        if (!Enum.TryParse<ResourceType>(request.Type, true, out _))
        {
            return new BadRequestObjectResult(new { Error = "Invalid resource type. Valid values are: Documentation, Tutorial, Tool, Reference, Other." });
        }

        if (request.ProjectId == null && request.ObjectiveId == null)
        {
            return new BadRequestObjectResult(new { Error = "Resource must belong to either a project or an objective." });
        }

        if (request.ProjectId != null && request.ObjectiveId != null)
        {
            return new BadRequestObjectResult(new { Error = "Resource cannot belong to both a project and an objective." });
        }

        Project? logProject = null;

        if (request.ProjectId != null)
        {
            var project = await _dbContext.Projects.FindAsync(request.ProjectId);
            if (project == null)
            {
                return new NotFoundObjectResult(new { Error = "Project not found." });
            }

            if (project.Status == ProjectStatus.Completed)
            {
                return new BadRequestObjectResult(new { Error = "Cannot add resources to a completed project." });
            }
            logProject = project;
        }

        if (request.ObjectiveId != null)
        {
            var objective = await _dbContext.Objectives
                .Include(o => o.Project)
                .FirstOrDefaultAsync(o => o.Id == request.ObjectiveId);
            if (objective == null)
            {
                return new NotFoundObjectResult(new { Error = "Objective not found." });
            }
            logProject = objective.Project;
        }

        // Validate file IDs if provided
        if (hasFiles)
        {
            var existingFileIds = await _dbContext.UploadedFiles
                .Where(f => request.FileIds!.Contains(f.Id))
                .Select(f => f.Id)
                .ToListAsync();
            
            var missingFileIds = request.FileIds!.Except(existingFileIds).ToList();
            if (missingFileIds.Count > 0)
            {
                return new NotFoundObjectResult(new { Error = $"Files not found: {string.Join(", ", missingFileIds)}" });
            }
        }

        var resource = _mapper.Map<Resource>(request);
        resource.Id = Guid.NewGuid();
        resource.CreatedAt = DateTime.UtcNow;
        resource.CreatedByUserId = userId;

        _dbContext.Resources.Add(resource);

        // Add file associations
        if (hasFiles)
        {
            foreach (var fileId in request.FileIds!)
            {
                _dbContext.ResourceFiles.Add(new ResourceFile
                {
                    Id = Guid.NewGuid(),
                    ResourceId = resource.Id,
                    FileId = fileId,
                    AddedAt = DateTime.UtcNow
                });
            }
        }

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Resource {ResourceId} created with {FileCount} files", resource.Id, request.FileIds?.Count ?? 0);

        if (logProject != null)
        {
            await _logService.CreateAsync(new CreateLogDto
            {
                EntityType = "Project",
                EntityId = logProject.Id.ToString(),
                EntityName = logProject.Title,
                Action = "Resource added",
                Detail = resource.Title,
                UserId = userId
            });
        }

        // Reload with files for response
        return await GetResourceByIdAsync(resource.Id);
    }

    public async Task<IActionResult> GetResourceByIdAsync(Guid id)
    {
        var resource = await _dbContext.Resources
            .Include(r => r.Files)
                .ThenInclude(rf => rf.File)
            .Include(r => r.CreatedByUser)
            .FirstOrDefaultAsync(r => r.Id == id);
        if (resource == null)
        {
            return new NotFoundObjectResult(new { Error = "Resource not found." });
        }

        return new OkObjectResult(_mapper.Map<ResourceDto>(resource));
    }

    public async Task<IActionResult> GetResourcesByProjectIdAsync(Guid projectId)
    {
        var project = await _dbContext.Projects.FindAsync(projectId);
        if (project == null)
        {
            return new NotFoundObjectResult(new { Error = "Project not found." });
        }

        var resources = await _dbContext.Resources
            .Include(r => r.Files)
                .ThenInclude(rf => rf.File)
            .Include(r => r.CreatedByUser)
            .Where(r => r.ProjectId == projectId)
            .OrderBy(r => r.CreatedAt)
            .ToListAsync();

        return new OkObjectResult(_mapper.Map<List<ResourceDto>>(resources));
    }

    public async Task<IActionResult> GetResourcesByObjectiveIdAsync(Guid objectiveId)
    {
        var objective = await _dbContext.Objectives.FindAsync(objectiveId);
        if (objective == null)
        {
            return new NotFoundObjectResult(new { Error = "Objective not found." });
        }

        var resources = await _dbContext.Resources
            .Include(r => r.Files)
                .ThenInclude(rf => rf.File)
            .Include(r => r.CreatedByUser)
            .Where(r => r.ObjectiveId == objectiveId)
            .OrderBy(r => r.CreatedAt)
            .ToListAsync();

        return new OkObjectResult(_mapper.Map<List<ResourceDto>>(resources));
    }

    public async Task<IActionResult> UpdateResourceAsync(Guid id, UpdateResourceDto request, string? userId = null)
    {
        var resource = await _dbContext.Resources
            .Include(r => r.Files)
            .FirstOrDefaultAsync(r => r.Id == id);
        if (resource == null)
        {
            return new NotFoundObjectResult(new { Error = "Resource not found." });
        }

        // Block edits when the parent project is completed
        if (resource.ProjectId != null)
        {
            var project = await _dbContext.Projects.FindAsync(resource.ProjectId);
            if (project != null && project.Status == ProjectStatus.Completed)
            {
                return new BadRequestObjectResult(new { Error = "Cannot edit a resource that belongs to a completed project." });
            }
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return new BadRequestObjectResult(new { Error = "Title is required." });
        }

        // Check if after update the resource will have at least URL or files
        var willHaveUrl = request.Urls?.Count > 0;
        var currentFileCount = resource.Files.Count;
        var filesToAdd = request.FileIdsToAdd?.Count ?? 0;
        var filesToRemove = request.FileIdsToRemove?.Count ?? 0;
        var willHaveFiles = (currentFileCount + filesToAdd - filesToRemove) > 0;
        
        if (!willHaveUrl && !willHaveFiles)
        {
            return new BadRequestObjectResult(new { Error = "Resource must have at least a URL or attached files." });
        }

        if (!Enum.TryParse<ResourceType>(request.Type, true, out _))
        {
            return new BadRequestObjectResult(new { Error = "Invalid resource type. Valid values are: Documentation, Tutorial, Tool, Reference, Other." });
        }

        // Validate file IDs to add
        if (request.FileIdsToAdd != null && request.FileIdsToAdd.Count > 0)
        {
            var existingFileIds = await _dbContext.UploadedFiles
                .Where(f => request.FileIdsToAdd.Contains(f.Id))
                .Select(f => f.Id)
                .ToListAsync();
            
            var missingFileIds = request.FileIdsToAdd.Except(existingFileIds).ToList();
            if (missingFileIds.Count > 0)
            {
                return new NotFoundObjectResult(new { Error = $"Files not found: {string.Join(", ", missingFileIds)}" });
            }
            
            // Check for duplicates
            var existingResourceFileIds = resource.Files.Select(rf => rf.FileId).ToList();
            var duplicates = request.FileIdsToAdd.Intersect(existingResourceFileIds).ToList();
            if (duplicates.Count > 0)
            {
                return new BadRequestObjectResult(new { Error = $"Files already attached: {string.Join(", ", duplicates)}" });
            }
        }

        // Collect file info before mutations (for logging)
        var removedFilesInfo = new List<(string OriginalFileName, string FilePath, string ContentType)>();
        var addedFilesInfo   = new List<(string OriginalFileName, string FilePath, string ContentType)>();

        // Handle file removals
        if (request.FileIdsToRemove != null && request.FileIdsToRemove.Count > 0)
        {
            var rows = await _dbContext.UploadedFiles
                .Where(f => request.FileIdsToRemove.Contains(f.Id))
                .Select(f => new { f.OriginalFileName, f.FilePath, f.ContentType })
                .ToListAsync();
            removedFilesInfo = rows.Select(r => (r.OriginalFileName, r.FilePath, r.ContentType)).ToList();

            var filesToRemoveEntities = resource.Files
                .Where(rf => request.FileIdsToRemove.Contains(rf.FileId))
                .ToList();
            
            _dbContext.ResourceFiles.RemoveRange(filesToRemoveEntities);
        }

        // Handle file additions
        if (request.FileIdsToAdd != null && request.FileIdsToAdd.Count > 0)
        {
            var rows = await _dbContext.UploadedFiles
                .Where(f => request.FileIdsToAdd.Contains(f.Id))
                .Select(f => new { f.OriginalFileName, f.FilePath, f.ContentType })
                .ToListAsync();
            addedFilesInfo = rows.Select(r => (r.OriginalFileName, r.FilePath, r.ContentType)).ToList();

            foreach (var fileId in request.FileIdsToAdd)
            {
                _dbContext.ResourceFiles.Add(new ResourceFile
                {
                    Id = Guid.NewGuid(),
                    ResourceId = resource.Id,
                    FileId = fileId,
                    AddedAt = DateTime.UtcNow
                });
            }
        }

        // Snapshot old values for field-level logging
        var oldResTitle       = resource.Title;
        var oldResUrls        = resource.Urls != null ? new List<string>(resource.Urls) : new List<string>();
        var oldResDescription = resource.Description;
        var oldResType        = resource.Type.ToString();

        _mapper.Map(request, resource);
        resource.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Resource {ResourceId} updated", resource.Id);

        if (userId != null)
        {
            Project? logProjectUpdate = null;
            if (resource.ProjectId != null)
                logProjectUpdate = await _dbContext.Projects.FindAsync(resource.ProjectId);
            else if (resource.ObjectiveId != null)
            {
                var obj = await _dbContext.Objectives.Include(o => o.Project).FirstOrDefaultAsync(o => o.Id == resource.ObjectiveId);
                logProjectUpdate = obj?.Project;
            }
            if (logProjectUpdate != null)
            {
                var resFieldChanges = new List<(string Field, string OldValue, string NewValue)>();
                if (!string.Equals(resource.Title, oldResTitle))
                    resFieldChanges.Add(("Title", oldResTitle, resource.Title));
                var newResUrls = resource.Urls ?? new List<string>();
                if (!newResUrls.SequenceEqual(oldResUrls))
                    resFieldChanges.Add(("URLs",
                        oldResUrls.Count == 0 ? "(none)" : string.Join(", ", oldResUrls),
                        newResUrls.Count == 0 ? "(none)" : string.Join(", ", newResUrls)));
                if (!string.Equals(resource.Description, oldResDescription))
                    resFieldChanges.Add(("Description",
                        string.IsNullOrWhiteSpace(oldResDescription) ? "(empty)" : oldResDescription,
                        string.IsNullOrWhiteSpace(resource.Description) ? "(empty)" : resource.Description));
                if (!string.Equals(resource.Type.ToString(), oldResType, StringComparison.OrdinalIgnoreCase))
                    resFieldChanges.Add(("Type", oldResType, resource.Type.ToString()));

                if (resFieldChanges.Count > 0)
                {
                    foreach (var (field, oldValue, newValue) in resFieldChanges)
                    {
                        await _logService.CreateAsync(new CreateLogDto
                        {
                            EntityType = "Project",
                            EntityId = logProjectUpdate.Id.ToString(),
                            EntityName = logProjectUpdate.Title,
                            Action = "Field updated",
                            Detail = $"{field}: \"{oldValue}\" → \"{newValue}\" (Resource: {resource.Title})",
                            UserId = userId
                        });
                    }
                }
                else if (addedFilesInfo.Count == 0 && removedFilesInfo.Count == 0)
                {
                    await _logService.CreateAsync(new CreateLogDto
                    {
                        EntityType = "Project",
                        EntityId = logProjectUpdate.Id.ToString(),
                        EntityName = logProjectUpdate.Title,
                        Action = "Resource updated",
                        Detail = resource.Title,
                        UserId = userId
                    });
                }

                foreach (var file in addedFilesInfo)
                {
                    var isImage = file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase);
                    await _logService.CreateAsync(new CreateLogDto
                    {
                        EntityType = "Project",
                        EntityId = logProjectUpdate.Id.ToString(),
                        EntityName = logProjectUpdate.Title,
                        Action = "File attached",
                        Detail = isImage ? file.FilePath : $"\"{file.OriginalFileName}\" added to Resource: {resource.Title}",
                        UserId = userId
                    });
                }

                foreach (var file in removedFilesInfo)
                {
                    var isImage = file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase);
                    await _logService.CreateAsync(new CreateLogDto
                    {
                        EntityType = "Project",
                        EntityId = logProjectUpdate.Id.ToString(),
                        EntityName = logProjectUpdate.Title,
                        Action = "File detached",
                        Detail = isImage ? file.FilePath : $"\"{file.OriginalFileName}\" removed from Resource: {resource.Title}",
                        UserId = userId
                    });
                }
            }
        }

        return await GetResourceByIdAsync(resource.Id);
    }

    public async Task<IActionResult> DeleteResourceAsync(Guid id, string? userId = null)
    {
        var resource = await _dbContext.Resources.FindAsync(id);
        if (resource == null)
        {
            return new NotFoundObjectResult(new { Error = "Resource not found." });
        }

        var resourceTitle = resource.Title;
        var resProjectId = resource.ProjectId;
        var resObjectiveId = resource.ObjectiveId;
        _dbContext.Resources.Remove(resource);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Resource {ResourceId} deleted", id);

        if (userId != null)
        {
            Project? logProjectDel = null;
            if (resProjectId != null)
                logProjectDel = await _dbContext.Projects.FindAsync(resProjectId);
            else if (resObjectiveId != null)
            {
                var obj = await _dbContext.Objectives.Include(o => o.Project).FirstOrDefaultAsync(o => o.Id == resObjectiveId);
                logProjectDel = obj?.Project;
            }
            if (logProjectDel != null)
            {
                await _logService.CreateAsync(new CreateLogDto
                {
                    EntityType = "Project",
                    EntityId = logProjectDel.Id.ToString(),
                    EntityName = logProjectDel.Title,
                    Action = "Resource removed",
                    Detail = resourceTitle,
                    UserId = userId
                });
            }
        }

        return new OkObjectResult(new { Message = "Resource deleted successfully." });
    }

    #endregion

    #region Certificate Eligibility

    public async Task<IActionResult> GetUsersWithCompletedObjectivesAsync(Guid projectId, string? excludeUserId = null, int page = 1, int pageSize = 20)
    {
        var project = await _dbContext.Projects.FindAsync(projectId);
        if (project == null)
            return new NotFoundObjectResult(new { Error = "Project not found." });

        var query = _dbContext.ObjectiveTeamMembers
            .Where(otm =>
                otm.Objective.ProjectId == projectId &&
                otm.Objective.Status == ObjectiveStatus.Completed &&
                (excludeUserId == null || otm.User.Id != excludeUserId))
            .Select(otm => otm.User)
            .Distinct()
            .OrderBy(u => u.LastName)
            .ThenBy(u => u.FirstName);

        var totalCount = await query.CountAsync();

        var eligibleUsers = await query
            .Include(u => u.UploadedFiles)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = eligibleUsers.Select(u => new TeamMemberDto
        {
            Id = Guid.Empty,
            UserId = u.Id,
            FirstName = u.FirstName,
            LastName = u.LastName,
            Email = u.Email ?? string.Empty,
            ProfilePictureUrl = u.UploadedFiles?
                .Where(f => f.FileType == FileType.ProfilePicture)
                .Select(f => "/uploads/" + f.FileName)
                .FirstOrDefault(),
            JoinedAt = DateTime.MinValue
        }).ToList();

        return new OkObjectResult(new
        {
            Users = dtos,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    #endregion

    #region Banner Operations

    public async Task<IActionResult> UploadProjectBannerAsync(Guid projectId, IFormFile bannerFile, string userId, bool isAdmin)
    {
        var project = await _dbContext.Projects
            .Include(p => p.Moderators)
            .FirstOrDefaultAsync(p => p.Id == projectId);
        if (project == null)
            return new NotFoundObjectResult(new { Error = "Project not found." });

        if (!isAdmin && !project.Moderators.Any(m => m.UserId == userId) && project.CreatedByUserId != userId)
            return new ObjectResult(new { Error = "Only an admin, the project creator, or the moderator can change the project banner." }) { StatusCode = 403 };

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        var fileExtension = Path.GetExtension(bannerFile.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(fileExtension))
            return new BadRequestObjectResult(new { Error = "Only image files are allowed for the banner." });

        // Delete old banner file if present
        if (!string.IsNullOrEmpty(project.BannerUrl))
        {
            var oldFileName = Path.GetFileName(project.BannerUrl.TrimStart('/').Replace("uploads/", ""));
            var oldFile = await _dbContext.UploadedFiles.FirstOrDefaultAsync(f => f.FileName == oldFileName);
            if (oldFile != null)
                await _fileService.DeleteFileAsync(oldFile.Id, userId, isAdmin: true);
        }

        var uploadResult = await _fileService.UploadFileAsync(bannerFile, userId);
        if (!uploadResult.Success)
            return new BadRequestObjectResult(new { Error = uploadResult.Error ?? "Failed to upload banner." });

        var uploadedFile = await _dbContext.UploadedFiles.FindAsync(uploadResult.FileId);
        if (uploadedFile != null)
            uploadedFile.FileType = FileType.ProjectBanner;

        project.BannerUrl = $"/uploads/{uploadedFile!.FileName}";
        project.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return new OkObjectResult(new { bannerUrl = project.BannerUrl });
    }

    public async Task<IActionResult> DeleteProjectBannerAsync(Guid projectId, string userId, bool isAdmin)
    {
        var project = await _dbContext.Projects
            .Include(p => p.Moderators)
            .FirstOrDefaultAsync(p => p.Id == projectId);
        if (project == null)
            return new NotFoundObjectResult(new { Error = "Project not found." });

        if (!isAdmin && !project.Moderators.Any(m => m.UserId == userId) && project.CreatedByUserId != userId)
            return new ObjectResult(new { Error = "Only an admin, the project creator, or the moderator can remove the project banner." }) { StatusCode = 403 };

        if (string.IsNullOrEmpty(project.BannerUrl))
            return new NotFoundObjectResult(new { Error = "No banner found for this project." });

        var oldFileName = Path.GetFileName(project.BannerUrl.TrimStart('/').Replace("uploads/", ""));
        var oldFile = await _dbContext.UploadedFiles.FirstOrDefaultAsync(f => f.FileName == oldFileName);
        if (oldFile != null)
            await _fileService.DeleteFileAsync(oldFile.Id, userId, isAdmin: true);

        project.BannerUrl = null;
        project.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return new OkObjectResult(new { Message = "Banner deleted successfully." });
    }

    #endregion

    #region Seed and Cleanup Operations

    public async Task<IActionResult> SeedProjectsAsync(string userId)
    {
        var user = await _dbContext.Users.FindAsync(userId);
        if (user == null)
        {
            return new NotFoundObjectResult(new { Error = "User not found." });
        }

        var projects = new List<Project>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Title = "FLOSSK Website Redesign",
                Description = "Complete redesign and modernization of the FLOSSK organization website with improved UX and accessibility.",
                StartDate = DateTime.UtcNow.AddDays(-30),
                EndDate = DateTime.UtcNow.AddDays(60),
                Status = ProjectStatus.InProgress,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = userId
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Open Source Workshop Series",
                Description = "A series of workshops introducing students to open source contribution, Git, and collaborative development.",
                StartDate = DateTime.UtcNow.AddDays(14),
                EndDate = DateTime.UtcNow.AddDays(90),
                Status = ProjectStatus.Upcoming,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = userId
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Community Hackathon 2025",
                Description = "Annual hackathon event bringing together developers, designers, and innovators to build solutions for local challenges.",
                StartDate = DateTime.UtcNow.AddDays(-90),
                EndDate = DateTime.UtcNow.AddDays(-60),
                Status = ProjectStatus.Completed,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = userId
            }
        };

        _dbContext.Projects.AddRange(projects);
        await _dbContext.SaveChangesAsync();

        // Add objectives for each project
        var objectives = new List<Objective>
        {
            // Website Redesign objectives
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Design System Creation",
                Description = "Create a comprehensive design system with reusable components and style guidelines.",
                Status = ObjectiveStatus.Completed,
                ProjectId = projects[0].Id,
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Frontend Development",
                Description = "Implement the new design using modern frontend technologies (Angular/React).",
                Status = ObjectiveStatus.InProgress,
                ProjectId = projects[0].Id,
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Backend API Integration",
                Description = "Connect the frontend to the existing backend APIs and implement new endpoints.",
                Status = ObjectiveStatus.InProgress,
                ProjectId = projects[0].Id,
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Testing & QA",
                Description = "Comprehensive testing including unit tests, integration tests, and user acceptance testing.",
                Status = ObjectiveStatus.Todo,
                ProjectId = projects[0].Id,
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            },

            // Workshop Series objectives
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Curriculum Development",
                Description = "Develop workshop materials, slides, and hands-on exercises for each session.",
                Status = ObjectiveStatus.InProgress,
                ProjectId = projects[1].Id,
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Venue & Logistics",
                Description = "Secure venues, equipment, and handle registration for all workshop sessions.",
                Status = ObjectiveStatus.Todo,
                ProjectId = projects[1].Id,
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Speaker Recruitment",
                Description = "Identify and recruit experienced open source contributors as guest speakers.",
                Status = ObjectiveStatus.InProgress,
                ProjectId = projects[1].Id,
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            },

            // Hackathon objectives (all completed)
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Event Planning",
                Description = "Plan the hackathon schedule, themes, and judging criteria.",
                Status = ObjectiveStatus.Completed,
                ProjectId = projects[2].Id,
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Sponsor Acquisition",
                Description = "Reach out to potential sponsors and secure funding for prizes and refreshments.",
                Status = ObjectiveStatus.Completed,
                ProjectId = projects[2].Id,
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Post-Event Documentation",
                Description = "Document winning projects, participant feedback, and lessons learned.",
                Status = ObjectiveStatus.Completed,
                ProjectId = projects[2].Id,
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            }
        };

        _dbContext.Objectives.AddRange(objectives);
        await _dbContext.SaveChangesAsync();

        // Add some resources
        var resources = new List<Resource>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Figma Design Files",
                Urls = ["https://figma.com/file/flossk-redesign"],
                Description = "Main design files for the website redesign project.",
                Type = ResourceType.Tool,
                ProjectId = projects[0].Id,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Angular Documentation",
                Urls = ["https://angular.io/docs"],
                Description = "Official Angular documentation for frontend development.",
                Type = ResourceType.Documentation,
                ProjectId = projects[0].Id,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Git Tutorial for Beginners",
                Urls = ["https://git-scm.com/book/en/v2"],
                Description = "Pro Git book - comprehensive guide to Git.",
                Type = ResourceType.Tutorial,
                ProjectId = projects[1].Id,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Open Source Guide",
                Urls = ["https://opensource.guide/"],
                Description = "GitHub's guide to open source contribution.",
                Type = ResourceType.Reference,
                ProjectId = projects[1].Id,
                CreatedAt = DateTime.UtcNow
            }
        };

        _dbContext.Resources.AddRange(resources);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Seeded {ProjectCount} projects with {ObjectiveCount} objectives and {ResourceCount} resources",
            projects.Count, objectives.Count, resources.Count);

        return new OkObjectResult(new
        {
            Message = "Projects seeded successfully.",
            ProjectsCreated = projects.Count,
            ObjectivesCreated = objectives.Count,
            ResourcesCreated = resources.Count
        });
    }

    public async Task<IActionResult> DeleteAllProjectsAsync()
    {
        // Delete in correct order due to foreign key constraints
        var resourceCount = await _dbContext.Resources.CountAsync();
        var objectiveTeamMemberCount = await _dbContext.ObjectiveTeamMembers.CountAsync();
        var objectiveCount = await _dbContext.Objectives.CountAsync();
        var projectTeamMemberCount = await _dbContext.ProjectTeamMembers.CountAsync();
        var projectCount = await _dbContext.Projects.CountAsync();

        _dbContext.Resources.RemoveRange(_dbContext.Resources);
        _dbContext.ObjectiveTeamMembers.RemoveRange(_dbContext.ObjectiveTeamMembers);
        _dbContext.Objectives.RemoveRange(_dbContext.Objectives);
        _dbContext.ProjectTeamMembers.RemoveRange(_dbContext.ProjectTeamMembers);
        _dbContext.Projects.RemoveRange(_dbContext.Projects);

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Deleted all projects: {Projects} projects, {Objectives} objectives, {Resources} resources, {ProjectMembers} project members, {ObjectiveMembers} objective members",
            projectCount, objectiveCount, resourceCount, projectTeamMemberCount, objectiveTeamMemberCount);

        return new OkObjectResult(new
        {
            Message = "All projects and related data deleted successfully.",
            ProjectsDeleted = projectCount,
            ObjectivesDeleted = objectiveCount,
            ResourcesDeleted = resourceCount,
            ProjectTeamMembersDeleted = projectTeamMemberCount,
            ObjectiveTeamMembersDeleted = objectiveTeamMemberCount
        });
    }

    private static ProjectType ParseProjectTypes(List<string> types)
    {
        if (types == null || types.Count == 0) return ProjectType.None;
        return types.Aggregate(ProjectType.None, (acc, t) => acc | Enum.Parse<ProjectType>(t, true));
    }

    #endregion
}
