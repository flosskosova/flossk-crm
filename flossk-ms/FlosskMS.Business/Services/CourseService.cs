using AutoMapper;
using FlosskMS.Business.DTOs;
using FlosskMS.Data;
using FlosskMS.Data.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FlosskMS.Business.Services;

public class CourseService(
    ApplicationDbContext dbContext,
    IMapper mapper,
    ILogger<CourseService> logger) : ICourseService
{
    private readonly ApplicationDbContext _db = dbContext;
    private readonly IMapper _mapper = mapper;
    private readonly ILogger<CourseService> _logger = logger;

    // ── Helpers ────────────────────────────────────────────────────────────

    private IQueryable<Course> CourseQuery() =>
        _db.Courses
            .Include(c => c.Project)
            .Include(c => c.CreatedByUser)
            .Include(c => c.Instructors).ThenInclude(i => i.User)
            .Include(c => c.Modules).ThenInclude(m => m.Resources).ThenInclude(r => r.Files).ThenInclude(f => f.File)
            .Include(c => c.Modules).ThenInclude(m => m.Reviews)
            .Include(c => c.Sessions);

    private async Task<bool> IsInstructorOrAdmin(Guid courseId, string userId, bool isAdmin)
    {
        if (isAdmin) return true;
        return await _db.CourseInstructors.AnyAsync(i => i.CourseId == courseId && i.UserId == userId);
    }

    // ── Course CRUD ────────────────────────────────────────────────────────

    public async Task<IActionResult> CreateCourseAsync(CreateCourseDto request, string userId)
    {
        if (!Enum.TryParse<CourseLevel>(request.Level, true, out var level))
            return new BadRequestObjectResult(new { Error = "Invalid level. Valid values: Beginner, Intermediate, Advanced." });

        if (!Enum.TryParse<CourseStatus>(request.Status, true, out var status))
            return new BadRequestObjectResult(new { Error = "Invalid status. Valid values: Draft, Active, Completed." });

        var project = await _db.Projects.Include(p => p.Course).FirstOrDefaultAsync(p => p.Id == request.ProjectId);
        if (project == null)
            return new NotFoundObjectResult(new { Error = "Project not found." });

        if (project.Course != null)
            return new ConflictObjectResult(new { Error = "This project already has an associated course." });

        if (request.Instructors == null || request.Instructors.Count == 0)
            return new BadRequestObjectResult(new { Error = "At least one instructor is required." });

        var instructorUserIds = request.Instructors.Select(i => i.UserId).Distinct().ToList();
        var existingUsers = await _db.Users
            .Where(u => instructorUserIds.Contains(u.Id))
            .Select(u => u.Id)
            .ToListAsync();

        var missing = instructorUserIds.Except(existingUsers).ToList();
        if (missing.Count > 0)
            return new BadRequestObjectResult(new { Error = $"User(s) not found: {string.Join(", ", missing)}." });

        var course = new Course
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Level = level,
            Status = status,
            ProjectId = project.Id,
            CommunicationChannels = request.CommunicationChannels ?? [],
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _db.Courses.Add(course);

        foreach (var inst in request.Instructors)
        {
            _db.CourseInstructors.Add(new CourseInstructor
            {
                CourseId = course.Id,
                UserId = inst.UserId,
                Role = string.IsNullOrWhiteSpace(inst.Role) ? "Instructor" : inst.Role.Trim()
            });
        }

        await _db.SaveChangesAsync();
        _logger.LogInformation("Course {CourseId} created for project {ProjectId} by user {UserId}", course.Id, project.Id, userId);

        var created = await CourseQuery().FirstOrDefaultAsync(c => c.Id == course.Id);
        return new OkObjectResult(_mapper.Map<CourseDto>(created));
    }

    public async Task<IActionResult> GetCoursesAsync(string? status = null, string? level = null)
    {
        var query = CourseQuery();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<CourseStatus>(status, true, out var statusEnum))
            query = query.Where(c => c.Status == statusEnum);

        if (!string.IsNullOrEmpty(level) && Enum.TryParse<CourseLevel>(level, true, out var levelEnum))
            query = query.Where(c => c.Level == levelEnum);

        var courses = await query.OrderByDescending(c => c.CreatedAt).ToListAsync();
        return new OkObjectResult(_mapper.Map<List<CourseListDto>>(courses));
    }

    public async Task<IActionResult> GetCourseByIdAsync(Guid id)
    {
        var course = await CourseQuery().FirstOrDefaultAsync(c => c.Id == id);
        if (course == null)
            return new NotFoundObjectResult(new { Error = "Course not found." });

        return new OkObjectResult(_mapper.Map<CourseDto>(course));
    }

    public async Task<IActionResult> GetCourseByProjectIdAsync(Guid projectId)
    {
        var course = await CourseQuery().FirstOrDefaultAsync(c => c.ProjectId == projectId);
        if (course == null)
            return new NotFoundObjectResult(new { Error = "No course found for this project." });

        return new OkObjectResult(_mapper.Map<CourseDto>(course));
    }

    public async Task<IActionResult> UpdateCourseAsync(Guid id, UpdateCourseDto request, string userId, bool isAdmin)
    {
        var course = await _db.Courses.Include(c => c.Instructors).FirstOrDefaultAsync(c => c.Id == id);
        if (course == null)
            return new NotFoundObjectResult(new { Error = "Course not found." });

        if (!await IsInstructorOrAdmin(id, userId, isAdmin))
            return new ForbidResult();

        if (!Enum.TryParse<CourseLevel>(request.Level, true, out var level))
            return new BadRequestObjectResult(new { Error = "Invalid level. Valid values: Beginner, Intermediate, Advanced." });

        if (!Enum.TryParse<CourseStatus>(request.Status, true, out var status))
            return new BadRequestObjectResult(new { Error = "Invalid status. Valid values: Draft, Active, Completed." });

        if (request.Instructors == null || request.Instructors.Count == 0)
            return new BadRequestObjectResult(new { Error = "At least one instructor is required." });

        var instructorUserIds = request.Instructors.Select(i => i.UserId).Distinct().ToList();
        var existingUsers = await _db.Users
            .Where(u => instructorUserIds.Contains(u.Id))
            .Select(u => u.Id)
            .ToListAsync();

        var missing = instructorUserIds.Except(existingUsers).ToList();
        if (missing.Count > 0)
            return new BadRequestObjectResult(new { Error = $"User(s) not found: {string.Join(", ", missing)}." });

        course.Title = request.Title.Trim();
        course.Description = request.Description.Trim();
        course.Level = level;
        course.Status = status;
        course.CommunicationChannels = request.CommunicationChannels ?? [];
        course.UpdatedAt = DateTime.UtcNow;

        // Replace instructors
        _db.CourseInstructors.RemoveRange(course.Instructors);
        foreach (var inst in request.Instructors)
        {
            _db.CourseInstructors.Add(new CourseInstructor
            {
                CourseId = course.Id,
                UserId = inst.UserId,
                Role = string.IsNullOrWhiteSpace(inst.Role) ? "Instructor" : inst.Role.Trim()
            });
        }

        await _db.SaveChangesAsync();

        var updated = await CourseQuery().FirstOrDefaultAsync(c => c.Id == id);
        return new OkObjectResult(_mapper.Map<CourseDto>(updated));
    }

    public async Task<IActionResult> DeleteCourseAsync(Guid id, string userId, bool isAdmin)
    {
        var course = await _db.Courses.FindAsync(id);
        if (course == null)
            return new NotFoundObjectResult(new { Error = "Course not found." });

        if (!await IsInstructorOrAdmin(id, userId, isAdmin))
            return new ForbidResult();

        _db.Courses.Remove(course);
        await _db.SaveChangesAsync();
        _logger.LogInformation("Course {CourseId} deleted by user {UserId}", id, userId);
        return new NoContentResult();
    }

    // ── Modules ────────────────────────────────────────────────────────────

    public async Task<IActionResult> AddModuleAsync(Guid courseId, CreateCourseModuleDto request, string userId, bool isAdmin)
    {
        var course = await _db.Courses.Include(c => c.Modules).FirstOrDefaultAsync(c => c.Id == courseId);
        if (course == null)
            return new NotFoundObjectResult(new { Error = "Course not found." });

        if (!await IsInstructorOrAdmin(courseId, userId, isAdmin))
            return new ForbidResult();

        var module = new CourseModule
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Order = course.Modules.Count,
            CourseId = courseId
        };

        _db.CourseModules.Add(module);
        await _db.SaveChangesAsync();

        return new OkObjectResult(_mapper.Map<CourseModuleDto>(module));
    }

    public async Task<IActionResult> UpdateModuleAsync(Guid courseId, Guid moduleId, UpdateCourseModuleDto request, string userId, bool isAdmin)
    {
        var module = await _db.CourseModules
            .Include(m => m.Resources).ThenInclude(r => r.Files).ThenInclude(f => f.File)
            .Include(m => m.Reviews)
            .FirstOrDefaultAsync(m => m.Id == moduleId && m.CourseId == courseId);
        if (module == null)
            return new NotFoundObjectResult(new { Error = "Module not found." });

        if (!await IsInstructorOrAdmin(courseId, userId, isAdmin))
            return new ForbidResult();

        module.Title = request.Title.Trim();
        module.Description = request.Description.Trim();
        await _db.SaveChangesAsync();

        return new OkObjectResult(_mapper.Map<CourseModuleDto>(module));
    }

    public async Task<IActionResult> DeleteModuleAsync(Guid courseId, Guid moduleId, string userId, bool isAdmin)
    {
        var module = await _db.CourseModules.FirstOrDefaultAsync(m => m.Id == moduleId && m.CourseId == courseId);
        if (module == null)
            return new NotFoundObjectResult(new { Error = "Module not found." });

        if (!await IsInstructorOrAdmin(courseId, userId, isAdmin))
            return new ForbidResult();

        _db.CourseModules.Remove(module);
        await _db.SaveChangesAsync();

        // Re-order remaining modules
        var remaining = await _db.CourseModules.Where(m => m.CourseId == courseId).OrderBy(m => m.Order).ToListAsync();
        for (int i = 0; i < remaining.Count; i++)
            remaining[i].Order = i;
        await _db.SaveChangesAsync();

        return new NoContentResult();
    }

    public async Task<IActionResult> ReorderModulesAsync(Guid courseId, List<Guid> orderedModuleIds, string userId, bool isAdmin)
    {
        if (!await IsInstructorOrAdmin(courseId, userId, isAdmin))
            return new ForbidResult();

        var modules = await _db.CourseModules.Where(m => m.CourseId == courseId).ToListAsync();
        if (modules.Count != orderedModuleIds.Count)
            return new BadRequestObjectResult(new { Error = "Module ID list must contain all modules of this course." });

        for (int i = 0; i < orderedModuleIds.Count; i++)
        {
            var mod = modules.FirstOrDefault(m => m.Id == orderedModuleIds[i]);
            if (mod == null)
                return new BadRequestObjectResult(new { Error = $"Module {orderedModuleIds[i]} not found in this course." });
            mod.Order = i;
        }

        await _db.SaveChangesAsync();
        return new NoContentResult();
    }

    // ── Resources ──────────────────────────────────────────────────────────

    public async Task<IActionResult> AddResourceAsync(Guid courseId, Guid moduleId, CreateCourseResourceDto request, string userId, bool isAdmin)
    {
        var module = await _db.CourseModules.FirstOrDefaultAsync(m => m.Id == moduleId && m.CourseId == courseId);
        if (module == null)
            return new NotFoundObjectResult(new { Error = "Module not found." });

        if (!await IsInstructorOrAdmin(courseId, userId, isAdmin))
            return new ForbidResult();

        if (!Enum.TryParse<ResourceType>(request.Type, true, out var resourceType))
            return new BadRequestObjectResult(new { Error = "Invalid resource type. Valid values: Documentation, Tutorial, Tool, Reference, Other." });

        var resource = new CourseResource
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Urls = request.Urls.Select(u => u.Trim()).ToList(),
            Description = request.Description?.Trim(),
            Type = resourceType,
            CourseModuleId = moduleId
        };

        _db.CourseResources.Add(resource);

        if (request.FileIds.Count > 0)
        {
            var existingFileIds = await _db.UploadedFiles
                .Where(f => request.FileIds.Contains(f.Id))
                .Select(f => f.Id)
                .ToListAsync();

            var notFound = request.FileIds.Except(existingFileIds).ToList();
            if (notFound.Count > 0)
                return new BadRequestObjectResult(new { Error = $"File(s) not found: {string.Join(", ", notFound)}" });

            foreach (var fileId in existingFileIds)
            {
                _db.CourseResourceFiles.Add(new CourseResourceFile
                {
                    Id = Guid.NewGuid(),
                    CourseResourceId = resource.Id,
                    FileId = fileId
                });
            }
        }

        await _db.SaveChangesAsync();

        var created = await _db.CourseResources
            .Include(r => r.Files)
                .ThenInclude(f => f.File)
            .FirstAsync(r => r.Id == resource.Id);

        return new OkObjectResult(_mapper.Map<CourseResourceDto>(created));
    }

    public async Task<IActionResult> UpdateResourceAsync(Guid courseId, Guid moduleId, Guid resourceId, UpdateCourseResourceDto request, string userId, bool isAdmin)
    {
        var resource = await _db.CourseResources
            .Include(r => r.Files)
            .FirstOrDefaultAsync(r => r.Id == resourceId && r.CourseModuleId == moduleId);
        if (resource == null)
            return new NotFoundObjectResult(new { Error = "Resource not found." });

        if (!await IsInstructorOrAdmin(courseId, userId, isAdmin))
            return new ForbidResult();

        if (!Enum.TryParse<ResourceType>(request.Type, true, out var resourceType))
            return new BadRequestObjectResult(new { Error = "Invalid resource type. Valid values: Documentation, Tutorial, Tool, Reference, Other." });

        resource.Title = request.Title.Trim();
        resource.Urls = request.Urls.Select(u => u.Trim()).ToList();
        resource.Description = request.Description?.Trim();
        resource.Type = resourceType;

        // Replace file attachments
        _db.CourseResourceFiles.RemoveRange(resource.Files);

        if (request.FileIds.Count > 0)
        {
            var existingFileIds = await _db.UploadedFiles
                .Where(f => request.FileIds.Contains(f.Id))
                .Select(f => f.Id)
                .ToListAsync();

            var notFound = request.FileIds.Except(existingFileIds).ToList();
            if (notFound.Count > 0)
                return new BadRequestObjectResult(new { Error = $"File(s) not found: {string.Join(", ", notFound)}" });

            foreach (var fileId in existingFileIds)
            {
                _db.CourseResourceFiles.Add(new CourseResourceFile
                {
                    Id = Guid.NewGuid(),
                    CourseResourceId = resource.Id,
                    FileId = fileId
                });
            }
        }

        await _db.SaveChangesAsync();

        var updated = await _db.CourseResources
            .Include(r => r.Files)
                .ThenInclude(f => f.File)
            .FirstAsync(r => r.Id == resource.Id);

        return new OkObjectResult(_mapper.Map<CourseResourceDto>(updated));
    }

    public async Task<IActionResult> DeleteResourceAsync(Guid courseId, Guid moduleId, Guid resourceId, string userId, bool isAdmin)
    {
        var resource = await _db.CourseResources
            .FirstOrDefaultAsync(r => r.Id == resourceId && r.CourseModuleId == moduleId);
        if (resource == null)
            return new NotFoundObjectResult(new { Error = "Resource not found." });

        if (!await IsInstructorOrAdmin(courseId, userId, isAdmin))
            return new ForbidResult();

        _db.CourseResources.Remove(resource);
        await _db.SaveChangesAsync();
        return new NoContentResult();
    }

    // ── Reviews ────────────────────────────────────────────────────────────

    public async Task<IActionResult> SubmitReviewAsync(Guid courseId, Guid moduleId, CreateCourseReviewDto request)
    {
        var module = await _db.CourseModules.FirstOrDefaultAsync(m => m.Id == moduleId && m.CourseId == courseId);
        if (module == null)
            return new NotFoundObjectResult(new { Error = "Module not found." });

        var course = await _db.Courses.FindAsync(courseId);
        if (course == null || course.Status != CourseStatus.Active)
            return new BadRequestObjectResult(new { Error = "Reviews can only be submitted for active courses." });

        var review = new CourseReview
        {
            Id = Guid.NewGuid(),
            Description = request.Description.Trim(),
            SubmitterName = request.SubmitterName?.Trim(),
            SubmitterEmail = request.SubmitterEmail?.Trim(),
            CourseModuleId = moduleId,
            SubmittedAt = DateTime.UtcNow
        };

        _db.CourseReviews.Add(review);
        await _db.SaveChangesAsync();

        return new OkObjectResult(_mapper.Map<CourseReviewDto>(review));
    }

    public async Task<IActionResult> GetReviewsAsync(Guid courseId, Guid moduleId)
    {
        var module = await _db.CourseModules.FirstOrDefaultAsync(m => m.Id == moduleId && m.CourseId == courseId);
        if (module == null)
            return new NotFoundObjectResult(new { Error = "Module not found." });

        var reviews = await _db.CourseReviews
            .Where(r => r.CourseModuleId == moduleId)
            .OrderByDescending(r => r.SubmittedAt)
            .ToListAsync();

        return new OkObjectResult(_mapper.Map<List<CourseReviewDto>>(reviews));
    }

    public async Task<IActionResult> DeleteReviewAsync(Guid courseId, Guid moduleId, Guid reviewId, string userId, bool isAdmin)
    {
        var review = await _db.CourseReviews
            .FirstOrDefaultAsync(r => r.Id == reviewId && r.CourseModuleId == moduleId);
        if (review == null)
            return new NotFoundObjectResult(new { Error = "Review not found." });

        if (!await IsInstructorOrAdmin(courseId, userId, isAdmin))
            return new ForbidResult();

        _db.CourseReviews.Remove(review);
        await _db.SaveChangesAsync();
        return new NoContentResult();
    }

    // ── Sessions ───────────────────────────────────────────────────────────

    public async Task<IActionResult> AddSessionAsync(Guid courseId, CreateCourseSessionDto request, string userId, bool isAdmin)
    {
        var course = await _db.Courses.FindAsync(courseId);
        if (course == null)
            return new NotFoundObjectResult(new { Error = "Course not found." });

        if (!await IsInstructorOrAdmin(courseId, userId, isAdmin))
            return new ForbidResult();

        if (!Enum.TryParse<CourseSessionType>(request.Type, true, out var sessionType))
            return new BadRequestObjectResult(new { Error = "Invalid session type. Valid values: InPerson, Online." });

        var session = new CourseSession
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Date = request.Date,
            Hour = request.Hour,
            Type = sessionType,
            Location = request.Location.Trim(),
            Notes = request.Notes?.Trim(),
            CourseId = courseId
        };

        _db.CourseSessions.Add(session);
        await _db.SaveChangesAsync();

        return new OkObjectResult(_mapper.Map<CourseSessionDto>(session));
    }

    public async Task<IActionResult> UpdateSessionAsync(Guid courseId, Guid sessionId, UpdateCourseSessionDto request, string userId, bool isAdmin)
    {
        var session = await _db.CourseSessions.FirstOrDefaultAsync(s => s.Id == sessionId && s.CourseId == courseId);
        if (session == null)
            return new NotFoundObjectResult(new { Error = "Session not found." });

        if (!await IsInstructorOrAdmin(courseId, userId, isAdmin))
            return new ForbidResult();

        if (!Enum.TryParse<CourseSessionType>(request.Type, true, out var sessionType))
            return new BadRequestObjectResult(new { Error = "Invalid session type. Valid values: InPerson, Online." });

        session.Title = request.Title.Trim();
        session.Date = request.Date;
        session.Hour = request.Hour;
        session.Type = sessionType;
        session.Location = request.Location.Trim();
        session.Notes = request.Notes?.Trim();

        await _db.SaveChangesAsync();
        return new OkObjectResult(_mapper.Map<CourseSessionDto>(session));
    }

    public async Task<IActionResult> DeleteSessionAsync(Guid courseId, Guid sessionId, string userId, bool isAdmin)
    {
        var session = await _db.CourseSessions.FirstOrDefaultAsync(s => s.Id == sessionId && s.CourseId == courseId);
        if (session == null)
            return new NotFoundObjectResult(new { Error = "Session not found." });

        if (!await IsInstructorOrAdmin(courseId, userId, isAdmin))
            return new ForbidResult();

        _db.CourseSessions.Remove(session);
        await _db.SaveChangesAsync();
        return new NoContentResult();
    }
}
