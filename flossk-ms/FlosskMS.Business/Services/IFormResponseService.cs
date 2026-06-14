using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FlosskMS.Business.Services;

public interface IFormResponseService
{
    Task<IActionResult> ReceiveWebhookAsync(DTOs.GoogleFormWebhookDto payload, CancellationToken cancellationToken = default);
    Task<IActionResult> GetResponsesAsync(string? formTitle, string? formId, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<IActionResult> GetResponsesByCourseAsync(Guid courseId, int page, int pageSize, ClaimsPrincipal currentUser, CancellationToken cancellationToken = default);
    Task<IActionResult> GetResponsesByCourseAsync(Guid courseId, int page, int pageSize, string userId, bool isAdmin, CancellationToken cancellationToken = default);
    Task<IActionResult> GetResponseByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IActionResult> DeleteResponseAsync(Guid id, CancellationToken cancellationToken = default);
}
