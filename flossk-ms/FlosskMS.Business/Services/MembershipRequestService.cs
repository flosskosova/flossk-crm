using AutoMapper;
using FlosskMS.Business.Configuration;
using FlosskMS.Business.DomainEvents;
using FlosskMS.Business.DomainEvents.Memberships;
using FlosskMS.Business.DTOs;
using FlosskMS.Data;
using FlosskMS.Data.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace FlosskMS.Business.Services;

public class MembershipRequestService : IMembershipRequestService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IClamAvService _clamAvService;
    private readonly FileUploadSettings _fileSettings;
    private readonly IMapper _mapper;
    private readonly ILogger<MembershipRequestService> _logger;
    private readonly IDomainEventDispatcher _domainEventDispatcher;
    private readonly IEmailService _emailService;

    public MembershipRequestService(
        ApplicationDbContext dbContext,
        IClamAvService clamAvService,
        IOptions<FileUploadSettings> fileSettings,
        IMapper mapper,
        ILogger<MembershipRequestService> logger,
        IDomainEventDispatcher domainEventDispatcher,
        IEmailService emailService)
    {
        _dbContext = dbContext;
        _clamAvService = clamAvService;
        _fileSettings = fileSettings.Value;
        _mapper = mapper;
        _logger = logger;
        _domainEventDispatcher = domainEventDispatcher;
        _emailService = emailService;
    }

    public async Task<IActionResult> CreateMembershipRequestAsync(
        CreateMembershipRequestDto request,
        CancellationToken cancellationToken = default)
    {
        // Validate required fields
        if (string.IsNullOrWhiteSpace(request.FullName))
            return new BadRequestObjectResult(new { Error = "Full name is required." });

        if (string.IsNullOrWhiteSpace(request.Address))
            return new BadRequestObjectResult(new { Error = "Address is required." });

        if (string.IsNullOrWhiteSpace(request.City))
            return new BadRequestObjectResult(new { Error = "City is required." });

        if (string.IsNullOrWhiteSpace(request.PhoneNumber))
            return new BadRequestObjectResult(new { Error = "Phone number is required." });

        if (string.IsNullOrWhiteSpace(request.Email))
            return new BadRequestObjectResult(new { Error = "Email is required." });

        if (string.IsNullOrWhiteSpace(request.SchoolOrCompany))
            return new BadRequestObjectResult(new { Error = "School/Company is required." });

        if (request.DateOfBirth == default)
            return new BadRequestObjectResult(new { Error = "Date of birth is required." });

        if (request.DateOfBirth > DateTime.UtcNow)
            return new BadRequestObjectResult(new { Error = "Date of birth cannot be in the future." });

        if (string.IsNullOrWhiteSpace(request.Statement))
            return new BadRequestObjectResult(new { Error = "Statement is required." });

        if (string.IsNullOrWhiteSpace(request.IdCardNumber))
            return new BadRequestObjectResult(new { Error = "ID card number is required." });

        if (request.SignatureFile == null || request.SignatureFile.Length == 0)
            return new BadRequestObjectResult(new { Error = "Signature file is required." });

        var isDevBypass = string.Equals(
            Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"), "Development",
            StringComparison.OrdinalIgnoreCase)
            && string.Equals(request.Email.Trim(), "daorsahyseni@gmail.com", StringComparison.OrdinalIgnoreCase);

        if (!isDevBypass)
        {
            // Check if email already exists as a registered user
            var existingUser = await _dbContext.Users
                .AnyAsync(u => u.Email.ToLower() == request.Email.ToLower(), cancellationToken);

            if (existingUser)
                return new BadRequestObjectResult(new { Error = "This email is already registered in the system." });

            // Check if email is already approved
            var isEmailApproved = await _dbContext.ApprovedEmails
                .AnyAsync(e => e.Email.ToLower() == request.Email.ToLower(), cancellationToken);

            if (isEmailApproved)
                return new BadRequestObjectResult(new { Error = "This email has already been approved for membership. Please proceed to register your account." });

            // Check for existing membership request
            var existingRequest = await _dbContext.MembershipRequests
                .Where(r => r.Email.ToLower() == request.Email.ToLower())
                .FirstOrDefaultAsync(cancellationToken);

            if (existingRequest != null)
            {
                if (existingRequest.Status == MembershipRequestStatus.Pending)
                    return new BadRequestObjectResult(new { Error = "A pending membership request with this email already exists." });

                if (existingRequest.Status == MembershipRequestStatus.Approved)
                    return new BadRequestObjectResult(new { Error = "A membership request with this email has already been approved. Please proceed to register your account." });

                if (existingRequest.Status == MembershipRequestStatus.Rejected)
                    return new BadRequestObjectResult(new { Error = "A membership request with this email has been rejected. Please contact administration for more information." });
            }
        }

        // Determine if applicant is under 14
        var isUnder14 = CalculateAge(request.DateOfBirth) < 14;

        // Upload signature file
        var signatureUploadResult = await UploadFileInternalAsync(request.SignatureFile, "membership-signature", cancellationToken);
        if (!signatureUploadResult.Success)
        {
            return new BadRequestObjectResult(new { Error = signatureUploadResult.Error });
        }

        // Create membership request
        var membershipRequest = _mapper.Map<MembershipRequest>(request);
        membershipRequest.Id = Guid.NewGuid();
        membershipRequest.Status = MembershipRequestStatus.Pending;
        membershipRequest.CreatedAt = DateTime.UtcNow;

        // Set signature based on age
        if (isUnder14)
        {
            membershipRequest.GuardianSignatureFileId = signatureUploadResult.FileId;
        }
        else
        {
            membershipRequest.ApplicantSignatureFileId = signatureUploadResult.FileId;
        }

        _dbContext.MembershipRequests.Add(membershipRequest);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Membership request {RequestId} created for email {Email}", 
            membershipRequest.Id, membershipRequest.Email);

        await _domainEventDispatcher.PublishAsync(
            new MembershipApplicationSubmittedEvent(membershipRequest.FullName, membershipRequest.Email));

        // Reload with related data
        var savedRequest = await _dbContext.MembershipRequests
            .Include(r => r.ApplicantSignatureFile)
            .Include(r => r.GuardianSignatureFile)
            .FirstAsync(r => r.Id == membershipRequest.Id, cancellationToken);

        return new OkObjectResult(_mapper.Map<MembershipRequestDto>(savedRequest));
    }

    public async Task<IActionResult> GetMembershipRequestsAsync(
        int page = 1,
        int pageSize = 10,
        string? status = null,
        CancellationToken cancellationToken = default)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _dbContext.MembershipRequests
            .Include(r => r.ReviewedByUser)
            .AsQueryable();

        // Filter by status
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<MembershipRequestStatus>(status, true, out var statusEnum))
        {
            query = query.Where(r => r.Status == statusEnum);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var requests = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var result = new MembershipRequestListDto
        {
            Requests = _mapper.Map<List<MembershipRequestDto>>(requests),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };

        return new OkObjectResult(result);
    }

    public async Task<IActionResult> GetMembershipRequestByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var request = await _dbContext.MembershipRequests
            .Include(r => r.ApplicantSignatureFile)
            .Include(r => r.GuardianSignatureFile)
            .Include(r => r.BoardMemberSignatureFile)
            .Include(r => r.ReviewedByUser)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (request == null)
            return new NotFoundObjectResult(new { Error = "Membership request not found." });

        return new OkObjectResult(_mapper.Map<MembershipRequestDto>(request));
    }

    public async Task<IActionResult> ApproveMembershipRequestAsync(
        Guid id,
        ApproveMembershipRequestDto request,
        string reviewerUserId,
        CancellationToken cancellationToken = default)
    {
        if (request.BoardMemberSignature == null || request.BoardMemberSignature.Length == 0)
            return new BadRequestObjectResult(new { Error = "Board member signature is required for approval." });

        var membershipRequest = await _dbContext.MembershipRequests
            .Include(r => r.ReviewedByUser)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (membershipRequest == null)
            return new NotFoundObjectResult(new { Error = "Membership request not found." });

        if (membershipRequest.Status != MembershipRequestStatus.Pending)
            return new BadRequestObjectResult(new { Error = $"Cannot approve a request that is already {membershipRequest.Status}." });

        var reviewer = await _dbContext.Users.FindAsync([reviewerUserId], cancellationToken);
        if (reviewer == null)
            return new NotFoundObjectResult(new { Error = "Reviewer not found." });

        // Upload board member signature
        var signatureUploadResult = await UploadFileInternalAsync(request.BoardMemberSignature, "board-signature", cancellationToken);
        if (!signatureUploadResult.Success)
            return new BadRequestObjectResult(new { Error = signatureUploadResult.Error });

        membershipRequest.Status = MembershipRequestStatus.Approved;
        membershipRequest.ReviewedAt = DateTime.UtcNow;
        membershipRequest.ReviewedByUserId = reviewerUserId;
        membershipRequest.BoardMemberSignatureFileId = signatureUploadResult.FileId;

        // Add email to ApprovedEmails table to allow registration
        var isEmailAlreadyApproved = await _dbContext.ApprovedEmails
            .AnyAsync(e => e.Email.ToLower() == membershipRequest.Email.ToLower(), cancellationToken);

        if (!isEmailAlreadyApproved)
        {
            _dbContext.ApprovedEmails.Add(new ApprovedEmail
            {
                Email = membershipRequest.Email,
                ApprovedAt = DateTime.UtcNow,
                ApprovedBy = reviewerUserId
            });
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Membership request {RequestId} approved by user {UserId}", id, reviewerUserId);

        await _domainEventDispatcher.PublishAsync(
            new MembershipRequestApprovedEvent(membershipRequest.FullName, membershipRequest.Email, reviewerUserId, $"{reviewer.FirstName} {reviewer.LastName}".Trim()));

        // Reload with signatures for contract generation
        var fullRequest = await _dbContext.MembershipRequests
            .Include(r => r.ApplicantSignatureFile)
            .Include(r => r.GuardianSignatureFile)
            .Include(r => r.BoardMemberSignatureFile)
            .Include(r => r.ReviewedByUser)
            .FirstAsync(r => r.Id == id, cancellationToken);

        try
        {
            QuestPDF.Settings.License = LicenseType.Community;
            var contractPdf = GenerateContractPdf(fullRequest);
            await _emailService.SendMembershipApprovedEmailAsync(membershipRequest.Email, membershipRequest.FullName, contractPdf);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send approval email to {Email} for request {RequestId}", membershipRequest.Email, id);
        }

        return new OkObjectResult(new { Message = $"User with email: {membershipRequest.Email} approved successfully" });
    }

    public async Task<IActionResult> RejectMembershipRequestAsync(
        Guid id,
        RejectMembershipRequestDto request,
        string reviewerUserId,
        CancellationToken cancellationToken = default)
    {
        var membershipRequest = await _dbContext.MembershipRequests
            .Include(r => r.ReviewedByUser)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (membershipRequest == null)
            return new NotFoundObjectResult(new { Error = "Membership request not found." });

        if (membershipRequest.Status != MembershipRequestStatus.Pending)
            return new BadRequestObjectResult(new { Error = $"Cannot reject a request that is already {membershipRequest.Status}." });

        var reviewer = await _dbContext.Users.FindAsync([reviewerUserId], cancellationToken);
        if (reviewer == null)
            return new NotFoundObjectResult(new { Error = "Reviewer not found." });

        membershipRequest.Status = MembershipRequestStatus.Rejected;
        membershipRequest.ReviewedAt = DateTime.UtcNow;
        membershipRequest.ReviewedByUserId = reviewerUserId;
        membershipRequest.RejectionReason = request.RejectionReason;

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Membership request {RequestId} rejected by user {UserId}", id, reviewerUserId);

        await _domainEventDispatcher.PublishAsync(
            new MembershipRequestRejectedEvent(membershipRequest.FullName, membershipRequest.Email, reviewerUserId, $"{reviewer.FirstName} {reviewer.LastName}".Trim()));

        return new OkObjectResult(new { Message = $"User with email: {membershipRequest.Email} rejected successfully" });
    }

    public async Task<IActionResult> GetApprovedMembersAsync(
        int page = 1,
        int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _dbContext.MembershipRequests
            .Include(r => r.ReviewedByUser)
            .Where(r => r.Status == MembershipRequestStatus.Approved);

        var totalCount = await query.CountAsync(cancellationToken);

        var approvedMembers = await query
            .OrderByDescending(r => r.ReviewedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var result = new MembershipRequestListDto
        {
            Requests = _mapper.Map<List<MembershipRequestDto>>(approvedMembers),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };

        return new OkObjectResult(result);
    }

    public async Task<IActionResult> DownloadContractAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var membershipRequest = await _dbContext.MembershipRequests
            .Include(r => r.ApplicantSignatureFile)
            .Include(r => r.GuardianSignatureFile)
            .Include(r => r.BoardMemberSignatureFile)
            .Include(r => r.ReviewedByUser)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (membershipRequest == null)
            return new NotFoundObjectResult(new { Error = "Membership request not found." });

        if (membershipRequest.Status != MembershipRequestStatus.Approved)
            return new BadRequestObjectResult(new { Error = "Contract is only available for approved membership requests." });

        // Configure QuestPDF license (Community license for open source)
        QuestPDF.Settings.License = LicenseType.Community;

        // Generate PDF
        var pdfBytes = GenerateContractPdf(membershipRequest);

        return new FileContentResult(pdfBytes, "application/pdf")
        {
            FileDownloadName = $"FLOSSK_Membership_Contract_{membershipRequest.FullName.Replace(" ", "_")}_{membershipRequest.Id}.pdf"
        };
    }

    private byte[] GenerateContractPdf(MembershipRequest request)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(40);
                page.DefaultTextStyle(x => x.FontSize(11));

                page.Header().Element(ComposeHeader);
                page.Content().Element(c => ComposeContent(c, request));
                page.Footer().Element(ComposeFooter);
            });
        });

        return document.GeneratePdf();
    }

    private void ComposeHeader(IContainer container)
    {
        container.Column(column =>
        {
            column.Item().AlignCenter().Text("FLOSSK")
                .FontSize(24).Bold().FontColor(Colors.Blue.Darken2);
            column.Item().AlignCenter().Text("Free Libre Open Source Software Kosova")
                .FontSize(12).Italic();
            column.Item().PaddingVertical(10).LineHorizontal(1).LineColor(Colors.Grey.Medium);
            column.Item().AlignCenter().Text("MEMBERSHIP CONTRACT")
                .FontSize(18).Bold();
            column.Item().Height(20);
        });
    }

    private void ComposeContent(IContainer container, MembershipRequest request)
    {
        container.Column(column =>
        {
            // Member Information Section
            column.Item().Text("MEMBER INFORMATION").FontSize(14).Bold().FontColor(Colors.Blue.Darken2);
            column.Item().PaddingVertical(5).LineHorizontal(0.5f).LineColor(Colors.Grey.Lighten1);
            
            column.Item().PaddingTop(10).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(2);
                });

                AddTableRow(table, "Full Name:", request.FullName);
                AddTableRow(table, "Email:", request.Email);
                AddTableRow(table, "Phone Number:", request.PhoneNumber);
                AddTableRow(table, "Address:", request.Address);
                AddTableRow(table, "City:", request.City);
                AddTableRow(table, "Date of Birth:", request.DateOfBirth.ToString("MMMM dd, yyyy"));
                AddTableRow(table, "ID Card Number:", request.IdCardNumber);
                AddTableRow(table, "School/Company:", request.SchoolOrCompany);
            });

            // Statement Section
            column.Item().PaddingTop(20).Text("PERSONAL STATEMENT").FontSize(14).Bold().FontColor(Colors.Blue.Darken2);
            column.Item().PaddingVertical(5).LineHorizontal(0.5f).LineColor(Colors.Grey.Lighten1);
            column.Item().PaddingTop(10).Text(request.Statement).Justify();

            // Application Details
            column.Item().PaddingTop(20).Text("APPLICATION DETAILS").FontSize(14).Bold().FontColor(Colors.Blue.Darken2);
            column.Item().PaddingVertical(5).LineHorizontal(0.5f).LineColor(Colors.Grey.Lighten1);
            
            column.Item().PaddingTop(10).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(2);
                });

                AddTableRow(table, "Application Date:", request.CreatedAt.ToString("MMMM dd, yyyy"));
                AddTableRow(table, "Approval Date:", request.ReviewedAt?.ToString("MMMM dd, yyyy") ?? "N/A");
                AddTableRow(table, "Applicant Type:", request.IsUnder14() ? "Minor (Under 14)" : "Adult");
            });

            // Signatures Section
            column.Item().PaddingTop(30).Text("SIGNATURES").FontSize(14).Bold().FontColor(Colors.Blue.Darken2);
            column.Item().PaddingVertical(5).LineHorizontal(0.5f).LineColor(Colors.Grey.Lighten1);

            column.Item().PaddingTop(15).Row(row =>
            {
                // Applicant/Guardian Signature
                row.RelativeItem().Column(signatureColumn =>
                {
                    var signatureLabel = request.IsUnder14() ? "Guardian Signature" : "Applicant Signature";
                    signatureColumn.Item().Text(signatureLabel).Bold();
                    signatureColumn.Item().Height(10);

                    var signatureFile = request.IsUnder14() 
                        ? request.GuardianSignatureFile 
                        : request.ApplicantSignatureFile;

                    if (signatureFile != null && File.Exists(signatureFile.FilePath))
                    {
                        signatureColumn.Item().Height(60).Image(signatureFile.FilePath).FitArea();
                    }
                    else
                    {
                        signatureColumn.Item().Height(60).Border(1).BorderColor(Colors.Grey.Lighten1)
                            .AlignCenter().AlignMiddle().Text("[Signature on file]").Italic().FontColor(Colors.Grey.Medium);
                    }

                    signatureColumn.Item().Height(5);
                    signatureColumn.Item().Text(request.FullName).FontSize(10);
                    signatureColumn.Item().Text($"Date: {request.CreatedAt:MMMM dd, yyyy}").FontSize(9).FontColor(Colors.Grey.Darken1);
                });

                row.ConstantItem(40); // Spacer

                // Board Member Signature
                row.RelativeItem().Column(signatureColumn =>
                {
                    signatureColumn.Item().Text("Board Member Signature").Bold();
                    signatureColumn.Item().Height(10);

                    if (request.BoardMemberSignatureFile != null && File.Exists(request.BoardMemberSignatureFile.FilePath))
                    {
                        signatureColumn.Item().Height(60).Image(request.BoardMemberSignatureFile.FilePath).FitArea();
                    }
                    else
                    {
                        signatureColumn.Item().Height(60).Border(1).BorderColor(Colors.Grey.Lighten1)
                            .AlignCenter().AlignMiddle().Text("[Signature on file]").Italic().FontColor(Colors.Grey.Medium);
                    }

                    signatureColumn.Item().Height(5);
                    var reviewerName = request.ReviewedByUser != null 
                        ? $"{request.ReviewedByUser.FirstName} {request.ReviewedByUser.LastName}" 
                        : "Board Member";
                    signatureColumn.Item().Text(reviewerName).FontSize(10);
                    signatureColumn.Item().Text($"Date: {request.ReviewedAt?.ToString("MMMM dd, yyyy") ?? "N/A"}").FontSize(9).FontColor(Colors.Grey.Darken1);
                });
            });

            // Terms and Conditions
            column.Item().PaddingTop(30).Text("TERMS AND CONDITIONS").FontSize(14).Bold().FontColor(Colors.Blue.Darken2);
            column.Item().PaddingVertical(5).LineHorizontal(0.5f).LineColor(Colors.Grey.Lighten1);
            column.Item().PaddingTop(10).Text(text =>
            {
                text.Span("By signing this contract, the member agrees to abide by the bylaws and regulations of FLOSSK, ")
                    .FontSize(10);
                text.Span("contribute to the organization's mission of promoting Free/Libre Open Source Software in Kosova, ")
                    .FontSize(10);
                text.Span("and uphold the values of transparency, collaboration, and community engagement.")
                    .FontSize(10);
            });
        });
    }

    private static void AddTableRow(TableDescriptor table, string label, string value)
    {
        table.Cell().PaddingVertical(3).Text(label).Bold();
        table.Cell().PaddingVertical(3).Text(value);
    }

    private void ComposeFooter(IContainer container)
    {
        container.Column(column =>
        {
            column.Item().LineHorizontal(0.5f).LineColor(Colors.Grey.Lighten1);
            column.Item().PaddingTop(5).Row(row =>
            {
                row.RelativeItem().Text($"Generated on {DateTime.UtcNow:MMMM dd, yyyy 'at' HH:mm 'UTC'}").FontSize(8).FontColor(Colors.Grey.Medium);
                row.RelativeItem().AlignRight().Text("FLOSSK Membership Contract").FontSize(8).FontColor(Colors.Grey.Medium);
            });
        });
    }

    public async Task<IActionResult> SeedMembershipRequestsAsync(CancellationToken cancellationToken = default)
    {
        var testRequests = new List<MembershipRequest>
        {
            new()
            {
                Id = Guid.NewGuid(),
                FullName = "John Doe",
                Address = "123 Main Street",
                City = "Prishtina",
                PhoneNumber = "+383 44 123 456",
                Email = "johndoe@gmail.com",
                SchoolOrCompany = "University of Prishtina",
                DateOfBirth = DateTime.SpecifyKind(new DateTime(1998, 5, 15), DateTimeKind.Utc),
                Statement = "I am passionate about open source software and want to contribute to the community.",
                IdCardNumber = "123456789",
                Status = MembershipRequestStatus.Pending,
                CreatedAt = DateTime.UtcNow.AddDays(-5)
            },
            new()
            {
                Id = Guid.NewGuid(),
                FullName = "Jane Smith",
                Address = "456 Oak Avenue",
                City = "Prizren",
                PhoneNumber = "+383 45 234 567",
                Email = "janesmith@gmail.com",
                SchoolOrCompany = "Tech High School",
                DateOfBirth = DateTime.SpecifyKind(new DateTime(2000, 8, 22), DateTimeKind.Utc),
                Statement = "I want to learn more about Linux and contribute to FLOSSK projects.",
                IdCardNumber = "987654321",
                Status = MembershipRequestStatus.Pending,
                CreatedAt = DateTime.UtcNow.AddDays(-3)
            },
            new()
            {
                Id = Guid.NewGuid(),
                FullName = "Alice Johnson",
                Address = "789 Pine Road",
                City = "Gjilan",
                PhoneNumber = "+383 46 345 678",
                Email = "alicejohnson@gmail.com",
                SchoolOrCompany = "Freelance Developer",
                DateOfBirth = DateTime.SpecifyKind(new DateTime(1995, 12, 10), DateTimeKind.Utc),
                Statement = "Excited to join the FLOSSK community and share knowledge about open source.",
                IdCardNumber = "456789123",
                Status = MembershipRequestStatus.Pending,
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            },
            new()
            {
                Id = Guid.NewGuid(),
                FullName = "Bob Wilson",
                Address = "321 Elm Street",
                City = "Peja",
                PhoneNumber = "+383 47 456 789",
                Email = "bobwilson@gmail.com",
                SchoolOrCompany = "Innovation Lab",
                DateOfBirth = DateTime.SpecifyKind(new DateTime(1997, 3, 28), DateTimeKind.Utc),
                Statement = "I believe in the power of open source and community collaboration.",
                IdCardNumber = "654321987",
                Status = MembershipRequestStatus.Pending,
                CreatedAt = DateTime.UtcNow.AddHours(-12)
            },
            new()
            {
                Id = Guid.NewGuid(),
                FullName = "Emma Davis",
                Address = "555 Maple Drive",
                City = "Ferizaj",
                PhoneNumber = "+383 48 567 890",
                Email = "emmadavis@gmail.com",
                SchoolOrCompany = "Software Engineering Student",
                DateOfBirth = DateTime.SpecifyKind(new DateTime(2001, 7, 5), DateTimeKind.Utc),
                Statement = "Looking forward to learning from experienced developers in the FLOSSK community.",
                IdCardNumber = "789123456",
                Status = MembershipRequestStatus.Pending,
                CreatedAt = DateTime.UtcNow.AddHours(-6)
            }
        };

        await _dbContext.MembershipRequests.AddRangeAsync(testRequests, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Seeded {Count} test membership requests", testRequests.Count);

        return new OkObjectResult(new 
        { 
            Message = $"Successfully seeded {testRequests.Count} membership requests",
            Count = testRequests.Count
        });
    }

    public async Task<IActionResult> DeleteAllMembershipRequestsAsync(CancellationToken cancellationToken = default)
    {
        var allRequests = await _dbContext.MembershipRequests.ToListAsync(cancellationToken);
        var count = allRequests.Count;

        if (count == 0)
        {
            return new OkObjectResult(new { Message = "No membership requests to delete" });
        }

        _dbContext.MembershipRequests.RemoveRange(allRequests);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogWarning("Deleted all {Count} membership requests", count);

        return new OkObjectResult(new 
        { 
            Message = $"Successfully deleted all membership requests",
            Count = count
        });
    }

    #region Private Helper Methods

    private static int CalculateAge(DateTime dateOfBirth)
    {
        var today = DateTime.UtcNow.Date;
        var age = today.Year - dateOfBirth.Year;
        if (dateOfBirth.Date > today.AddYears(-age)) age--;
        return age;
    }

    private async Task<(bool Success, Guid FileId, string? Error)> UploadFileInternalAsync(
        IFormFile file, 
        string category,
        CancellationToken cancellationToken)
    {
        // Validate file size
        if (file.Length > _fileSettings.MaxFileSizeBytes)
        {
            return (false, Guid.Empty, $"File size exceeds maximum allowed size of {_fileSettings.MaxFileSizeBytes / (1024 * 1024)}MB.");
        }

        // Validate file extension for images
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".pdf" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(extension))
        {
            return (false, Guid.Empty, $"File type not allowed. Allowed types: {string.Join(", ", allowedExtensions)}");
        }

        // Read file into memory for scanning
        using var memoryStream = new MemoryStream();
        await file.CopyToAsync(memoryStream, cancellationToken);
        var fileBytes = memoryStream.ToArray();

        // Scan with ClamAV
        var scanResult = await _clamAvService.ScanFileAsync(fileBytes, cancellationToken);

        if (!scanResult.IsScanned)
        {
            _logger.LogWarning("ClamAV scan failed: {Error}. Rejecting file upload.", scanResult.Error);
            return (false, Guid.Empty, $"Virus scan failed: {scanResult.Error}. File upload rejected for security.");
        }

        if (!scanResult.IsSafe)
        {
            _logger.LogWarning("Malware detected in uploaded file: {VirusName}", scanResult.VirusName);
            return (false, Guid.Empty, $"Malware detected: {scanResult.VirusName}. File rejected.");
        }

        // Generate unique filename
        var uniqueFileName = $"{category}-{Guid.NewGuid()}{extension}";

        // Ensure upload directory exists
        var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), _fileSettings.UploadPath, "membership");
        Directory.CreateDirectory(uploadPath);

        var filePath = Path.Combine(uploadPath, uniqueFileName);

        // Save file to disk
        await System.IO.File.WriteAllBytesAsync(filePath, fileBytes, cancellationToken);

        // Create database record (without user tracking for anonymous uploads)
        var uploadedFile = new UploadedFile
        {
            Id = Guid.NewGuid(),
            FileName = uniqueFileName,
            ContentType = file.ContentType,
            FileSize = file.Length,
            FilePath = filePath,
            UploadedAt = DateTime.UtcNow,
            CreatedByUserId = null, // Anonymous upload
            IsScanned = true,
            IsSafe = true,
            ScanResult = scanResult.RawResult
        };

        _dbContext.UploadedFiles.Add(uploadedFile);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return (true, uploadedFile.Id, null);
    }

    private async Task DeleteFileInternalAsync(Guid fileId, CancellationToken cancellationToken)
    {
        var file = await _dbContext.UploadedFiles.FindAsync([fileId], cancellationToken);
        if (file != null)
        {
            if (System.IO.File.Exists(file.FilePath))
            {
                System.IO.File.Delete(file.FilePath);
            }
            _dbContext.UploadedFiles.Remove(file);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    #endregion
}
