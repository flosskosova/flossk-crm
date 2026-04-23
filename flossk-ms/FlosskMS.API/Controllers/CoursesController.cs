using System.Security.Claims;
using FlosskMS.Business.DTOs;
using FlosskMS.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CoursesController(ICourseService courseService) : ControllerBase
{
    private readonly ICourseService _courseService = courseService;

    // ── Course Endpoints ──────────────────────────────────────────────────

    /// <summary>
    /// Create a new course linked to a project 
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateCourse([FromBody] CreateCourseDto request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        return await _courseService.CreateCourseAsync(request, userId);
    }

    /// <summary>
    /// Get all courses (paginated)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetCourses([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        return await _courseService.GetCoursesAsync(page, pageSize);
    }

    /// <summary>
    /// Get a course by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetCourse(Guid id)
    {
        return await _courseService.GetCourseByIdAsync(id);
    }

    /// <summary>
    /// Get the course associated with a project
    /// </summary>
    [HttpGet("project/{projectId:guid}")]
    public async Task<IActionResult> GetCourseByProject(Guid projectId)
    {
        return await _courseService.GetCourseByProjectIdAsync(projectId);
    }

    /// <summary>
    /// Update a course (only the course creator or Admin)
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateCourse(Guid id, [FromBody] UpdateCourseDto request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var isAdmin = User.IsInRole("Admin");
        return await _courseService.UpdateCourseAsync(id, request, userId, isAdmin);
    }

    /// <summary>
    /// Delete a course (only the course creator or Admin)
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteCourse(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var isAdmin = User.IsInRole("Admin");
        return await _courseService.DeleteCourseAsync(id, userId, isAdmin);
    }

    // ── Module Endpoints ──────────────────────────────────────────────────

    /// <summary>
    /// Add a module to a course
    /// </summary>
    [HttpPost("{courseId:guid}/modules")]
    public async Task<IActionResult> AddModule(Guid courseId, [FromBody] CreateCourseModuleDto request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var isAdmin = User.IsInRole("Admin");
        return await _courseService.AddModuleAsync(courseId, request, userId, isAdmin);
    }

    /// <summary>
    /// Update a module
    /// </summary>
    [HttpPut("{courseId:guid}/modules/{moduleId:guid}")]
    public async Task<IActionResult> UpdateModule(Guid courseId, Guid moduleId, [FromBody] UpdateCourseModuleDto request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var isAdmin = User.IsInRole("Admin");
        return await _courseService.UpdateModuleAsync(courseId, moduleId, request, userId, isAdmin);
    }

    /// <summary>
    /// Delete a module
    /// </summary>
    [HttpDelete("{courseId:guid}/modules/{moduleId:guid}")]
    public async Task<IActionResult> DeleteModule(Guid courseId, Guid moduleId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var isAdmin = User.IsInRole("Admin");
        return await _courseService.DeleteModuleAsync(courseId, moduleId, userId, isAdmin);
    }

    /// <summary>
    /// Reorder modules by providing an ordered list of module IDs
    /// </summary>
    [HttpPut("{courseId:guid}/modules/reorder")]
    public async Task<IActionResult> ReorderModules(Guid courseId, [FromBody] List<Guid> orderedModuleIds)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var isAdmin = User.IsInRole("Admin");
        return await _courseService.ReorderModulesAsync(courseId, orderedModuleIds, userId, isAdmin);
    }

    // ── Resource Endpoints ────────────────────────────────────────────────

    /// <summary>
    /// Add a resource to a module
    /// </summary>
    [HttpPost("{courseId:guid}/modules/{moduleId:guid}/resources")]
    public async Task<IActionResult> AddResource(Guid courseId, Guid moduleId, [FromBody] CreateCourseResourceDto request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var isAdmin = User.IsInRole("Admin");
        return await _courseService.AddResourceAsync(courseId, moduleId, request, userId, isAdmin);
    }

    /// <summary>
    /// Update a resource
    /// </summary>
    [HttpPut("{courseId:guid}/modules/{moduleId:guid}/resources/{resourceId:guid}")]
    public async Task<IActionResult> UpdateResource(Guid courseId, Guid moduleId, Guid resourceId, [FromBody] UpdateCourseResourceDto request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var isAdmin = User.IsInRole("Admin");
        return await _courseService.UpdateResourceAsync(courseId, moduleId, resourceId, request, userId, isAdmin);
    }

    /// <summary>
    /// Delete a resource
    /// </summary>
    [HttpDelete("{courseId:guid}/modules/{moduleId:guid}/resources/{resourceId:guid}")]
    public async Task<IActionResult> DeleteResource(Guid courseId, Guid moduleId, Guid resourceId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var isAdmin = User.IsInRole("Admin");
        return await _courseService.DeleteResourceAsync(courseId, moduleId, resourceId, userId, isAdmin);
    }

    // ── Review Endpoints (public) ─────────────────────────────────────────

    /// <summary>
    /// Submit a review for a module (public, no auth required)
    /// </summary>
    [AllowAnonymous]
    [HttpPost("{courseId:guid}/modules/{moduleId:guid}/reviews")]
    public async Task<IActionResult> SubmitReview(Guid courseId, Guid moduleId, [FromBody] CreateCourseReviewDto request)
    {
        return await _courseService.SubmitReviewAsync(courseId, moduleId, request);
    }

    /// <summary>
    /// Get all reviews for a module (public)
    /// </summary>
    [AllowAnonymous]
    [HttpGet("{courseId:guid}/modules/{moduleId:guid}/reviews")]
    public async Task<IActionResult> GetReviews(Guid courseId, Guid moduleId)
    {
        return await _courseService.GetReviewsAsync(courseId, moduleId);
    }

    /// <summary>
    /// Delete a review (instructors or Admin)
    /// </summary>
    [HttpDelete("{courseId:guid}/modules/{moduleId:guid}/reviews/{reviewId:guid}")]
    public async Task<IActionResult> DeleteReview(Guid courseId, Guid moduleId, Guid reviewId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var isAdmin = User.IsInRole("Admin");
        return await _courseService.DeleteReviewAsync(courseId, moduleId, reviewId, userId, isAdmin);
    }

    // ── Session Endpoints ─────────────────────────────────────────────────

    /// <summary>
    /// Add a session to a course
    /// </summary>
    [HttpPost("{courseId:guid}/sessions")]
    public async Task<IActionResult> AddSession(Guid courseId, [FromBody] CreateCourseSessionDto request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var isAdmin = User.IsInRole("Admin");
        return await _courseService.AddSessionAsync(courseId, request, userId, isAdmin);
    }

    /// <summary>
    /// Update a session
    /// </summary>
    [HttpPut("{courseId:guid}/sessions/{sessionId:guid}")]
    public async Task<IActionResult> UpdateSession(Guid courseId, Guid sessionId, [FromBody] UpdateCourseSessionDto request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var isAdmin = User.IsInRole("Admin");
        return await _courseService.UpdateSessionAsync(courseId, sessionId, request, userId, isAdmin);
    }

    /// <summary>
    /// Delete a session
    /// </summary>
    [HttpDelete("{courseId:guid}/sessions/{sessionId:guid}")]
    public async Task<IActionResult> DeleteSession(Guid courseId, Guid sessionId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var isAdmin = User.IsInRole("Admin");
        return await _courseService.DeleteSessionAsync(courseId, sessionId, userId, isAdmin);
    }

    // ── Voucher Endpoints ─────────────────────────────────────────────────

    /// <summary>
    /// Generate voucher codes for a course.
    /// Set IsMultiUse=true for one shared code, or IsMultiUse=false with Count=N for N single-use codes.
    /// </summary>
    [HttpPost("{courseId:guid}/vouchers")]
    public async Task<IActionResult> GenerateVouchers(Guid courseId, [FromBody] GenerateCourseVouchersDto request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var isAdmin = User.IsInRole("Admin");
        return await _courseService.GenerateVouchersAsync(courseId, request, userId, isAdmin);
    }

    /// <summary>
    /// Get all voucher codes for a course
    /// </summary>
    [HttpGet("{courseId:guid}/vouchers")]
    public async Task<IActionResult> GetVouchers(Guid courseId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var isAdmin = User.IsInRole("Admin");
        return await _courseService.GetVouchersAsync(courseId, userId, isAdmin);
    }

    /// <summary>
    /// Delete a voucher code
    /// </summary>
    [HttpDelete("{courseId:guid}/vouchers/{voucherId:guid}")]
    public async Task<IActionResult> DeleteVoucher(Guid courseId, Guid voucherId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var isAdmin = User.IsInRole("Admin");
        return await _courseService.DeleteVoucherAsync(courseId, voucherId, userId, isAdmin);
    }
}
