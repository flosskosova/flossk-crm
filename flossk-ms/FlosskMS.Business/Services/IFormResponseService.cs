using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.Business.Services;

public interface IFormResponseService
{
    Task<IActionResult> ReceiveWebhookAsync(DTOs.GoogleFormWebhookDto payload, CancellationToken cancellationToken = default);
    Task<IActionResult> GetResponsesAsync(string? formTitle, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<IActionResult> GetResponseByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IActionResult> DeleteResponseAsync(Guid id, CancellationToken cancellationToken = default);
}
