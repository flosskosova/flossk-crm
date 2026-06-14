using FlosskMS.Business.DTOs;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FlosskMS.Business.Services;

public interface ICourseService
{
    // Course CRUD
    Task<IActionResult> CreateCourseAsync(CreateCourseDto request, ClaimsPrincipal currentUser);
    Task<IActionResult> CreateCourseAsync(CreateCourseDto request, string userId);
    Task<IActionResult> GetCoursesAsync(int page = 1, int pageSize = 10);
    Task<IActionResult> GetCourseByIdAsync(Guid id);
    Task<IActionResult> GetCourseByProjectIdAsync(Guid projectId);
    Task<IActionResult> UpdateCourseAsync(Guid id, UpdateCourseDto request, ClaimsPrincipal currentUser);
    Task<IActionResult> UpdateCourseAsync(Guid id, UpdateCourseDto request, string userId, bool isAdmin);
    Task<IActionResult> DeleteCourseAsync(Guid id, ClaimsPrincipal currentUser);
    Task<IActionResult> DeleteCourseAsync(Guid id, string userId, bool isAdmin);

    // Modules
    Task<IActionResult> AddModuleAsync(Guid courseId, CreateCourseModuleDto request, ClaimsPrincipal currentUser);
    Task<IActionResult> AddModuleAsync(Guid courseId, CreateCourseModuleDto request, string userId, bool isAdmin);
    Task<IActionResult> UpdateModuleAsync(Guid courseId, Guid moduleId, UpdateCourseModuleDto request, ClaimsPrincipal currentUser);
    Task<IActionResult> UpdateModuleAsync(Guid courseId, Guid moduleId, UpdateCourseModuleDto request, string userId, bool isAdmin);
    Task<IActionResult> DeleteModuleAsync(Guid courseId, Guid moduleId, ClaimsPrincipal currentUser);
    Task<IActionResult> DeleteModuleAsync(Guid courseId, Guid moduleId, string userId, bool isAdmin);
    Task<IActionResult> ReorderModulesAsync(Guid courseId, List<Guid> orderedModuleIds, ClaimsPrincipal currentUser);
    Task<IActionResult> ReorderModulesAsync(Guid courseId, List<Guid> orderedModuleIds, string userId, bool isAdmin);

    // Resources
    Task<IActionResult> AddResourceAsync(Guid courseId, Guid moduleId, CreateCourseResourceDto request, ClaimsPrincipal currentUser);
    Task<IActionResult> AddResourceAsync(Guid courseId, Guid moduleId, CreateCourseResourceDto request, string userId, bool isAdmin);
    Task<IActionResult> UpdateResourceAsync(Guid courseId, Guid moduleId, Guid resourceId, UpdateCourseResourceDto request, ClaimsPrincipal currentUser);
    Task<IActionResult> UpdateResourceAsync(Guid courseId, Guid moduleId, Guid resourceId, UpdateCourseResourceDto request, string userId, bool isAdmin);
    Task<IActionResult> DeleteResourceAsync(Guid courseId, Guid moduleId, Guid resourceId, ClaimsPrincipal currentUser);
    Task<IActionResult> DeleteResourceAsync(Guid courseId, Guid moduleId, Guid resourceId, string userId, bool isAdmin);

    // Reviews (public — no auth required)
    Task<IActionResult> SubmitReviewAsync(Guid courseId, Guid moduleId, CreateCourseReviewDto request);
    Task<IActionResult> GetReviewsAsync(Guid courseId, Guid moduleId);
    Task<IActionResult> DeleteReviewAsync(Guid courseId, Guid moduleId, Guid reviewId, ClaimsPrincipal currentUser);
    Task<IActionResult> DeleteReviewAsync(Guid courseId, Guid moduleId, Guid reviewId, string userId, bool isAdmin);

    // Sessions
    Task<IActionResult> AddSessionAsync(Guid courseId, CreateCourseSessionDto request, ClaimsPrincipal currentUser);
    Task<IActionResult> AddSessionAsync(Guid courseId, CreateCourseSessionDto request, string userId, bool isAdmin);
    Task<IActionResult> UpdateSessionAsync(Guid courseId, Guid sessionId, UpdateCourseSessionDto request, ClaimsPrincipal currentUser);
    Task<IActionResult> UpdateSessionAsync(Guid courseId, Guid sessionId, UpdateCourseSessionDto request, string userId, bool isAdmin);
    Task<IActionResult> DeleteSessionAsync(Guid courseId, Guid sessionId, ClaimsPrincipal currentUser);
    Task<IActionResult> DeleteSessionAsync(Guid courseId, Guid sessionId, string userId, bool isAdmin);

    // Vouchers
    Task<IActionResult> GenerateVouchersAsync(Guid courseId, GenerateCourseVouchersDto request, ClaimsPrincipal currentUser);
    Task<IActionResult> GenerateVouchersAsync(Guid courseId, GenerateCourseVouchersDto request, string userId, bool isAdmin);
    Task<IActionResult> GetVouchersAsync(Guid courseId, ClaimsPrincipal currentUser);
    Task<IActionResult> GetVouchersAsync(Guid courseId, string userId, bool isAdmin);
    Task<IActionResult> DeleteVoucherAsync(Guid courseId, Guid voucherId, ClaimsPrincipal currentUser);
    Task<IActionResult> DeleteVoucherAsync(Guid courseId, Guid voucherId, string userId, bool isAdmin);

    // Self-enroll as instructor
    Task<IActionResult> JoinAsInstructorAsync(Guid courseId, ClaimsPrincipal currentUser);
    Task<IActionResult> JoinAsInstructorAsync(Guid courseId, string userId);
    Task<IActionResult> LeaveAsInstructorAsync(Guid courseId, ClaimsPrincipal currentUser);
    Task<IActionResult> LeaveAsInstructorAsync(Guid courseId, string userId);
}
