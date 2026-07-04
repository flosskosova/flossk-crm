using AutoMapper;
using FlosskMS.Business.Configuration;
using FlosskMS.Business.DomainEvents;
using FlosskMS.Business.DTOs;
using FlosskMS.Business.Mappings;
using FlosskMS.Business.Services;
using FlosskMS.Data;
using FlosskMS.Data.Entities;
using FlosskMS.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using System.Security.Claims;

namespace FlosskMS.Tests.Services;

public class MembershipRequestServiceTests : IDisposable
{
    private readonly ApplicationDbContext _dbContext;
    private readonly MembershipRequestService _service;
    private readonly string _tempUploadDir;
    private readonly FileUploadSettings _fileSettings;

    public MembershipRequestServiceTests()
    {
        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Development");

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _dbContext = new ApplicationDbContext(options);

        _tempUploadDir = Path.Combine(Path.GetTempPath(), "flossk-tests-" + Guid.NewGuid());
        Directory.CreateDirectory(_tempUploadDir);

        _fileSettings = new FileUploadSettings
        {
            UploadPath = _tempUploadDir
        };

        var fileSettings = Options.Create(_fileSettings);

        // Mock ClamAV — always return clean
        var clamAv = new Mock<IClamAvService>();
        clamAv
            .Setup(c => c.ScanFileAsync(It.IsAny<byte[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ClamAvScanResult { IsScanned = true, IsSafe = true, RawResult = "OK" });

        // Mock IDomainEventDispatcher — no-op
        var dispatcher = new Mock<IDomainEventDispatcher>();
        dispatcher
            .Setup(d => d.PublishAsync(It.IsAny<IDomainEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Mock IEmailService — no-op
        var emailService = new Mock<IEmailService>();
        emailService
            .Setup(e => e.SendMembershipApprovedEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<byte[]>()))
            .Returns(Task.CompletedTask);

        // Real AutoMapper with the actual profile
        var mapper = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<MembershipRequestProfile>();
        }).CreateMapper();

        _service = new MembershipRequestService(
            _dbContext,
            clamAv.Object,
            fileSettings,
            mapper,
            NullLogger<MembershipRequestService>.Instance,
            dispatcher.Object,
            emailService.Object);
    }

    [Fact]
    public async Task RejectMembershipRequest_Succeeds()
    {
        var reviewerId = Guid.NewGuid().ToString();
        var reviewer = new ApplicationUser
        {
            Id = reviewerId,
            UserName = "reviewer@example.com",
            Email = "reviewer@example.com",
            FirstName = "Review",
            LastName = "User"
        };
        _dbContext.Users.Add(reviewer);
        await _dbContext.SaveChangesAsync();

        var createRequest = BuildRequest(email: "reject@example.com");
        var createResult = await _service.CreateMembershipRequestAsync(createRequest);
        var createOk = Assert.IsType<OkObjectResult>(createResult);
        var created = Assert.IsType<MembershipRequestDto>(createOk.Value);

        var currentUser = new ClaimsPrincipal(
            new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, reviewerId)], "TestAuth"));

        var rejectRequest = new RejectMembershipRequestDto
        {
            RejectionReason = "Insufficient details in application"
        };

        var rejectResult = await _service.RejectMembershipRequestAsync(created.Id, rejectRequest, currentUser);
        Assert.IsType<OkObjectResult>(rejectResult);

        var updatedRequest = await _dbContext.MembershipRequests.FindAsync(created.Id);
        Assert.NotNull(updatedRequest);
        Assert.Equal(MembershipRequestStatus.Rejected, updatedRequest!.Status);
        Assert.Equal(reviewerId, updatedRequest.ReviewedByUserId);
        Assert.Equal("Insufficient details in application", updatedRequest.RejectionReason);

        var approvedEmail = await _dbContext.ApprovedEmails.FirstOrDefaultAsync(x => x.Email == "reject@example.com");
        Assert.Null(approvedEmail);
    }

    [Fact]
    public async Task ApproveMembershipRequest_Succeeds()
    {
        var reviewerId = Guid.NewGuid().ToString();
        var reviewer = new ApplicationUser
        {
            Id = reviewerId,
            UserName = "reviewer@example.com",
            Email = "reviewer@example.com",
            FirstName = "Review",
            LastName = "User"
        };
        _dbContext.Users.Add(reviewer);
        await _dbContext.SaveChangesAsync();

        var createRequest = BuildRequest(email: "other@example.com");
        var createResult = await _service.CreateMembershipRequestAsync(createRequest);
        var createOk = Assert.IsType<OkObjectResult>(createResult);
        var created = Assert.IsType<MembershipRequestDto>(createOk.Value);

        var currentUser = new ClaimsPrincipal(
            new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, reviewerId)], "TestAuth"));

        var approveRequest = new ApproveMembershipRequestDto
        {
            BoardMemberSignature = FormFileHelpers.CreateFakePng()
        };

        var approveResult = await _service.ApproveMembershipRequestAsync(created.Id, approveRequest, currentUser);
        Assert.IsType<OkObjectResult>(approveResult);

        var updatedRequest = await _dbContext.MembershipRequests.FindAsync(created.Id);
        Assert.NotNull(updatedRequest);
        Assert.Equal(MembershipRequestStatus.Approved, updatedRequest!.Status);
        Assert.Equal(reviewerId, updatedRequest.ReviewedByUserId);
        Assert.NotNull(updatedRequest.BoardMemberSignatureFileId);

        var approvedEmail = await _dbContext.ApprovedEmails.FirstOrDefaultAsync(x => x.Email == "other@example.com");
        Assert.NotNull(approvedEmail);
        Assert.Equal(reviewerId, approvedEmail!.ApprovedBy);
    }

    [Fact]
    public async Task CreateMembershipRequest_WithDevBypassEmail_Succeeds()
    {
        // Arrange: build a valid default membership request payload.
        var request = BuildRequest();

        // Act: call the service method under test.
        var result = await _service.CreateMembershipRequestAsync(request);

        // Assert: ensure the response is HTTP 200-style OkObjectResult.
        var ok = Assert.IsType<OkObjectResult>(result);

        // Assert: ensure the response body is a MembershipRequestDto.
        var dto = Assert.IsType<MembershipRequestDto>(ok.Value);

        // Assert: verify the expected development bypass email was used.
        Assert.Equal("daorsahyseni@gmail.com", dto.Email);

        // Assert: verify a new request starts in Pending status.
        Assert.Equal("Pending", dto.Status);
    }

    [Fact]
    public async Task CreateMembershipRequest_WithDevBypassEmail_SucceedsMultipleTimes()
    {
        // Run three consecutive requests with the same email — all should succeed
        for (var i = 1; i <= 3; i++)
        {
            var request = BuildRequest($"Run {i}");

            var result = await _service.CreateMembershipRequestAsync(request);

            var ok = Assert.IsType<OkObjectResult>(result);
            var dto = Assert.IsType<MembershipRequestDto>(ok.Value);
            Assert.Equal("daorsahyseni@gmail.com", dto.Email);
        }

        var count = await _dbContext.MembershipRequests.CountAsync();
        Assert.Equal(3, count);
    }

    [Fact]
    public async Task CreateMembershipRequest_WithOtherEmail_BlocksDuplicate()
    {
        var request = BuildRequest(email: "other@example.com");

        await _service.CreateMembershipRequestAsync(request);
        var second = await _service.CreateMembershipRequestAsync(request);

        Assert.IsType<BadRequestObjectResult>(second);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private static CreateMembershipRequestDto BuildRequest(string label = "Test", string email = "daorsahyseni@gmail.com")
    {
        return new CreateMembershipRequestDto
        {
            FullName = $"Daorsa Hyseni ({label})",
            Email = email,
            Address = "Rr. Nëna Tereze 10",
            City = "Pristina",
            PhoneNumber = "+38344123456",
            SchoolOrCompany = "FLOSSK",
            DateOfBirth = new DateTime(1999, 1, 1),
            Statement = $"I am applying for FLOSSK membership. ({label})",
            IdCardNumber = "1234567890",
            SignatureFile = FormFileHelpers.CreateFakePng()
        };
    }

    public void Dispose()
    {
        _dbContext.Dispose();
        if (Directory.Exists(_tempUploadDir))
            Directory.Delete(_tempUploadDir, recursive: true);
        GC.SuppressFinalize(this);
    }
}
