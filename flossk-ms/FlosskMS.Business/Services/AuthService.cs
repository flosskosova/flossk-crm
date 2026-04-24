using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FlosskMS.Business.Configuration;
using FlosskMS.Business.DTOs;
using FlosskMS.Data;
using FlosskMS.Data.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace FlosskMS.Business.Services;

public class AuthService(
    UserManager<ApplicationUser> userManager,
    RoleManager<IdentityRole> roleManager,
    SignInManager<ApplicationUser> signInManager,
    ApplicationDbContext dbContext,
    IFileService fileService,
    IEmailService emailService,
    IOptions<JwtSettings> jwtSettings) : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager = userManager;
    private readonly RoleManager<IdentityRole> _roleManager = roleManager;
    private readonly SignInManager<ApplicationUser> _signInManager = signInManager;
    private readonly ApplicationDbContext _dbContext = dbContext;
    private readonly IFileService _fileService = fileService;
    private readonly IEmailService _emailService = emailService;
    private readonly JwtSettings _jwtSettings = jwtSettings.Value;

    public async Task<IActionResult> RegisterAsync(RegisterRequestDto request)
    {
        var isEmailApproved = await _dbContext.ApprovedEmails
            .AnyAsync(e => e.Email.ToLower() == request.Email.ToLower());

        if (!isEmailApproved)
        {
            return new BadRequestObjectResult(new AuthResponseDto
            {
                Errors = ["This email is not approved for registration."]
            });
        }

        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return new BadRequestObjectResult(new AuthResponseDto
            {
                Errors = ["A user with this email already exists."]
            });
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            return new BadRequestObjectResult(new AuthResponseDto
            {
                Errors = result.Errors.Select(e => e.Description).ToList()
            });
        }

        // Assign default "User" role
        await _userManager.AddToRoleAsync(user, "User");

        return new OkObjectResult(new AuthResponseDto
        {
            Success = true,
            User = await MapToUserDtoAsync(user)
        });
    }

    public async Task<IActionResult> LoginAsync(LoginRequestDto request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
        {
            return new BadRequestObjectResult(new AuthResponseDto
            {
                Errors = ["Invalid email or password."]
            });
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: false);

        if (!result.Succeeded)
        {
            return new BadRequestObjectResult(new AuthResponseDto
            {
                Errors = ["Invalid email or password."]
            });
        }

        var expireMinutes = request.RememberMe ? 60 * 24 * 10 : _jwtSettings.ExpirationInMinutes;
        var token = await GenerateJwtTokenAsync(user, expireMinutes);
        var expiration = DateTime.UtcNow.AddMinutes(expireMinutes);

        return new OkObjectResult(new AuthResponseDto
        {
            Success = true,
            Token = token,
            Expiration = expiration,
            User = await MapToUserDtoAsync(user)
        });
    }

    public async Task<IActionResult> TraineeRegisterAsync(TraineeRegisterRequestDto request)
    {
        // Validate voucher
        var code = request.VoucherCode.Trim().ToUpperInvariant();
        var voucher = await _dbContext.CourseVouchers
            .FirstOrDefaultAsync(v => v.Code == code);

        if (voucher == null)
        {
            return new BadRequestObjectResult(new AuthResponseDto
            {
                Errors = ["Invalid voucher code."]
            });
        }

        // Single-use vouchers that have already been redeemed cannot be re-used
        if (!voucher.IsMultiUse && voucher.IsUsed)
        {
            return new BadRequestObjectResult(new AuthResponseDto
            {
                Errors = ["This voucher has already been used."]
            });
        }

        // If user already exists, tell them to log in instead
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return new BadRequestObjectResult(new AuthResponseDto
            {
                Errors = ["An account with this email already exists. Please sign in using your email."]
            });
        }

        // Split full name into first / last
        var nameParts = request.FullName.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        var firstName = nameParts[0];
        var lastName = nameParts.Length > 1 ? nameParts[1] : string.Empty;

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FirstName = firstName,
            LastName = lastName,
            CreatedAt = DateTime.UtcNow
        };

        // Generate a random un-guessable password — trainees authenticate by email + voucher check
        var randomPassword = $"Tr@{Guid.NewGuid():N}1";
        var createResult = await _userManager.CreateAsync(user, randomPassword);

        if (!createResult.Succeeded)
        {
            return new BadRequestObjectResult(new AuthResponseDto
            {
                Errors = createResult.Errors.Select(e => e.Description).ToList()
            });
        }

        // Ensure the Trainee role exists, then assign it
        if (!await _roleManager.RoleExistsAsync("Trainee"))
            await _roleManager.CreateAsync(new IdentityRole("Trainee"));

        await _userManager.AddToRoleAsync(user, "Trainee");

        // Record the redemption
        _dbContext.CourseVoucherRedemptions.Add(new FlosskMS.Data.Entities.CourseVoucherRedemption
        {
            Id = Guid.NewGuid(),
            CourseVoucherId = voucher.Id,
            UserId = user.Id,
            RedeemedAt = DateTime.UtcNow
        });

        // Update voucher usage counters
        voucher.UsedCount++;
        if (!voucher.IsMultiUse)
            voucher.IsUsed = true;
        voucher.RedeemedByEmails.Add(user.Email!);

        await _dbContext.SaveChangesAsync();

        var token = await GenerateJwtTokenAsync(user);
        var expiration = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationInMinutes);

        return new OkObjectResult(new AuthResponseDto
        {
            Success = true,
            Token = token,
            Expiration = expiration,
            User = await MapToUserDtoAsync(user),
            CourseId = voucher.CourseId
        });
    }

    public async Task<IActionResult> TraineeLoginAsync(TraineeLoginRequestDto request)
    {
        var user = await _dbContext.Users
            .Include(u => u.UploadedFiles)
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null)
        {
            return new BadRequestObjectResult(new AuthResponseDto
            {
                Errors = ["No account found for this email address."]
            });
        }

        // Only Trainee-role accounts can use this endpoint
        if (!await _userManager.IsInRoleAsync(user, "Trainee"))
        {
            return new BadRequestObjectResult(new AuthResponseDto
            {
                Errors = ["This email is not associated with a trainee account. Please use the standard login."]
            });
        }

        // Verify the trainee actually redeemed a voucher (i.e., is legitimately enrolled)
        var redemption = await _dbContext.CourseVoucherRedemptions
            .Include(r => r.Voucher)
            .Where(r => r.UserId == user.Id)
            .OrderByDescending(r => r.RedeemedAt)
            .FirstOrDefaultAsync();

        if (redemption == null)
        {
            return new BadRequestObjectResult(new AuthResponseDto
            {
                Errors = ["No course enrolment found for this email address."]
            });
        }

        var token = await GenerateJwtTokenAsync(user);
        var expiration = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationInMinutes);

        return new OkObjectResult(new AuthResponseDto
        {
            Success = true,
            Token = token,
            Expiration = expiration,
            User = await MapToUserDtoAsync(user),
            CourseId = redemption.Voucher.CourseId
        });
    }

    public async Task<IActionResult> GetLoggedInUserAsync(string? userId)
    {
        if (string.IsNullOrEmpty(userId))
        {
            return new UnauthorizedResult();
        }

        var user = await _dbContext.Users
            .Include(u => u.UploadedFiles)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return new NotFoundResult();
        }

        return new OkObjectResult(await MapToUserDtoAsync(user));
    }

    public async Task<IActionResult> UpdateUserAsync(string? userId, UpdateUserDto request, IFormFile? profilePicture = null)
    {
        if (string.IsNullOrEmpty(userId))
        {
            return new UnauthorizedResult();
        }

        var user = await _dbContext.Users
            .Include(u => u.UploadedFiles)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return new NotFoundResult();
        }

        // Update editable fields
        user.Biography = request.Biography;
        user.PhoneNumber = request.PhoneNumber;
        user.Location = request.Location;
        user.WebsiteUrl = request.WebsiteUrl;
        user.SocialLinks = request.SocialLinks;
        user.Skills = request.Skills;
        user.UpdatedAt = DateTime.UtcNow;

        // Handle profile picture upload if provided
        if (profilePicture != null)
        {
            // Remove existing profile picture if any
            var existingProfilePicture = user.UploadedFiles.FirstOrDefault(f => f.FileType == FileType.ProfilePicture);
            if (existingProfilePicture != null)
            {
                await _fileService.DeleteFileAsync(existingProfilePicture.Id, userId, isAdmin: true);
            }

            // Upload new profile picture
            var uploadResult = await _fileService.UploadFileAsync(profilePicture, userId);
            if (!uploadResult.Success)
            {
                return new BadRequestObjectResult(new AuthResponseDto
                {
                    Errors = [uploadResult.Error ?? "Failed to upload profile picture."]
                });
            }

            // Update the uploaded file to be a profile picture
            var uploadedFile = await _dbContext.UploadedFiles.FindAsync(uploadResult.FileId);
            if (uploadedFile != null)
            {
                uploadedFile.FileType = FileType.ProfilePicture;
                uploadedFile.UserId = userId;
            }
        }

        await _dbContext.SaveChangesAsync();

        // Reload user with updated files
        user = await _dbContext.Users
            .Include(u => u.UploadedFiles)
            .FirstOrDefaultAsync(u => u.Id == userId);

        return new OkObjectResult(await MapToUserDtoAsync(user!));
    }

    public async Task<IActionResult> DeleteProfilePictureAsync(string? userId)
    {
        if (string.IsNullOrEmpty(userId))
        {
            return new UnauthorizedResult();
        }

        var user = await _dbContext.Users
            .Include(u => u.UploadedFiles)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return new NotFoundResult();
        }

        var profilePicture = user.UploadedFiles.FirstOrDefault(f => f.FileType == FileType.ProfilePicture);
        if (profilePicture == null)
        {
            return new NotFoundObjectResult(new AuthResponseDto
            {
                Errors = ["No profile picture found."]
            });
        }

        await _fileService.DeleteFileAsync(profilePicture.Id, userId, isAdmin: true);

        // Reload user with updated files
        user = await _dbContext.Users
            .Include(u => u.UploadedFiles)
            .FirstOrDefaultAsync(u => u.Id == userId);

        return new OkObjectResult(await MapToUserDtoAsync(user!));
    }

    public async Task<IActionResult> ApproveEmail(ApproveEmailRequestDto? request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Email))
        {
            return new BadRequestObjectResult(new AuthResponseDto
            {
                Errors = ["Email is required."]
            });
        }

        var isEmailAlreadyApproved = await _dbContext.ApprovedEmails
            .AnyAsync(e => e.Email.ToLower() == request.Email.ToLower());

        if (isEmailAlreadyApproved)
        {
            return new BadRequestObjectResult(new AuthResponseDto
            {
                Errors = ["This email is already approved."]
            });
        }

        var approvedEmail = new ApprovedEmail
        {
            Email = request.Email
        };

        _dbContext.ApprovedEmails.Add(approvedEmail);
        await _dbContext.SaveChangesAsync();

        return new OkObjectResult(new AuthResponseDto
        {
            Success = true
        });
    }

    public async Task<IActionResult> SeedAdminAsync(RegisterRequestDto request)
    {
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return new BadRequestObjectResult(new AuthResponseDto
            {
                Errors = ["A user with this email already exists."]
            });
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            return new BadRequestObjectResult(new AuthResponseDto
            {
                Errors = result.Errors.Select(e => e.Description).ToList()
            });
        }

        // Assign requested role
        var allowedRoles = new[] { "User", "Admin", "Full Member" };
        var targetRole = allowedRoles.Contains(request.Role) ? request.Role : "User";
        await _userManager.AddToRoleAsync(user, targetRole);

        // Auto-approve the admin email
        var isEmailApproved = await _dbContext.ApprovedEmails
            .AnyAsync(e => e.Email.ToLower() == request.Email.ToLower());
        
        if (!isEmailApproved)
        {
            _dbContext.ApprovedEmails.Add(new ApprovedEmail { Email = request.Email });
            await _dbContext.SaveChangesAsync();
        }

        return new OkObjectResult(new AuthResponseDto
        {
            Success = true,
            User = await MapToUserDtoAsync(user)
        });
    }

    public async Task<IActionResult> SeedUsersAsync()
    {
        var biography = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.";
        var socialLinks = new List<string>
        {
            "https://github.com/",
            "https://www.linkedin.com/",
            "https://x.com/",
            "https://www.instagram.com/"
        };
        var skills = new List<string> { "React", "Angular", ".NET", "TypeScript", "Python" };

        var testUsers = new[]
        {
            new { Email = "kessler_fabiola24@yahoo.com", FirstName = "Fabiola", LastName = "Kessler", Phone = "+38349111111", Location = "Prishtina", Website = "https://fabiola.dev" },
            new { Email = "pat_mckinley65@mail.com", FirstName = "Pat", LastName = "McKinley", Phone = "+38349222222", Location = "Prizren", Website = "https://pat.dev" },
            new { Email = "amy-house40@aol.com", FirstName = "Amy", LastName = "House", Phone = "+38349333333", Location = "Peja", Website = "https://amy.dev" },
            new { Email = "griffith_zachariah82@outlook.com", FirstName = "Zachariah", LastName = "Griffith", Phone = "+38349444444", Location = "Gjakova", Website = "https://zachariah.dev" },
            new { Email = "cheyenne_atwood36@aol.com", FirstName = "Cheyenne", LastName = "Atwood", Phone = "+38349555555", Location = "Ferizaj", Website = "https://cheyenne.dev" },
            new { Email = "octavio-shoemaker44@aol.com", FirstName = "Octavio", LastName = "Shoemaker", Phone = "+38349666666", Location = "Mitrovica", Website = "https://octavio.dev" },
            new { Email = "fulton-addisyn27@mail.com", FirstName = "Addisyn", LastName = "Fulton", Phone = "+38349777777", Location = "Gjilan", Website = "https://addisyn.dev" },
            new { Email = "ariel_alonso81@outlook.com", FirstName = "Ariel", LastName = "Alonso", Phone = "+38349888888", Location = "Vushtrri", Website = "https://ariel.dev" },
            new { Email = "don_montoya24@mail.com", FirstName = "Don", LastName = "Montoya", Phone = "+38349999999", Location = "Podujeva", Website = "https://don.dev" },
            new { Email = "vasquez-consuelo8@outlook.com", FirstName = "Consuelo", LastName = "Vasquez", Phone = "+38349000000", Location = "Suhareka", Website = "https://consuelo.dev" }
        };

        var createdUsers = new List<UserDto>();
        var errors = new List<string>();
        var defaultPassword = "P@ssword123";

        foreach (var testUser in testUsers)
        {
            var existingUser = await _userManager.FindByEmailAsync(testUser.Email);
            if (existingUser != null)
            {
                errors.Add($"User {testUser.Email} already exists.");
                continue;
            }

            // Check if email is approved
            var isEmailApproved = await _dbContext.ApprovedEmails
                .AnyAsync(e => e.Email.ToLower() == testUser.Email.ToLower());

            if (!isEmailApproved)
            {
                // Auto-approve the email
                _dbContext.ApprovedEmails.Add(new ApprovedEmail { Email = testUser.Email });
                await _dbContext.SaveChangesAsync();
            }

            var user = new ApplicationUser
            {
                UserName = testUser.Email,
                Email = testUser.Email,
                FirstName = testUser.FirstName,
                LastName = testUser.LastName,
                Biography = biography,
                PhoneNumber = testUser.Phone,
                Location = testUser.Location,
                WebsiteUrl = testUser.Website,
                SocialLinks = socialLinks,
                Skills = skills,
                CreatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, defaultPassword);

            if (!result.Succeeded)
            {
                errors.Add($"Failed to create {testUser.Email}: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                continue;
            }

            // Assign User role
            await _userManager.AddToRoleAsync(user, "User");
            createdUsers.Add(await MapToUserDtoAsync(user));
        }

        return new OkObjectResult(new
        {
            Success = true,
            Message = $"Created {createdUsers.Count} users.",
            CreatedUsers = createdUsers,
            Errors = errors
        });
    }

    public async Task<IActionResult> DeleteAllUsersAsync()
    {
        var protectedEmail = "daorsahyseni@gmail.com";
        
        var usersToDelete = await _dbContext.Users
            .Where(u => u.Email != null && u.Email.ToLower() != protectedEmail.ToLower())
            .ToListAsync();

        if (usersToDelete.Count == 0)
        {
            return new OkObjectResult(new
            {
                Success = true,
                Message = "No users to delete.",
                DeletedCount = 0
            });
        }

        var deletedCount = 0;
        var errors = new List<string>();

        foreach (var user in usersToDelete)
        {
            // Delete the approved email entry if it exists
            if (user.Email != null)
            {
                var approvedEmail = await _dbContext.ApprovedEmails
                    .FirstOrDefaultAsync(e => e.Email.ToLower() == user.Email.ToLower());
                if (approvedEmail != null)
                {
                    _dbContext.ApprovedEmails.Remove(approvedEmail);
                }
            }

            var result = await _userManager.DeleteAsync(user);
            if (result.Succeeded)
            {
                deletedCount++;
            }
            else
            {
                errors.Add($"Failed to delete {user.Email}: {string.Join(", ", result.Errors.Select(e => e.Description))}");
            }
        }

        return new OkObjectResult(new
        {
            Success = true,
            Message = $"Deleted {deletedCount} users.",
            DeletedCount = deletedCount,
            Errors = errors
        });
    }

    public async Task<IActionResult> GetAllUsersAsync(string? currentUserId, int page = 1, int pageSize = 10)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _dbContext.Users.AsQueryable();

        // Exclude the currently logged in user
        if (!string.IsNullOrEmpty(currentUserId))
        {
            query = query.Where(u => u.Id != currentUserId);
        }

        var totalCount = await query.CountAsync();

        var users = await query
            .Include(u => u.UploadedFiles)
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var userDtos = new List<UserDto>();
        foreach (var user in users)
        {
            userDtos.Add(await MapToUserDtoAsync(user));
        }

        return new OkObjectResult(new
        {
            Users = userDtos,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    public async Task<IActionResult> GetLocationStatsAsync()
    {
        var stats = await _dbContext.Users
            .Where(u => u.Location != null && u.Location != string.Empty)
            .GroupBy(u => u.Location!)
            .Select(g => new
            {
                Location = g.Key,
                Count = g.Count(),
                Members = g.Select(u => u.FirstName + " " + u.LastName).ToList()
            })
            .OrderByDescending(x => x.Count)
            .ToListAsync();

        return new OkObjectResult(stats);
    }

    public async Task<IActionResult> GetUserByIdAsync(string userId)
    {
        if (string.IsNullOrEmpty(userId))
        {
            return new BadRequestObjectResult(new { Error = "User ID is required." });
        }

        var user = await _dbContext.Users
            .Include(u => u.UploadedFiles)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return new NotFoundObjectResult(new { Error = "User not found." });
        }

        return new OkObjectResult(await MapToUserDtoAsync(user));
    }

    public async Task<IActionResult> PromoteToFullMemberAsync(string userId)
    {
        if (string.IsNullOrEmpty(userId))
        {
            return new BadRequestObjectResult(new { Error = "User ID is required." });
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return new NotFoundObjectResult(new { Error = "User not found." });
        }

        var userRoles = await _userManager.GetRolesAsync(user);
        if (userRoles.Contains("Admin"))
        {
            return new BadRequestObjectResult(new { Error = "Admin users cannot be promoted to Full Member." });
        }

        if (userRoles.Contains("Full Member"))
        {
            return new BadRequestObjectResult(new { Error = "User is already a Full Member." });
        }

        if (!await _roleManager.RoleExistsAsync("Full Member"))
        {
            await _roleManager.CreateAsync(new IdentityRole("Full Member"));
        }

        var result = await _userManager.AddToRoleAsync(user, "Full Member");
        if (!result.Succeeded)
        {
            return new BadRequestObjectResult(new { Errors = result.Errors.Select(e => e.Description) });
        }

        if (userRoles.Contains("User"))
        {
            await _userManager.RemoveFromRoleAsync(user, "User");
        }

        return new OkObjectResult(new
        {
            Success = true,
            Message = $"User {user.Email} has been promoted to Full Member.",
            User = await MapToUserDtoAsync(user)
        });
    }

    public async Task<IActionResult> PromoteToAdminAsync(string userId)
    {
        if (string.IsNullOrEmpty(userId))
        {
            return new BadRequestObjectResult(new { Error = "User ID is required." });
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return new NotFoundObjectResult(new { Error = "User not found." });
        }

        var userRoles = await _userManager.GetRolesAsync(user);
        if (userRoles.Contains("Admin"))
        {
            return new BadRequestObjectResult(new { Error = "User is already an Admin." });
        }

        if (!await _roleManager.RoleExistsAsync("Admin"))
        {
            await _roleManager.CreateAsync(new IdentityRole("Admin"));
        }

        var result = await _userManager.AddToRoleAsync(user, "Admin");
        if (!result.Succeeded)
        {
            return new BadRequestObjectResult(new { Errors = result.Errors.Select(e => e.Description) });
        }

        return new OkObjectResult(new
        {
            Success = true,
            Message = $"User {user.Email} has been promoted to Admin.",
            User = await MapToUserDtoAsync(user)
        });
    }

    public async Task<IActionResult> DemoteFromAdminAsync(string userId)
    {
        if (string.IsNullOrEmpty(userId))
        {
            return new BadRequestObjectResult(new { Error = "User ID is required." });
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return new NotFoundObjectResult(new { Error = "User not found." });
        }

        var userRoles = await _userManager.GetRolesAsync(user);
        if (!userRoles.Contains("Admin"))
        {
            return new BadRequestObjectResult(new { Error = "User is not an Admin." });
        }

        var result = await _userManager.RemoveFromRoleAsync(user, "Admin");
        if (!result.Succeeded)
        {
            return new BadRequestObjectResult(new { Errors = result.Errors.Select(e => e.Description) });
        }

        return new OkObjectResult(new
        {
            Success = true,
            Message = $"Admin role removed from {user.Email}.",
            User = await MapToUserDtoAsync(user)
        });
    }

    public async Task<IActionResult> DemoteFromFullMemberAsync(string userId)
    {
        if (string.IsNullOrEmpty(userId))
        {
            return new BadRequestObjectResult(new { Error = "User ID is required." });
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return new NotFoundObjectResult(new { Error = "User not found." });
        }

        var userRoles = await _userManager.GetRolesAsync(user);
        if (!userRoles.Contains("Full Member"))
        {
            return new BadRequestObjectResult(new { Error = "User is not a Full Member." });
        }

        var result = await _userManager.RemoveFromRoleAsync(user, "Full Member");
        if (!result.Succeeded)
        {
            return new BadRequestObjectResult(new { Errors = result.Errors.Select(e => e.Description) });
        }

        if (!userRoles.Contains("User"))
        {
            await _userManager.AddToRoleAsync(user, "User");
        }

        return new OkObjectResult(new
        {
            Success = true,
            Message = $"User {user.Email} has been demoted to User.",
            User = await MapToUserDtoAsync(user)
        });
    }

    public async Task<IActionResult> ToggleRFIDAsync(string userId)
    {
        if (string.IsNullOrEmpty(userId))
        {
            return new BadRequestObjectResult(new { Error = "User ID is required." });
        }

        var user = await _dbContext.Users
            .Include(u => u.UploadedFiles)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return new NotFoundObjectResult(new { Error = "User not found." });
        }

        user.RFID = !user.RFID;
        user.UpdatedAt = DateTime.UtcNow;
        
        _dbContext.Users.Update(user);
        await _dbContext.SaveChangesAsync();

        return new OkObjectResult(new
        {
            Success = true,
            Message = $"RFID toggled to {user.RFID} for user {user.Email}.",
            User = await MapToUserDtoAsync(user)
        });
    }

    public async Task<IActionResult> UpdateThemePreferenceAsync(string? userId, UpdateThemePreferenceDto request)
    {
        if (string.IsNullOrEmpty(userId))
        {
            return new UnauthorizedResult();
        }

        var user = await _dbContext.Users
            .Include(u => u.UploadedFiles)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return new NotFoundObjectResult(new { Error = "User not found." });
        }

        user.DarkTheme = request.DarkTheme;
        user.UpdatedAt = DateTime.UtcNow;
        
        _dbContext.Users.Update(user);
        await _dbContext.SaveChangesAsync();

        return new OkObjectResult(new
        {
            Success = true,
            DarkTheme = user.DarkTheme
        });
    }

    public async Task<IActionResult> DeleteUserByIdAsync(string userId)
    {
        if (string.IsNullOrEmpty(userId))
        {
            return new BadRequestObjectResult(new { Error = "User ID is required." });
        }

        var protectedEmail = "daorsahyseni@gmail.com";
        var user = await _userManager.FindByIdAsync(userId);

        if (user == null)
        {
            return new NotFoundObjectResult(new { Error = "User not found." });
        }

        if (user.Email?.ToLower() == protectedEmail.ToLower())
        {
            return new BadRequestObjectResult(new { Error = "Cannot delete the protected admin user." });
        }

        // Delete the approved email entry if it exists
        var approvedEmail = await _dbContext.ApprovedEmails
            .FirstOrDefaultAsync(e => e.Email.ToLower() == user.Email!.ToLower());
        if (approvedEmail != null)
        {
            _dbContext.ApprovedEmails.Remove(approvedEmail);
            await _dbContext.SaveChangesAsync();
        }

        var result = await _userManager.DeleteAsync(user);

        if (!result.Succeeded)
        {
            return new BadRequestObjectResult(new
            {
                Error = "Failed to delete user.",
                Details = result.Errors.Select(e => e.Description).ToList()
            });
        }

        return new OkObjectResult(new
        {
            Success = true,
            Message = $"User {user.Email} deleted successfully."
        });
    }

    public async Task<IActionResult> UploadCVAsync(string? userId, IFormFile cvFile)
    {
        if (string.IsNullOrEmpty(userId))
        {
            return new UnauthorizedResult();
        }

        var user = await _dbContext.Users
            .Include(u => u.UploadedFiles)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return new NotFoundResult();
        }

        // Validate file type (PDF only)
        var allowedExtensions = new[] { ".pdf" };
        var fileExtension = Path.GetExtension(cvFile.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(fileExtension))
        {
            return new BadRequestObjectResult(new AuthResponseDto
            {
                Errors = ["Only PDF files are allowed for CV upload."]
            });
        }

        // Remove existing CV if any
        var existingCV = user.UploadedFiles.FirstOrDefault(f => f.FileType == FileType.CV);
        if (existingCV != null)
        {
            await _fileService.DeleteFileAsync(existingCV.Id, userId, isAdmin: true);
        }

        // Upload new CV
        var uploadResult = await _fileService.UploadFileAsync(cvFile, userId);
        if (!uploadResult.Success)
        {
            return new BadRequestObjectResult(new AuthResponseDto
            {
                Errors = [uploadResult.Error ?? "Failed to upload CV."]
            });
        }

        // Update the uploaded file to be a CV
        var uploadedFile = await _dbContext.UploadedFiles.FindAsync(uploadResult.FileId);
        if (uploadedFile != null)
        {
            uploadedFile.FileType = FileType.CV;
            uploadedFile.UserId = userId;
        }

        await _dbContext.SaveChangesAsync();

        // Reload user with updated files
        user = await _dbContext.Users
            .Include(u => u.UploadedFiles)
            .FirstOrDefaultAsync(u => u.Id == userId);

        return new OkObjectResult(await MapToUserDtoAsync(user!));
    }

    public async Task<IActionResult> DeleteCVAsync(string? userId)
    {
        if (string.IsNullOrEmpty(userId))
        {
            return new UnauthorizedResult();
        }

        var user = await _dbContext.Users
            .Include(u => u.UploadedFiles)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return new NotFoundResult();
        }

        var cvFile = user.UploadedFiles.FirstOrDefault(f => f.FileType == FileType.CV);
        if (cvFile == null)
        {
            return new NotFoundObjectResult(new AuthResponseDto
            {
                Errors = ["No CV found."]
            });
        }

        await _fileService.DeleteFileAsync(cvFile.Id, userId, isAdmin: true);

        // Reload user with updated files
        user = await _dbContext.Users
            .Include(u => u.UploadedFiles)
            .FirstOrDefaultAsync(u => u.Id == userId);

        return new OkObjectResult(await MapToUserDtoAsync(user!));
    }

    public async Task<IActionResult> UploadBannerAsync(string? userId, IFormFile bannerFile)
    {
        if (string.IsNullOrEmpty(userId))
            return new UnauthorizedResult();

        var user = await _dbContext.Users
            .Include(u => u.UploadedFiles)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return new NotFoundResult();

        // Validate image type
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        var fileExtension = Path.GetExtension(bannerFile.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(fileExtension))
        {
            return new BadRequestObjectResult(new AuthResponseDto
            {
                Errors = ["Only image files are allowed for the banner."]
            });
        }

        // Remove existing banner if any
        var existingBanner = user.UploadedFiles.FirstOrDefault(f => f.FileType == FileType.ProfileBanner);
        if (existingBanner != null)
            await _fileService.DeleteFileAsync(existingBanner.Id, userId, isAdmin: true);

        // Upload new banner
        var uploadResult = await _fileService.UploadFileAsync(bannerFile, userId);
        if (!uploadResult.Success)
        {
            return new BadRequestObjectResult(new AuthResponseDto
            {
                Errors = [uploadResult.Error ?? "Failed to upload banner."]
            });
        }

        var uploadedFile = await _dbContext.UploadedFiles.FindAsync(uploadResult.FileId);
        if (uploadedFile != null)
        {
            uploadedFile.FileType = FileType.ProfileBanner;
            uploadedFile.UserId = userId;
        }

        await _dbContext.SaveChangesAsync();

        user = await _dbContext.Users
            .Include(u => u.UploadedFiles)
            .FirstOrDefaultAsync(u => u.Id == userId);

        return new OkObjectResult(await MapToUserDtoAsync(user!));
    }

    public async Task<IActionResult> DeleteBannerAsync(string? userId)
    {
        if (string.IsNullOrEmpty(userId))
            return new UnauthorizedResult();

        var user = await _dbContext.Users
            .Include(u => u.UploadedFiles)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return new NotFoundResult();

        var bannerFile = user.UploadedFiles.FirstOrDefault(f => f.FileType == FileType.ProfileBanner);
        if (bannerFile == null)
        {
            return new NotFoundObjectResult(new AuthResponseDto
            {
                Errors = ["No banner found."]
            });
        }

        await _fileService.DeleteFileAsync(bannerFile.Id, userId, isAdmin: true);

        user = await _dbContext.Users
            .Include(u => u.UploadedFiles)
            .FirstOrDefaultAsync(u => u.Id == userId);

        return new OkObjectResult(await MapToUserDtoAsync(user!));
    }

    public async Task<IActionResult> GetUserCVAsync(string userId)
    {
        var user = await _dbContext.Users
            .Include(u => u.UploadedFiles)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return new NotFoundResult();
        }

        var cvFile = user.UploadedFiles.FirstOrDefault(f => f.FileType == FileType.CV);
        if (cvFile == null)
        {
            return new NotFoundObjectResult(new { Error = "No CV found for this user." });
        }

        return new OkObjectResult(new
        {
            CVUrl = $"/uploads/{cvFile.FileName}"
        });
    }

    public async Task<IActionResult> DownloadUserCVAsync(string userId)
    {
        var user = await _dbContext.Users
            .Include(u => u.UploadedFiles)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return new NotFoundResult();
        }

        var cvFile = user.UploadedFiles.FirstOrDefault(f => f.FileType == FileType.CV);
        if (cvFile == null)
        {
            return new NotFoundObjectResult(new { Error = "No CV found for this user." });
        }

        var (fileStream, contentType, _) = await _fileService.DownloadFileAsync(cvFile.Id);
        if (fileStream == null)
        {
            return new NotFoundObjectResult(new { Error = "CV file not found on server." });
        }

        var fileName = $"{user.FirstName}_{user.LastName}_CV.pdf";

        using var memoryStream = new MemoryStream();
        await fileStream.CopyToAsync(memoryStream);
        var fileBytes = memoryStream.ToArray();

        return new FileContentResult(fileBytes, contentType ?? "application/pdf")
        {
            FileDownloadName = fileName
        };
    }

    private async Task<string> GenerateJwtTokenAsync(ApplicationUser user, int? expirationInMinutes = null)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Secret));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var roles = await _userManager.GetRolesAsync(user);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim("firstName", user.FirstName),
            new Claim("lastName", user.LastName)
        };

        // Add role claims
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var expiry = expirationInMinutes ?? _jwtSettings.ExpirationInMinutes;

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiry),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task<UserDto> MapToUserDtoAsync(ApplicationUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var profilePicture = user.UploadedFiles?.FirstOrDefault(f => f.FileType == FileType.ProfilePicture);
        var cvFile = user.UploadedFiles?.FirstOrDefault(f => f.FileType == FileType.CV);
        var bannerFile = user.UploadedFiles?.FirstOrDefault(f => f.FileType == FileType.ProfileBanner);
        
        // Convert file path to URL path (e.g., /uploads/filename.jpg)
        string? profilePictureUrl = null;
        if (profilePicture != null)
        {
            profilePictureUrl = $"/uploads/{profilePicture.FileName}";
        }

        string? cvUrl = null;
        if (cvFile != null)
        {
            cvUrl = $"/uploads/{cvFile.FileName}";
        }

        string? bannerUrl = null;
        if (bannerFile != null)
        {
            bannerUrl = $"/uploads/{bannerFile.FileName}";
        }
        
        return new UserDto
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Biography = user.Biography,
            PhoneNumber = user.PhoneNumber,
            Location = user.Location,
            RFID = user.RFID,
            DarkTheme = user.DarkTheme,
            WebsiteUrl = user.WebsiteUrl,
            SocialLinks = user.SocialLinks,
            Skills = user.Skills,
            CreatedAt = user.CreatedAt,
            Roles = [.. roles],
            ProfilePictureUrl = profilePictureUrl,
            CVUrl = cvUrl,
            BannerUrl = bannerUrl
        };
    }

    public async Task<IActionResult> ForgotPasswordAsync(ForgotPasswordDto request)
    {
        // Always return the same response to avoid leaking whether an email exists
        var generic = new OkObjectResult(new { Message = "If that email is registered, a password reset link has been sent." });

        if (string.IsNullOrWhiteSpace(request.Email))
            return generic;

        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
            return generic;

        var rawToken = await _userManager.GeneratePasswordResetTokenAsync(user);
        // URL-safe base64 encode because the token contains special characters
        var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(rawToken));

        // Store issue time so we can enforce 30-minute expiry on reset
        await _userManager.SetAuthenticationTokenAsync(user, "PasswordReset", "IssuedAt", DateTime.UtcNow.ToString("O"));

        var frontendBaseUrl = Environment.GetEnvironmentVariable("SmtpSettings__FrontendBaseUrl") ?? "http://localhost:4200";
        var resetLink = $"{frontendBaseUrl}/auth/reset-password?token={encodedToken}&email={Uri.EscapeDataString(request.Email)}";

        var displayName = $"{user.FirstName} {user.LastName}".Trim();
        if (string.IsNullOrWhiteSpace(displayName)) displayName = request.Email;

        try
        {
            await _emailService.SendPasswordResetEmailAsync(request.Email, displayName, resetLink);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[EMAIL ERROR] {ex.GetType().Name}: {ex.Message}");
            return new ObjectResult(new { Message = "Email service is temporarily unavailable. Please try again later." })
            {
                StatusCode = 503
            };
        }

        return generic;
    }

    public async Task<IActionResult> ResetPasswordAsync(ResetPasswordDto request)
    {
        if (request.NewPassword != request.ConfirmPassword)
            return new BadRequestObjectResult(new { Message = "Passwords do not match." });

        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
            return new BadRequestObjectResult(new { Message = "Invalid request." });

        // Enforce 30-minute expiry
        var issuedAtStr = await _userManager.GetAuthenticationTokenAsync(user, "PasswordReset", "IssuedAt");
        if (issuedAtStr == null ||
            !DateTime.TryParse(issuedAtStr, null, System.Globalization.DateTimeStyles.RoundtripKind, out var issuedAt) ||
            DateTime.UtcNow - issuedAt > TimeSpan.FromMinutes(30))
        {
            return new BadRequestObjectResult(new { Message = "This password reset link has expired. Please request a new one." });
        }

        string rawToken;
        try
        {
            rawToken = System.Text.Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(request.Token));
        }
        catch
        {
            return new BadRequestObjectResult(new { Message = "Invalid or malformed token." });
        }

        var result = await _userManager.ResetPasswordAsync(user, rawToken, request.NewPassword);

        if (!result.Succeeded)
        {
            return new BadRequestObjectResult(new
            {
                Message = "Password reset failed.",
                Errors = result.Errors.Select(e => e.Description).ToList()
            });
        }

        // Remove the IssuedAt record so the link cannot be reused
        await _userManager.RemoveAuthenticationTokenAsync(user, "PasswordReset", "IssuedAt");

        return new OkObjectResult(new { Message = "Password has been reset successfully. You can now log in." });
    }
}
