using System.Security.Claims;
using FlosskMS.Business.DTOs;
using FlosskMS.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlosskMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(IAuthService authService) : ControllerBase
{
    private readonly IAuthService _authService = authService;

    /// <summary>
    /// Quick login with default dev credentials (Development only)
    /// </summary>
    [HttpPost("dev-login")]
    public async Task<IActionResult> DevLogin()
        => await _authService.LoginAsync(new LoginRequestDto
        {
            Email = "daorsahyseni@gmail.com",
            Password = "P@ssword321"
        });

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
        => await _authService.RegisterAsync(request);

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        => await _authService.LoginAsync(request);

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetLoggedInUser()
        => await _authService.GetLoggedInUserAsync(User.FindFirstValue(ClaimTypes.NameIdentifier));

    [Authorize]
    [HttpPatch("me")]
    public async Task<IActionResult> UpdateUser([FromForm] UpdateUserDto request, IFormFile? profilePicture = null)
        => await _authService.UpdateUserAsync(User.FindFirstValue(ClaimTypes.NameIdentifier), request, profilePicture);

    [Authorize]
    [HttpDelete("me/profile-picture")]
    public async Task<IActionResult> DeleteProfilePicture()
        => await _authService.DeleteProfilePictureAsync(User.FindFirstValue(ClaimTypes.NameIdentifier));

    [Authorize]
    [HttpPost("me/banner")]
    public async Task<IActionResult> UploadBanner(IFormFile bannerFile)
        => await _authService.UploadBannerAsync(User.FindFirstValue(ClaimTypes.NameIdentifier), bannerFile);

    [Authorize]
    [HttpDelete("me/banner")]
    public async Task<IActionResult> DeleteBanner()
        => await _authService.DeleteBannerAsync(User.FindFirstValue(ClaimTypes.NameIdentifier));

    /// <summary>
    /// Upload or replace CV (PDF only)
    /// </summary>
    [Authorize]
    [HttpPost("me/cv")]
    public async Task<IActionResult> UploadCV(IFormFile cvFile)
        => await _authService.UploadCVAsync(User.FindFirstValue(ClaimTypes.NameIdentifier), cvFile);

    /// <summary>
    /// Delete CV
    /// </summary>
    [Authorize]
    [HttpDelete("me/cv")]
    public async Task<IActionResult> DeleteCV()
        => await _authService.DeleteCVAsync(User.FindFirstValue(ClaimTypes.NameIdentifier));

    /// <summary>
    /// Get user's CV by user ID
    /// </summary>
    [Authorize]
    [HttpGet("users/{userId}/cv")]
    public async Task<IActionResult> GetUserCV(string userId)
        => await _authService.GetUserCVAsync(userId);

    /// <summary>
    /// Download user's CV by user ID
    /// </summary>
    [Authorize]
    [HttpGet("users/{userId}/cv/download")]
    public async Task<IActionResult> DownloadUserCV(string userId)
        => await _authService.DownloadUserCVAsync(userId);

    [Authorize(Roles = "Admin")]
    [HttpPost("seed-admin")]
    public async Task<IActionResult> SeedAdmin([FromBody] RegisterRequestDto request)
        => await _authService.SeedAdminAsync(request);

    /// <summary>
    /// Seed test users (Development only - Admin required)
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPost("seed-users")]
    public async Task<IActionResult> SeedUsers()
        => await _authService.SeedUsersAsync();

    /// <summary>
    /// Delete all users except protected admin (Development only - Admin required)
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpDelete("delete-all-users")]
    public async Task<IActionResult> DeleteAllUsers()
        => await _authService.DeleteAllUsersAsync();

    /// <summary>
    /// Get member count grouped by location/city
    /// </summary>
    [Authorize]
    [HttpGet("users/location-stats")]
    public async Task<IActionResult> GetLocationStats()
        => await _authService.GetLocationStatsAsync();

    /// <summary>
    /// Get all users with pagination (Admin only)
    /// </summary>
    [Authorize]
    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
        => await _authService.GetAllUsersAsync(User.FindFirstValue(ClaimTypes.NameIdentifier), page, pageSize);

    /// <summary>
    /// Get a user by ID (Admin only)
    /// </summary>
    [Authorize]
    [HttpGet("users/{id}")]
    public async Task<IActionResult> GetUserById(string id)
        => await _authService.GetUserByIdAsync(id);

    /// <summary>
    /// Toggle RFID status for a user (Admin only)
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPatch("users/toggle-rfid/{id}")]
    public async Task<IActionResult> ToggleRFID(string id)
        => await _authService.ToggleRFIDAsync(id);

    /// <summary>
    /// Update theme preference for current user
    /// </summary>
    [Authorize]
    [HttpPatch("me/theme")]
    public async Task<IActionResult> UpdateThemePreference([FromBody] UpdateThemePreferenceDto request)
        => await _authService.UpdateThemePreferenceAsync(User.FindFirstValue(ClaimTypes.NameIdentifier), request);

    /// <summary>
    /// Promote a user to Full Member (Admin only). Admins cannot be promoted.
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPost("users/{id}/promote-full-member")]
    public async Task<IActionResult> PromoteToFullMember(string id)
        => await _authService.PromoteToFullMemberAsync(id);

    /// <summary>
    /// Demote a Full Member back to a normal User (Admin only).
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPost("users/{id}/demote-full-member")]
    public async Task<IActionResult> DemoteFromFullMember(string id)
        => await _authService.DemoteFromFullMemberAsync(id);

    /// <summary>
    /// Delete a user by ID (Admin only)
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUserById(string id)
        => await _authService.DeleteUserByIdAsync(id);

    [Authorize(Roles = "Admin")]
    [HttpPost("approve-email")]
    public async Task<IActionResult> ApproveEmail([FromBody] ApproveEmailRequestDto request)
        => await _authService.ApproveEmail(request);

    /// <summary>
    /// Send a password reset link to the user's email
    /// </summary>
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto request)
        => await _authService.ForgotPasswordAsync(request);

    /// <summary>
    /// Reset the user's password using a token received by email
    /// </summary>
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto request)
        => await _authService.ResetPasswordAsync(request);
}
