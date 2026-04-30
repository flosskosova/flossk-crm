using AutoMapper;
using FlosskMS.Business.Configuration;
using FlosskMS.Business.DomainEvents;
using FlosskMS.Business.DTOs;
using FlosskMS.Business.Mappings;
using FlosskMS.Business.Services;
using FlosskMS.Data;
using FlosskMS.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;

namespace FlosskMS.Tests;

public class MembershipRequestServiceTests : IDisposable
{
    private readonly ApplicationDbContext _dbContext;
    private readonly MembershipRequestService _service;
    private readonly string _tempUploadDir;

    public MembershipRequestServiceTests()
    {
        // Ensure Development environment so the bypass applies
        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Development");

        // Use a unique in-memory database per test instance
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _dbContext = new ApplicationDbContext(options);

        // Point file uploads to a temp directory so no real disk paths are required
        _tempUploadDir = Path.Combine(Path.GetTempPath(), "flossk-tests-" + Guid.NewGuid());
        Directory.CreateDirectory(_tempUploadDir);

        var fileSettings = Options.Create(new FileUploadSettings
        {
            UploadPath = _tempUploadDir,
            MaxFileSizeBytes = 10 * 1024 * 1024 // 10 MB
        });

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
    public async Task CreateMembershipRequest_WithDevBypassEmail_Succeeds()
    {
        var request = BuildRequest();

        var result = await _service.CreateMembershipRequestAsync(request);

        var ok = Assert.IsType<OkObjectResult>(result);
        var dto = Assert.IsType<MembershipRequestDto>(ok.Value);
        Assert.Equal("daorsahyseni@gmail.com", dto.Email);
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
