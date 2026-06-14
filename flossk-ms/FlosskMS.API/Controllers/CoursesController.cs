using FlosskMS.Business.DTOs;
using FlosskMS.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CoursesController(ICourseService courseService, IFormResponseService formResponseService) : ControllerBase
{
    private readonly ICourseService _courseService = courseService;
    private readonly IFormResponseService _formResponseService = formResponseService;

    // ── Course Endpoints ──────────────────────────────────────────────────

    /// <summary>
    /// Create a new course linked to a project 
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateCourse([FromBody] CreateCourseDto request)
    {
        return await _courseService.CreateCourseAsync(request, User);
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
        return await _courseService.UpdateCourseAsync(id, request, User);
    }

    /// <summary>
    /// Delete a course (only the course creator or Admin)
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteCourse(Guid id)
    {
        return await _courseService.DeleteCourseAsync(id, User);
    }

    // ── Module Endpoints ──────────────────────────────────────────────────

    /// <summary>
    /// Add a module to a course
    /// </summary>
    [HttpPost("{courseId:guid}/modules")]
    public async Task<IActionResult> AddModule(Guid courseId, [FromBody] CreateCourseModuleDto request)
    {
        return await _courseService.AddModuleAsync(courseId, request, User);
    }

    /// <summary>
    /// Update a module
    /// </summary>
    [HttpPut("{courseId:guid}/modules/{moduleId:guid}")]
    public async Task<IActionResult> UpdateModule(Guid courseId, Guid moduleId, [FromBody] UpdateCourseModuleDto request)
    {
        return await _courseService.UpdateModuleAsync(courseId, moduleId, request, User);
    }

    /// <summary>
    /// Delete a module
    /// </summary>
    [HttpDelete("{courseId:guid}/modules/{moduleId:guid}")]
    public async Task<IActionResult> DeleteModule(Guid courseId, Guid moduleId)
    {
        return await _courseService.DeleteModuleAsync(courseId, moduleId, User);
    }

    /// <summary>
    /// Reorder modules by providing an ordered list of module IDs
    /// </summary>
    [HttpPut("{courseId:guid}/modules/reorder")]
    public async Task<IActionResult> ReorderModules(Guid courseId, [FromBody] List<Guid> orderedModuleIds)
    {
        return await _courseService.ReorderModulesAsync(courseId, orderedModuleIds, User);
    }

    // ── Resource Endpoints ────────────────────────────────────────────────

    /// <summary>
    /// Add a resource to a module
    /// </summary>
    [HttpPost("{courseId:guid}/modules/{moduleId:guid}/resources")]
    public async Task<IActionResult> AddResource(Guid courseId, Guid moduleId, [FromBody] CreateCourseResourceDto request)
    {
        return await _courseService.AddResourceAsync(courseId, moduleId, request, User);
    }

    /// <summary>
    /// Update a resource
    /// </summary>
    [HttpPut("{courseId:guid}/modules/{moduleId:guid}/resources/{resourceId:guid}")]
    public async Task<IActionResult> UpdateResource(Guid courseId, Guid moduleId, Guid resourceId, [FromBody] UpdateCourseResourceDto request)
    {
        return await _courseService.UpdateResourceAsync(courseId, moduleId, resourceId, request, User);
    }

    /// <summary>
    /// Delete a resource
    /// </summary>
    [HttpDelete("{courseId:guid}/modules/{moduleId:guid}/resources/{resourceId:guid}")]
    public async Task<IActionResult> DeleteResource(Guid courseId, Guid moduleId, Guid resourceId)
    {
        return await _courseService.DeleteResourceAsync(courseId, moduleId, resourceId, User);
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
        return await _courseService.DeleteReviewAsync(courseId, moduleId, reviewId, User);
    }

    // ── Session Endpoints ─────────────────────────────────────────────────

    /// <summary>
    /// Add a session to a course
    /// </summary>
    [HttpPost("{courseId:guid}/sessions")]
    public async Task<IActionResult> AddSession(Guid courseId, [FromBody] CreateCourseSessionDto request)
    {
        return await _courseService.AddSessionAsync(courseId, request, User);
    }

    /// <summary>
    /// Update a session
    /// </summary>
    [HttpPut("{courseId:guid}/sessions/{sessionId:guid}")]
    public async Task<IActionResult> UpdateSession(Guid courseId, Guid sessionId, [FromBody] UpdateCourseSessionDto request)
    {
        return await _courseService.UpdateSessionAsync(courseId, sessionId, request, User);
    }

    /// <summary>
    /// Delete a session
    /// </summary>
    [HttpDelete("{courseId:guid}/sessions/{sessionId:guid}")]
    public async Task<IActionResult> DeleteSession(Guid courseId, Guid sessionId)
    {
        return await _courseService.DeleteSessionAsync(courseId, sessionId, User);
    }

    // ── Voucher Endpoints ─────────────────────────────────────────────────

    /// <summary>
    /// Generate voucher codes for a course.
    /// Set IsMultiUse=true for one shared code, or IsMultiUse=false with Count=N for N single-use codes.
    /// </summary>
    [HttpPost("{courseId:guid}/vouchers")]
    public async Task<IActionResult> GenerateVouchers(Guid courseId, [FromBody] GenerateCourseVouchersDto request)
    {
        return await _courseService.GenerateVouchersAsync(courseId, request, User);
    }

    /// <summary>
    /// Get all voucher codes for a course
    /// </summary>
    [HttpGet("{courseId:guid}/vouchers")]
    public async Task<IActionResult> GetVouchers(Guid courseId)
    {
        return await _courseService.GetVouchersAsync(courseId, User);
    }

    /// <summary>
    /// Get paginated Google Form responses linked to a course.
    /// </summary>
    [HttpGet("{courseId:guid}/form-responses")]
    public async Task<IActionResult> GetCourseFormResponses(
        Guid courseId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        return await _formResponseService.GetResponsesByCourseAsync(courseId, page, pageSize, User, cancellationToken);
    }

    /// <summary>
    /// Delete a voucher code
    /// </summary>
    [HttpDelete("{courseId:guid}/vouchers/{voucherId:guid}")]
    public async Task<IActionResult> DeleteVoucher(Guid courseId, Guid voucherId)
    {
        return await _courseService.DeleteVoucherAsync(courseId, voucherId, User);
    }

    // ── Self-enroll Endpoints ─────────────────────────────────────────────

    /// <summary>
    /// Join the course as an instructor (current user)
    /// </summary>
    [HttpPost("{courseId:guid}/instructors/me")]
    public async Task<IActionResult> JoinAsInstructor(Guid courseId)
    {
        return await _courseService.JoinAsInstructorAsync(courseId, User);
    }

    /// <summary>
    /// Leave the course as an instructor (current user)
    /// </summary>
    [HttpDelete("{courseId:guid}/instructors/me")]
    public async Task<IActionResult> LeaveAsInstructor(Guid courseId)
    {
        return await _courseService.LeaveAsInstructorAsync(courseId, User);
    }
}
