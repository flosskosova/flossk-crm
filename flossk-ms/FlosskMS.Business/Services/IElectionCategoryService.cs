using FlosskMS.Business.DTOs;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FlosskMS.Business.Services;

public interface IElectionCategoryService
{
    Task<IActionResult> GetElectionCategoriesAsync();
    Task<IActionResult> GetElectionCategoryByIdAsync(Guid id);
    Task<IActionResult> CreateElectionCategoryAsync(CreateElectionCategoryDto request, ClaimsPrincipal currentUser);
    Task<IActionResult> CreateElectionCategoryAsync(CreateElectionCategoryDto request, string userId);
    Task<IActionResult> UpdateElectionCategoryAsync(Guid id, UpdateElectionCategoryDto request, ClaimsPrincipal currentUser);
    Task<IActionResult> UpdateElectionCategoryAsync(Guid id, UpdateElectionCategoryDto request, string userId);
    Task<IActionResult> DeleteElectionCategoryAsync(Guid id, ClaimsPrincipal currentUser);
    Task<IActionResult> DeleteElectionCategoryAsync(Guid id, string userId);
}
