using FlosskMS.Business.Configuration;
using FlosskMS.Business.DTOs;
using FlosskMS.Business.Services;
using FlosskMS.Data;
using FlosskMS.Data.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Moq;

namespace FlosskMS.Tests;

public class AuthServiceTests : IDisposable
{
    private readonly ApplicationDbContext _dbContext;
    private readonly Mock<UserManager<ApplicationUser>> _userManager;
    private readonly AuthService _service;

    public AuthServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _dbContext = new ApplicationDbContext(options);

        _userManager = BuildUserManagerMock();
        var roleManager = BuildRoleManagerMock();
        var signInManager = BuildSignInManagerMock(_userManager.Object);

        var fileService = new Mock<IFileService>();
        var emailService = new Mock<IEmailService>();
        var jwtSettings = Options.Create(new JwtSettings
        {
            Secret = "test-secret-key-that-is-long-enough-for-hmac",
            Issuer = "test-issuer",
            Audience = "test-audience",
            ExpirationInMinutes = 60
        });

        _service = new AuthService(
            _userManager.Object,
            roleManager.Object,
            signInManager.Object,
            _dbContext,
            fileService.Object,
            emailService.Object,
            jwtSettings);
    }

    [Fact]
    public async Task RegisterAsync_WhenEmailIsNotApproved_ReturnsBadRequest()
    {
        var request = BuildRequest("new-user@example.com");

        var result = await _service.RegisterAsync(request);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        var dto = Assert.IsType<AuthResponseDto>(badRequest.Value);
        Assert.Contains("This email is not approved for registration.", dto.Errors);
    }

    [Fact]
    public async Task RegisterAsync_WhenUserAlreadyExists_ReturnsBadRequest()
    {
        const string email = "already@approved.com";
        _dbContext.ApprovedEmails.Add(new ApprovedEmail { Email = email });
        await _dbContext.SaveChangesAsync();

        _userManager
            .Setup(x => x.FindByEmailAsync(email))
            .ReturnsAsync(new ApplicationUser { Email = email, UserName = email });

        var result = await _service.RegisterAsync(BuildRequest(email));

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        var dto = Assert.IsType<AuthResponseDto>(badRequest.Value);
        Assert.Contains("A user with this email already exists.", dto.Errors);
    }

    [Fact]
    public async Task RegisterAsync_WhenCreateFails_ReturnsIdentityErrors()
    {
        const string email = "approved@example.com";
        _dbContext.ApprovedEmails.Add(new ApprovedEmail { Email = email });
        await _dbContext.SaveChangesAsync();

        _userManager
            .Setup(x => x.FindByEmailAsync(email))
            .ReturnsAsync((ApplicationUser?)null);

        _userManager
            .Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Password is too weak." }));

        var result = await _service.RegisterAsync(BuildRequest(email));

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        var dto = Assert.IsType<AuthResponseDto>(badRequest.Value);
        Assert.Contains("Password is too weak.", dto.Errors);
    }

    [Fact]
    public async Task RegisterAsync_WhenRequestIsValid_ReturnsOkAndAssignsUserRole()
    {
        const string email = "approved-user@example.com";
        _dbContext.ApprovedEmails.Add(new ApprovedEmail { Email = email });
        await _dbContext.SaveChangesAsync();

        _userManager
            .Setup(x => x.FindByEmailAsync(email))
            .ReturnsAsync((ApplicationUser?)null);

        _userManager
            .Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);

        _userManager
            .Setup(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), "User"))
            .ReturnsAsync(IdentityResult.Success);

        _userManager
            .Setup(x => x.GetRolesAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync(["User"]);

        var result = await _service.RegisterAsync(BuildRequest(email));

        var ok = Assert.IsType<OkObjectResult>(result);
        var dto = Assert.IsType<AuthResponseDto>(ok.Value);
        Assert.True(dto.Success);
        Assert.NotNull(dto.User);
        Assert.Equal(email, dto.User!.Email);

        _userManager.Verify(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), "User"), Times.Once);
    }

    private static RegisterRequestDto BuildRequest(string email)
    {
        return new RegisterRequestDto
        {
            Email = email,
            Password = "P@ssword123",
            ConfirmPassword = "P@ssword123",
            FirstName = "Test",
            LastName = "User",
            Role = "User"
        };
    }

    private static Mock<UserManager<ApplicationUser>> BuildUserManagerMock()
    {
        var store = new Mock<IUserStore<ApplicationUser>>();
        return new Mock<UserManager<ApplicationUser>>(
            store.Object,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!);
    }

    private static Mock<RoleManager<IdentityRole>> BuildRoleManagerMock()
    {
        var roleStore = new Mock<IRoleStore<IdentityRole>>();
        return new Mock<RoleManager<IdentityRole>>(
            roleStore.Object,
            null!,
            null!,
            null!,
            null!);
    }

    private static Mock<SignInManager<ApplicationUser>> BuildSignInManagerMock(UserManager<ApplicationUser> userManager)
    {
        var contextAccessor = new Mock<IHttpContextAccessor>();
        var claimsFactory = new Mock<IUserClaimsPrincipalFactory<ApplicationUser>>();

        return new Mock<SignInManager<ApplicationUser>>(
            userManager,
            contextAccessor.Object,
            claimsFactory.Object,
            null!,
            null!,
            null!,
            null!);
    }

    public void Dispose()
    {
        _dbContext.Dispose();
        GC.SuppressFinalize(this);
    }
}