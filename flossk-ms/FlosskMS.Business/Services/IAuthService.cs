using FlosskMS.Business.DTOs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.Business.Services;

public interface IAuthService
{
    Task<IActionResult> RegisterAsync(RegisterRequestDto request);
    Task<IActionResult> LoginAsync(LoginRequestDto request);
    Task<IActionResult> GetLoggedInUserAsync(string? userId);
    Task<IActionResult> UpdateUserAsync(string? userId, UpdateUserDto request, IFormFile? profilePicture = null);
    Task<IActionResult> DeleteProfilePictureAsync(string? userId);
    Task<IActionResult> UploadCVAsync(string? userId, IFormFile cvFile);
    Task<IActionResult> DeleteCVAsync(string? userId);
    Task<IActionResult> UploadBannerAsync(string? userId, IFormFile bannerFile);
    Task<IActionResult> DeleteBannerAsync(string? userId);
    Task<IActionResult> GetUserCVAsync(string userId);
    Task<IActionResult> DownloadUserCVAsync(string userId);
    Task<IActionResult> ApproveEmail(ApproveEmailRequestDto? request);
    Task<IActionResult> SeedAdminAsync(RegisterRequestDto request);
    Task<IActionResult> SeedUsersAsync();
    Task<IActionResult> DeleteAllUsersAsync();
    Task<IActionResult> GetAllUsersAsync(string? currentUserId, int page = 1, int pageSize = 10);
    Task<IActionResult> GetUserByIdAsync(string userId);
    Task<IActionResult> ToggleRFIDAsync(string userId);
    Task<IActionResult> UpdateThemePreferenceAsync(string? userId, UpdateThemePreferenceDto request);
    Task<IActionResult> DeleteUserByIdAsync(string userId);
    Task<IActionResult> PromoteToFullMemberAsync(string userId);
    Task<IActionResult> DemoteFromFullMemberAsync(string userId);
    Task<IActionResult> PromoteToAdminAsync(string userId);
    Task<IActionResult> DemoteFromAdminAsync(string userId);
    Task<IActionResult> ForgotPasswordAsync(ForgotPasswordDto request);
    Task<IActionResult> ResetPasswordAsync(ResetPasswordDto request);
    Task<IActionResult> GetLocationStatsAsync();
}
