using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;
using AutoMapper;
using FlosskMS.Business.DTOs;
using FlosskMS.Data;
using FlosskMS.Data.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using QRCoder;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using SkiaSharp;

namespace FlosskMS.Business.Services;

public class CertificateService(
    ApplicationDbContext dbContext,
    IHostEnvironment env,
    IMapper mapper,
    IConfiguration config) : ICertificateService
{
    private readonly ApplicationDbContext _dbContext = dbContext;
    private readonly IHostEnvironment _env = env;
    private readonly IMapper _mapper = mapper;
    private readonly IConfiguration _config = config;

    // ── Verification helpers ──────────────────────────────────────────────────

    private string GetVerifyUrl(string token)
    {
        var baseUrl = _config["Certificates:BaseUrl"]
            ?? throw new InvalidOperationException("Cannot load base URL. Ensure 'Certificates:BaseUrl' is set in appsettings.");
        return $"{baseUrl}/verify/{token}";
    }

    private string ComputeHmac(Guid certId, string recipientUserId, DateTime issuedDate)
    {
        var secret = _config["Certificates:HmacSecret"]
            ?? throw new InvalidOperationException("Cannot load HMAC secret. Ensure 'Certificates__HmacSecret' is set in the .env file.");
        var message = $"{certId}|{recipientUserId}|{issuedDate:O}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        return Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(message))).ToLowerInvariant();
    }

    private static byte[] GenerateQrCodePng(string data)
    {
        using var generator = new QRCodeGenerator();
        using var qrData = generator.CreateQrCode(data, QRCodeGenerator.ECCLevel.M);
        using var png = new PngByteQRCode(qrData);
        return png.GetGraphic(10);
    }

    public async Task<IActionResult> IssueCertificatesAsync(IssueCertificateDto request, string issuedByUserId)
    {
        if (string.IsNullOrWhiteSpace(request.RecipientUserId))
            return new BadRequestObjectResult(new { Error = "A recipient is required." });

        var issuer = await _dbContext.Users.FindAsync(issuedByUserId);
        if (issuer == null)
            return new UnauthorizedResult();

        var recipientUser = await _dbContext.Users.FindAsync(request.RecipientUserId);
        if (recipientUser == null)
            return new BadRequestObjectResult(new { Error = "Recipient user not found." });

        // Enforce project eligibility: recipient must have participated in at least one completed objective
        if (request.ProjectId.HasValue)
        {
            var projectExists = await _dbContext.Projects.AnyAsync(p => p.Id == request.ProjectId.Value);
            if (!projectExists)
                return new BadRequestObjectResult(new { Error = "Project not found." });

            var hasCompletedObjective = await _dbContext.ObjectiveTeamMembers
                .AnyAsync(otm =>
                    otm.UserId == request.RecipientUserId &&
                    otm.Objective.ProjectId == request.ProjectId.Value &&
                    otm.Objective.Status == ObjectiveStatus.Completed);

            if (!hasCompletedObjective)
                return new BadRequestObjectResult(new { Error = "User has not participated in any completed objective of this project and is not eligible for a certificate." });
        }

        var issuedDate = request.IssuedDate ?? DateTime.UtcNow;
        var certId = Guid.NewGuid();
        var verificationToken = Guid.NewGuid().ToString("N");

        var certificate = new Certificate
        {
            Id = certId,
            EventName = request.EventName,
            Description = request.Description,
            Status = CertificateStatus.Issued,
            IssuedDate = issuedDate,
            CreatedAt = DateTime.UtcNow,
            RecipientUserId = recipientUser.Id,
            IssuedByUserId = issuedByUserId,
            TemplateId = request.TemplateId,
            ProjectId = request.ProjectId,
            IssuerSignatureDataUrl = request.IssuerSignatureDataUrl,
            VerificationToken = verificationToken,
            HmacSignature = ComputeHmac(certId, recipientUser.Id, issuedDate)
        };

        _dbContext.Certificates.Add(certificate);
        await _dbContext.SaveChangesAsync();

        var saved = await _dbContext.Certificates
            .Include(c => c.RecipientUser)
                .ThenInclude(u => u.UploadedFiles)
            .Include(c => c.IssuedByUser)
            .Include(c => c.Template)
                .ThenInclude(t => t!.Fields)
            .Where(c => c.Id == certificate.Id)
            .ToListAsync();

        var pdfDir = Path.Combine(_env.ContentRootPath, "uploads", "certificates");
        Directory.CreateDirectory(pdfDir);

        QuestPDF.Settings.License = LicenseType.Community;

        foreach (var cert in saved)
        {
            var qrCodeUrl = !string.IsNullOrEmpty(cert.VerificationToken)
                ? GetVerifyUrl(cert.VerificationToken)
                : null;

            var templateFilePath = cert.Template != null
                ? Path.Combine(_env.ContentRootPath, "uploads", "cert-templates", Path.GetFileName(cert.Template.FilePath))
                : null;

            byte[]? templateImageBytes = null;
            if (templateFilePath != null && File.Exists(templateFilePath))
                templateImageBytes = await File.ReadAllBytesAsync(templateFilePath);

            byte[] pdfBytes;
            if (templateImageBytes != null && cert.Template?.Fields.Count > 0)
            {
                var compositeImageBytes = RenderCertificateWithSkia(cert, templateImageBytes, cert.Template.Fields.ToList(), qrCodeUrl);
                pdfBytes = WrapImageInPdf(compositeImageBytes);
            }
            else
            {
                pdfBytes = GenerateCertificatePdf(cert, templateImageBytes, qrCodeUrl);
            }

            var fileName = $"{cert.Id}.pdf";
            var filePath = Path.Combine(pdfDir, fileName);
            await File.WriteAllBytesAsync(filePath, pdfBytes);
            cert.GeneratedPdfPath = Path.Combine("uploads", "certificates", fileName);
        }

        await _dbContext.SaveChangesAsync();

        return new OkObjectResult(MapToDto(saved[0]));
    }

    public async Task<IActionResult> GetCertificatesAsync(int page = 1, int pageSize = 10)
    {
        var query = _dbContext.Certificates
            .Include(c => c.RecipientUser)
                .ThenInclude(u => u.UploadedFiles)
            .Include(c => c.IssuedByUser)
            .OrderByDescending(c => c.CreatedAt)
            .AsQueryable();

        var totalCount = await query.CountAsync();

        var certificates = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = new CertificateListDto
        {
            Certificates = certificates.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };

        return new OkObjectResult(result);
    }

    public async Task<IActionResult> GetUserCertificatesAsync(string userId)
    {
        var certificates = await _dbContext.Certificates
            .Include(c => c.RecipientUser)
                .ThenInclude(u => u.UploadedFiles)
            .Include(c => c.IssuedByUser)
            .Where(c => c.RecipientUserId == userId)
            .OrderByDescending(c => c.IssuedDate)
            .ToListAsync();

        return new OkObjectResult(certificates.Select(MapToDto).ToList());
    }

    public async Task<IActionResult> GetCertificateByIdAsync(Guid id)
    {
        var certificate = await _dbContext.Certificates
            .Include(c => c.RecipientUser)
                .ThenInclude(u => u.UploadedFiles)
            .Include(c => c.IssuedByUser)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (certificate == null)
            return new NotFoundObjectResult(new { Error = "Certificate not found." });

        return new OkObjectResult(MapToDto(certificate));
    }

    public async Task<IActionResult> GetCertificateImageAsync(Guid id)
    {
        var certificate = await _dbContext.Certificates
            .Include(c => c.RecipientUser)
            .Include(c => c.IssuedByUser)
            .Include(c => c.Template)
                .ThenInclude(t => t!.Fields)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (certificate == null)
            return new NotFoundObjectResult(new { Error = "Certificate not found." });

        var qrCodeUrl = !string.IsNullOrEmpty(certificate.VerificationToken)
            ? GetVerifyUrl(certificate.VerificationToken)
            : null;

        if (certificate.Template != null)
        {
            var templatePath = Path.Combine(_env.ContentRootPath, "uploads", "cert-templates", Path.GetFileName(certificate.Template.FilePath));
            if (File.Exists(templatePath) && !templatePath.EndsWith(".pptx", StringComparison.OrdinalIgnoreCase))
            {
                var templateImageBytes = await File.ReadAllBytesAsync(templatePath);
                var pngBytes = RenderCertificateWithSkia(certificate, templateImageBytes, certificate.Template.Fields.ToList(), qrCodeUrl);
                return new FileContentResult(pngBytes, "image/png");
            }
        }

        // Fallback: return stored PDF if no image renderable template
        return await DownloadCertificateAsync(id);
    }

    public async Task<IActionResult> DownloadCertificateAsync(Guid id)
    {
        var certificate = await _dbContext.Certificates
            .Include(c => c.RecipientUser)
            .Include(c => c.IssuedByUser)
            .Include(c => c.Template)
                .ThenInclude(t => t!.Fields)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (certificate == null)
            return new NotFoundObjectResult(new { Error = "Certificate not found." });

        var recipientName = $"{certificate.RecipientUser.FirstName}_{certificate.RecipientUser.LastName}";

        if (!_env.IsDevelopment() && !string.IsNullOrEmpty(certificate.GeneratedPdfPath))
        {
            var storedPath = Path.Combine(_env.ContentRootPath, certificate.GeneratedPdfPath);
            if (File.Exists(storedPath))
            {
                var storedBytes = await File.ReadAllBytesAsync(storedPath);
                bool storedIsPptx = storedPath.EndsWith(".pptx", StringComparison.OrdinalIgnoreCase);
                var mimeType  = storedIsPptx ? "application/vnd.openxmlformats-officedocument.presentationml.presentation" : "application/pdf";
                var extension = storedIsPptx ? ".pptx" : ".pdf";
                return new FileContentResult(storedBytes, mimeType)
                {
                    FileDownloadName = $"FLOSSK_Certificate_{recipientName}_{certificate.EventName.Replace(" ", "_")}{extension}"
                };
            }
        }

        // Fall back to on-the-fly generation (non-PPTX only)
        QuestPDF.Settings.License = LicenseType.Community;

        var qrCodeUrl = !string.IsNullOrEmpty(certificate.VerificationToken)
            ? GetVerifyUrl(certificate.VerificationToken)
            : null;

        byte[]? templateImageBytes = null;
        if (certificate.Template != null)
        {
            var templatePath = Path.Combine(_env.ContentRootPath, "uploads", "cert-templates", Path.GetFileName(certificate.Template.FilePath));
            if (System.IO.File.Exists(templatePath) && !templatePath.EndsWith(".pptx", StringComparison.OrdinalIgnoreCase))
                templateImageBytes = await System.IO.File.ReadAllBytesAsync(templatePath);
        }

        byte[] pdfBytes;
        if (templateImageBytes != null && certificate.Template?.Fields.Count > 0)
        {
            // SkiaSharp path: render text onto the template image, then wrap in a PDF
            var compositeImageBytes = RenderCertificateWithSkia(certificate, templateImageBytes, certificate.Template.Fields.ToList(), qrCodeUrl);
            pdfBytes = WrapImageInPdf(compositeImageBytes);
        }
        else
        {
            pdfBytes = GenerateCertificatePdf(certificate, templateImageBytes, qrCodeUrl);
        }

        return new FileContentResult(pdfBytes, "application/pdf")
        {
            FileDownloadName = $"FLOSSK_Certificate_{recipientName}_{certificate.EventName.Replace(" ", "_")}.pdf"
        };
    }

    public async Task<IActionResult> UploadExternalCertificateAsync(UploadExternalCertificateDto request, string uploadedByUserId)
    {
        var uploader = await _dbContext.Users.FindAsync(uploadedByUserId);
        if (uploader == null) return new UnauthorizedResult();

        var recipient = await _dbContext.Users
            .Include(u => u.UploadedFiles)
            .FirstOrDefaultAsync(u => u.Id == request.RecipientUserId);
        if (recipient == null)
            return new BadRequestObjectResult(new { Error = "Recipient user not found." });

        if (request.ProjectId.HasValue)
        {
            var project = await _dbContext.Projects
                .Include(p => p.Objectives)
                    .ThenInclude(o => o.TeamMembers)
                .FirstOrDefaultAsync(p => p.Id == request.ProjectId.Value);

            if (project == null)
                return new BadRequestObjectResult(new { Error = "The specified project was not found." });

            if (project.Status != ProjectStatus.Completed)
                return new BadRequestObjectResult(new { Error = "Certificates can only be issued for completed projects." });

            var isInCompletedObjective = project.Objectives
                .Where(o => o.Status == ObjectiveStatus.Completed)
                .Any(o => o.TeamMembers.Any(tm => tm.UserId == request.RecipientUserId));

            if (!isInCompletedObjective)
                return new BadRequestObjectResult(new { Error = "The recipient is not a member of any completed objective in this project." });
        }

        var allowedExts = new[] { ".pdf", ".png", ".jpg", ".jpeg", ".webp", ".pptx" };
        var ext = Path.GetExtension(request.File.FileName).ToLowerInvariant();
        if (!allowedExts.Contains(ext))
            return new BadRequestObjectResult(new { Error = "Only PDF, PNG, JPG, WebP, or PPTX files are accepted." });

        const long maxSize = 50 * 1024 * 1024;
        if (request.File.Length > maxSize)
            return new BadRequestObjectResult(new { Error = "File must not exceed 50 MB." });

        var certDir = Path.Combine(_env.ContentRootPath, "uploads", "certificates");
        Directory.CreateDirectory(certDir);

        var storedFileName = $"{Guid.NewGuid()}{ext}";
        var diskPath = Path.Combine(certDir, storedFileName);
        await using (var stream = new FileStream(diskPath, FileMode.Create))
            await request.File.CopyToAsync(stream);

        var externalCertId = Guid.NewGuid();
        var externalIssuedDate = DateTime.UtcNow;
        var externalToken = Guid.NewGuid().ToString("N");

        var certificate = new Certificate
        {
            Id = externalCertId,
            EventName = request.EventName,
            Description = request.Description ?? string.Empty,
            Status = CertificateStatus.Issued,
            IssuedDate = externalIssuedDate,
            CreatedAt = DateTime.UtcNow,
            RecipientUserId = recipient.Id,
            IssuedByUserId = uploadedByUserId,
            GeneratedPdfPath = Path.Combine("uploads", "certificates", storedFileName),
            IsPptx = ext == ".pptx",
            VerificationToken = externalToken,
            HmacSignature = ComputeHmac(externalCertId, recipient.Id, externalIssuedDate)
        };

        _dbContext.Certificates.Add(certificate);
        await _dbContext.SaveChangesAsync();

        // Re-load with full navigation for the DTO
        var saved = await _dbContext.Certificates
            .Include(c => c.RecipientUser)
                .ThenInclude(u => u.UploadedFiles)
            .Include(c => c.IssuedByUser)
            .FirstAsync(c => c.Id == certificate.Id);

        return new OkObjectResult(MapToDto(saved));
    }

    public async Task<IActionResult> UploadTemplateAsync(IFormFile file, string name, string userId)
    {
        var allowedImageTypes = new[] { "image/png", "image/jpeg", "image/jpg", "image/webp" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        bool isImageUpload = allowedImageTypes.Contains(file.ContentType.ToLower());

        if (!isImageUpload)
            return new BadRequestObjectResult(new { Error = "Only PNG, JPG, and WebP images are supported as certificate templates." });

        const long maxSize = 50 * 1024 * 1024; // 50 MB
        if (file.Length > maxSize)
            return new BadRequestObjectResult(new { Error = "Template file must not exceed 50 MB." });

        var user = await _dbContext.Users.FindAsync(userId);
        if (user == null) return new UnauthorizedResult();

        var templateDir = Path.Combine(_env.ContentRootPath, "uploads", "cert-templates");
        Directory.CreateDirectory(templateDir);

        var storedFileName = $"{Guid.NewGuid()}{ext}";
        var filePath = $"/uploads/cert-templates/{storedFileName}";

        var diskPath = Path.Combine(templateDir, storedFileName);

        await using (var stream = new FileStream(diskPath, FileMode.Create))
            await file.CopyToAsync(stream);

        var template = new CertificateTemplate
        {
            Id = Guid.NewGuid(),
            Name = string.IsNullOrWhiteSpace(name) ? Path.GetFileNameWithoutExtension(file.FileName) : name.Trim(),
            OriginalFileName = file.FileName,
            FilePath = filePath,
            ContentType = file.ContentType,
            FileSize = file.Length,
            UploadedAt = DateTime.UtcNow,
            CreatedByUserId = userId
        };

        _dbContext.CertificateTemplates.Add(template);
        await _dbContext.SaveChangesAsync();

        template.CreatedByUser = user;
        return new OkObjectResult(_mapper.Map<CertificateTemplateDto>(template));
    }

    public async Task<IActionResult> GetTemplatesAsync()
    {
        var templates = await _dbContext.CertificateTemplates
            .Include(t => t.CreatedByUser)
            .OrderByDescending(t => t.UploadedAt)
            .ToListAsync();

        var dtos = templates.Select(t => _mapper.Map<CertificateTemplateDto>(t)).ToList();
        return new OkObjectResult(dtos);
    }

    public async Task<IActionResult> DeleteTemplateAsync(Guid id, string userId)
    {
        var template = await _dbContext.CertificateTemplates.FindAsync(id);
        if (template == null)
            return new NotFoundObjectResult(new { Error = "Template not found." });

        // Remove the physical file
        var diskPath = Path.Combine(_env.ContentRootPath, "uploads", "cert-templates", Path.GetFileName(template.FilePath));
        if (System.IO.File.Exists(diskPath))
            System.IO.File.Delete(diskPath);

        _dbContext.CertificateTemplates.Remove(template);
        await _dbContext.SaveChangesAsync();

        return new OkObjectResult(new { Message = "Template deleted successfully." });
    }

    public async Task<IActionResult> RevokeCertificateAsync(Guid id, string userId)
    {
        var certificate = await _dbContext.Certificates.FindAsync(id);
        if (certificate == null)
            return new NotFoundObjectResult(new { Error = "Certificate not found." });

        certificate.Status = CertificateStatus.Revoked;
        await _dbContext.SaveChangesAsync();

        return new OkObjectResult(new { Message = "Certificate revoked successfully." });
    }

    public async Task<IActionResult> DeleteCertificateAsync(Guid id, string userId)
    {
        var certificate = await _dbContext.Certificates.FindAsync(id);
        if (certificate == null)
            return new NotFoundObjectResult(new { Error = "Certificate not found." });

        _dbContext.Certificates.Remove(certificate);
        await _dbContext.SaveChangesAsync();

        return new OkResult();
    }

    public async Task<IActionResult> DeleteAllCertificatesAsync()
    {
        await _dbContext.Certificates.ExecuteDeleteAsync();
        return new OkResult();
    }

    public async Task<IActionResult> SaveLayoutAsync(Guid templateId, SaveLayoutDto request)
    {
        var template = await _dbContext.CertificateTemplates.FindAsync(templateId);
        if (template == null)
            return new NotFoundObjectResult(new { Error = "Template not found." });

        if (request.CanvasWidth <= 0 || request.CanvasHeight <= 0)
            return new BadRequestObjectResult(new { Error = "Canvas dimensions must be positive." });

        // Replace all existing fields for this template
        var existing = _dbContext.CertificateTemplateFields.Where(f => f.TemplateId == templateId);
        _dbContext.CertificateTemplateFields.RemoveRange(existing);

        var newFields = request.Fields
            .Where(f => !string.IsNullOrWhiteSpace(f.Key) && f.Width > 0 && f.Height > 0)
            .Select(f => new CertificateTemplateField
            {
                Id = Guid.NewGuid(),
                TemplateId = templateId,
                Key = f.Key,
                // Normalize pixel coords to 0-1 fractions of the canvas
                X = f.X / request.CanvasWidth,
                Y = f.Y / request.CanvasHeight,
                Width = f.Width / request.CanvasWidth,
                Height = f.Height / request.CanvasHeight,
            })
            .ToList();

        _dbContext.CertificateTemplateFields.AddRange(newFields);
        await _dbContext.SaveChangesAsync();

        return new OkObjectResult(new TemplateLayoutDto
        {
            TemplateId = templateId,
            Fields = newFields.Select(f => new TemplateFieldDto
            {
                Key = f.Key,
                X = f.X,
                Y = f.Y,
                Width = f.Width,
                Height = f.Height,
            }).ToList()
        });
    }

    public async Task<IActionResult> GetLayoutAsync(Guid templateId)
    {
        var template = await _dbContext.CertificateTemplates.FindAsync(templateId);
        if (template == null)
            return new NotFoundObjectResult(new { Error = "Template not found." });

        var fields = await _dbContext.CertificateTemplateFields
            .Where(f => f.TemplateId == templateId)
            .ToListAsync();

        return new OkObjectResult(new TemplateLayoutDto
        {
            TemplateId = templateId,
            Fields = fields.Select(f => new TemplateFieldDto
            {
                Key = f.Key,
                X = f.X,
                Y = f.Y,
                Width = f.Width,
                Height = f.Height,
            }).ToList()
        });
    }

    public async Task<IActionResult> VerifyCertificateAsync(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return new BadRequestObjectResult(new { Error = "Verification token is required." });

        var cert = await _dbContext.Certificates
            .Include(c => c.RecipientUser)
            .Include(c => c.IssuedByUser)
            .FirstOrDefaultAsync(c => c.VerificationToken == token);

        if (cert == null)
            return new NotFoundObjectResult(new { Error = "Certificate not found." });

        return new OkObjectResult(new CertificateVerifyDto
        {
            Status       = cert.Status.ToString(),
            EventName    = cert.EventName,
            Description  = cert.Description,
            RecipientName = $"{cert.RecipientUser.FirstName} {cert.RecipientUser.LastName}",
            IssuedDate   = cert.IssuedDate,
            IssuedByName = $"{cert.IssuedByUser.FirstName} {cert.IssuedByUser.LastName}",
            HmacSignature = cert.HmacSignature ?? string.Empty
        });
    }

    private CertificateDto MapToDto(Certificate cert)
    {
        return _mapper.Map<CertificateDto>(cert);
    }

    private static byte[] GenerateCertificatePdf(Certificate certificate, byte[]? templateImageBytes = null, string? qrCodeUrl = null)
    {
        var recipientName = $"{certificate.RecipientUser.FirstName} {certificate.RecipientUser.LastName}";
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(40);
                page.DefaultTextStyle(x => x.FontSize(12));

                if (templateImageBytes != null)
                    page.Background().Image(templateImageBytes);

                page.Content().Element(c =>
                {
                    if (templateImageBytes != null)
                        ComposeTemplateOverlay(c, certificate, recipientName, qrCodeUrl);
                    else
                        ComposeCertificateContent(c, certificate, recipientName, qrCodeUrl);
                });
            });
        });

        return document.GeneratePdf();
    }

    private static void ComposeCertificateContent(IContainer container, Certificate certificate, string recipientName, string? qrCodeUrl = null)
    {
        container.Border(2).BorderColor(Colors.Blue.Darken2).Padding(30).Column(column =>
        {
            column.Spacing(10);

            // Header
            column.Item().AlignCenter().Text("FLOSSK")
                .FontSize(28).Bold().FontColor(Colors.Blue.Darken2);
            column.Item().AlignCenter().Text("Free Libre Open Source Software Kosova")
                .FontSize(12).Italic().FontColor(Colors.Grey.Darken1);

            column.Item().PaddingVertical(10).LineHorizontal(1).LineColor(Colors.Blue.Darken2);

            // Certificate Title
            column.Item().AlignCenter().Text("CERTIFICATE")
                .FontSize(32).Bold().FontColor(Colors.Blue.Darken2);

            column.Item().Height(20);

            // Recipient
            column.Item().AlignCenter().Text("This certificate is awarded to")
                .FontSize(14);
            column.Item().AlignCenter().PaddingVertical(5).Text(recipientName)
                .FontSize(24).Bold().FontColor(Colors.Blue.Darken1);

            column.Item().Height(10);

            // Event
            column.Item().AlignCenter().Text($"for {certificate.EventName}")
                .FontSize(14);

            // Description
            if (!string.IsNullOrWhiteSpace(certificate.Description))
            {
                column.Item().AlignCenter().PaddingTop(10).Text(certificate.Description)
                    .FontSize(11).FontColor(Colors.Grey.Darken1);
            }

            column.Item().Height(20);

            // Date & Issuer
            column.Item().PaddingVertical(10).LineHorizontal(0.5f).LineColor(Colors.Grey.Medium);

            column.Item().Row(row =>
            {
                row.RelativeItem().Column(c =>
                {
                    c.Item().Text("Date Issued").FontSize(10).FontColor(Colors.Grey.Darken1);
                    c.Item().Text(certificate.IssuedDate.ToString("MMMM dd, yyyy")).FontSize(12).Bold();
                });

                row.RelativeItem().AlignRight().Column(c =>
                {
                    if (!string.IsNullOrEmpty(certificate.IssuerSignatureDataUrl))
                    {
                        var base64 = certificate.IssuerSignatureDataUrl.Contains(',')
                            ? certificate.IssuerSignatureDataUrl.Split(',')[1]
                            : certificate.IssuerSignatureDataUrl;
                        c.Item().AlignRight().Height(40).Image(Convert.FromBase64String(base64));
                    }
                    c.Item().AlignRight().Text("Issued By").FontSize(10).FontColor(Colors.Grey.Darken1);
                    c.Item().AlignRight().Text($"{certificate.IssuedByUser.FirstName} {certificate.IssuedByUser.LastName}").FontSize(12).Bold();
                });
            });

            // QR code for verification
            if (!string.IsNullOrEmpty(qrCodeUrl))
            {
                var qrPng = GenerateQrCodePng(qrCodeUrl);
                column.Item().PaddingTop(10).Row(row =>
                {
                    row.AutoItem().Column(qrCol =>
                    {
                        qrCol.Item().Width(60).Height(60).Image(qrPng);
                        qrCol.Item().Text("Scan to verify").FontSize(7).FontColor(Colors.Grey.Darken1);
                    });
                    row.RelativeItem();
                });
            }
        });
    }

    private static void ComposeTemplateOverlay(IContainer container, Certificate certificate, string recipientName, string? qrCodeUrl = null)
    {
        // When using a custom template image as background, overlay only the dynamic text.
        // The template design is expected to leave space in the center for the recipient name,
        // below it for the event, and at the bottom for the date / issuer.
        container.Padding(40).Column(column =>
        {
            column.Spacing(6);

            // Push content toward vertical center
            column.Item().Height(120);

            // Recipient name
            column.Item().AlignCenter().Text(recipientName)
                .FontSize(26).Bold().FontColor(Colors.Black);

            column.Item().Height(8);

            // Event
            column.Item().AlignCenter().Text($"for {certificate.EventName}")
                .FontSize(15).FontColor(Colors.Grey.Darken2);

            // Description
            if (!string.IsNullOrWhiteSpace(certificate.Description))
            {
                column.Item().AlignCenter().PaddingTop(6).Text(certificate.Description)
                    .FontSize(11).Italic().FontColor(Colors.Grey.Darken1);
            }

            // Spacer to push footer down
            column.Item().Height(80);

            // Date & Issuer footer row
            column.Item().Row(row =>
            {
                row.RelativeItem().Column(c =>
                {
                    c.Item().Text("Date Issued").FontSize(10).FontColor(Colors.Grey.Darken1);
                    c.Item().Text(certificate.IssuedDate.ToString("MMMM dd, yyyy")).FontSize(12).Bold();
                });

                row.RelativeItem().AlignRight().Column(c =>
                {
                    if (!string.IsNullOrEmpty(certificate.IssuerSignatureDataUrl))
                    {
                        var base64 = certificate.IssuerSignatureDataUrl.Contains(',')
                            ? certificate.IssuerSignatureDataUrl.Split(',')[1]
                            : certificate.IssuerSignatureDataUrl;
                        c.Item().AlignRight().Height(40).Image(Convert.FromBase64String(base64));
                    }
                    c.Item().AlignRight().Text("Issued By").FontSize(10).FontColor(Colors.Grey.Darken1);
                    c.Item().AlignRight().Text($"{certificate.IssuedByUser.FirstName} {certificate.IssuedByUser.LastName}").FontSize(12).Bold();
                });
            });

            // QR code for verification (bottom-left corner)
            if (!string.IsNullOrEmpty(qrCodeUrl))
            {
                var qrPng = GenerateQrCodePng(qrCodeUrl);
                column.Item().PaddingTop(6).Row(row =>
                {
                    row.AutoItem().Column(qrCol =>
                    {
                        qrCol.Item().Width(55).Height(55).Image(qrPng);
                        qrCol.Item().Text("Scan to verify").FontSize(7).FontColor(Colors.Grey.Darken1);
                    });
                    row.RelativeItem();
                });
            }
        });
    }

    // ── SkiaSharp renderer ────────────────────────────────────────────────────

    private static byte[] WrapImageInPdf(byte[] imageBytes)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        // Decode just enough to get the image dimensions
        using var infoBitmap = SKBitmap.Decode(imageBytes);
        float imgW = infoBitmap?.Width ?? 1190;
        float imgH = infoBitmap?.Height ?? 842;

        // Convert pixels to points at 96 dpi (1 pt = 96/72 px)
        const float pxToPt = 72f / 96f;
        float ptW = imgW * pxToPt;
        float ptH = imgH * pxToPt;

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(ptW, ptH, Unit.Point);
                page.Margin(0);
                page.Content().Image(imageBytes, ImageScaling.FitWidth);
            });
        });
        return doc.GeneratePdf();
    }

    private static byte[] RenderCertificateWithSkia(
        Certificate cert,
        byte[] templateImageBytes,
        List<CertificateTemplateField> fields,
        string? qrCodeUrl = null)
    {
        using var templateBitmap = SKBitmap.Decode(templateImageBytes)
            ?? throw new InvalidOperationException("Failed to decode template image.");

        int imgW = templateBitmap.Width;
        int imgH = templateBitmap.Height;

        using var outBitmap = new SKBitmap(imgW, imgH, SKColorType.Rgba8888, SKAlphaType.Premul);
        using var canvas = new SKCanvas(outBitmap);

        canvas.Clear(SKColors.White);
        canvas.DrawBitmap(templateBitmap, 0, 0);

        using var paint = new SKPaint { IsAntialias = true, Color = SKColors.Black };

        foreach (var field in fields)
        {
            float fx = field.X * imgW;
            float fy = field.Y * imgH;
            float fw = field.Width * imgW;
            float fh = field.Height * imgH;

            if (field.Key == "signature")
            {
                // White fill to cover template placeholder
                using (var wp = new SKPaint { Color = SKColors.White })
                    canvas.DrawRect(new SKRect(fx, fy, fx + fw, fy + fh), wp);

                if (!string.IsNullOrEmpty(cert.IssuerSignatureDataUrl))
                {
                    var base64 = cert.IssuerSignatureDataUrl.Contains(',')
                        ? cert.IssuerSignatureDataUrl.Split(',')[1]
                        : cert.IssuerSignatureDataUrl;
                    using var sigBitmap = SKBitmap.Decode(Convert.FromBase64String(base64));
                    if (sigBitmap != null)
                        canvas.DrawBitmap(sigBitmap, FitRect(fx, fy, fw, fh, sigBitmap.Width, sigBitmap.Height));
                }
                else
                {
                    DrawSignatureField(canvas, fx, fy, fw, fh);
                }
                continue;
            }

            if (field.Key == "qrCode")
            {
                // White fill to cover any template placeholder
                using (var wp = new SKPaint { Color = SKColors.White })
                    canvas.DrawRect(new SKRect(fx, fy, fx + fw, fy + fh), wp);

                if (!string.IsNullOrEmpty(qrCodeUrl))
                {
                    var qrPng = GenerateQrCodePng(qrCodeUrl);
                    using var qrBitmap = SKBitmap.Decode(qrPng);
                    if (qrBitmap != null)
                        canvas.DrawBitmap(qrBitmap, FitRect(fx, fy, fw, fh, qrBitmap.Width, qrBitmap.Height));
                }
                continue;
            }

            string text = field.Key switch
            {
                "recipientName" => $"{cert.RecipientUser.FirstName} {cert.RecipientUser.LastName}",
                "eventName"     => cert.EventName,
                "description"   => cert.Description,
                "issuedDate"    => cert.IssuedDate.ToString("MMMM dd, yyyy"),
                "issuedBy"      => $"{cert.IssuedByUser.FirstName} {cert.IssuedByUser.LastName}",
                _               => string.Empty
            };

            if (string.IsNullOrWhiteSpace(text)) continue;

            bool isBold = field.Key == "recipientName";

            // Fill box with white to cover any existing placeholder text on the template
            using (var whitePaint = new SKPaint { Color = SKColors.White, IsAntialias = false })
                canvas.DrawRect(new SKRect(fx, fy, fx + fw, fy + fh), whitePaint);

            DrawTextInBox(canvas, text, fx, fy, fw, fh, isBold, SKColors.Black);
        }

        using var encoded = outBitmap.Encode(SKEncodedImageFormat.Png, 100);
        return encoded.ToArray();
    }

    /// Computes a centered, aspect-ratio-preserving (contain) destination rect
    /// for an image of size (srcW x srcH) inside a box (bx, by, bw, bh).
    private static SKRect FitRect(float bx, float by, float bw, float bh, float srcW, float srcH)
    {
        float scale = Math.Min(bw / srcW, bh / srcH);
        float dw = srcW * scale;
        float dh = srcH * scale;
        float dx = bx + (bw - dw) / 2f;
        float dy = by + (bh - dh) / 2f;
        return new SKRect(dx, dy, dx + dw, dy + dh);
    }

    private static void DrawTextInBox(
        SKCanvas canvas, string text,
        float bx, float by, float bw, float bh,
        bool bold, SKColor color)
    {
        var fontStyle = bold ? SKFontStyle.Bold : SKFontStyle.Normal;
        using var typeface = SKTypeface.FromFamilyName(null, fontStyle);
        using var font = new SKFont(typeface);
        using var paint = new SKPaint { IsAntialias = true, Color = color };

        float maxW = bw * 0.9f;
        float startFontSize = bh * 0.6f;

        // Try decreasing font sizes until wrapped lines fit vertically in the box
        for (float fontSize = startFontSize; fontSize >= 6f; fontSize -= 0.5f)
        {
            font.Size = fontSize;
            var lines = WrapText(font, text, maxW);
            var metrics = font.Metrics;
            float lineHeight = -metrics.Ascent + metrics.Descent + Math.Max(metrics.Leading, fontSize * 0.15f);
            float totalH = lines.Count * lineHeight;

            if (totalH <= bh * 0.95f || fontSize <= 6f)
            {
                float startY = by + (bh - totalH) / 2f + (-metrics.Ascent);
                foreach (var line in lines)
                {
                    float lineW = font.MeasureText(line);
                    float x = bx + (bw - lineW) / 2f;
                    canvas.DrawText(line, x, startY, font, paint);
                    startY += lineHeight;
                }
                return;
            }
        }
    }

    private static List<string> WrapText(SKFont font, string text, float maxWidth)
    {
        var lines = new List<string>();
        var words = text.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var currentLine = new StringBuilder();

        foreach (var word in words)
        {
            string testLine = currentLine.Length == 0 ? word : currentLine + " " + word;
            if (font.MeasureText(testLine) > maxWidth && currentLine.Length > 0)
            {
                lines.Add(currentLine.ToString());
                currentLine.Clear();
                currentLine.Append(word);
            }
            else
            {
                currentLine.Clear();
                currentLine.Append(testLine);
            }
        }

        if (currentLine.Length > 0)
            lines.Add(currentLine.ToString());

        return lines.Count == 0 ? new List<string> { text } : lines;
    }

    private static void DrawSignatureField(SKCanvas canvas, float bx, float by, float bw, float bh)
    {
        // White background to cover the template's existing placeholder
        using (var whitePaint = new SKPaint { Color = SKColors.White, IsAntialias = false })
            canvas.DrawRect(new SKRect(bx, by, bx + bw, by + bh), whitePaint);

        using var linePaint = new SKPaint
        {
            Color = SKColors.Black,
            StrokeWidth = Math.Max(1f, bh * 0.025f),
            IsAntialias = true,
            IsStroke = true
        };

        // Horizontal signature line at 70% height of the box
        float lineY = by + bh * 0.70f;
        canvas.DrawLine(bx + bw * 0.05f, lineY, bx + bw * 0.95f, lineY, linePaint);

        // "Signature" label below the line
        using var typeface = SKTypeface.FromFamilyName(null, SKFontStyle.Italic);
        using var font = new SKFont(typeface, bh * 0.22f);
        using var textPaint = new SKPaint { IsAntialias = true, Color = SKColors.Gray };
        float labelW = font.MeasureText("Signature");
        canvas.DrawText("Signature", bx + (bw - labelW) / 2f, by + bh * 0.92f, font, textPaint);
    }

    // ── PPTX generation ───────────────────────────────────────────────────────

    /// <summary>
    /// Fills a .pptx template by replacing {{placeholder}} tokens and returns the filled bytes.
    /// A PPTX is a ZIP archive of XML files, so we replace tokens directly at the XML level
    /// to avoid OpenXML SDK content-type compatibility issues.
    /// Supported tokens: {{recipientName}}, {{eventName}}, {{description}},
    ///                    {{issuedDate}}, {{issuedBy}}, {{signature}}.
    /// </summary>
    private static byte[] GeneratePptxCertificate(Certificate cert, string templatePath, string? recipientNameOverride = null)
    {
        var resolvedRecipientName = string.IsNullOrWhiteSpace(recipientNameOverride)
            ? $"{cert.RecipientUser.FirstName} {cert.RecipientUser.LastName}"
            : recipientNameOverride.Trim();

        var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { "recipientName", resolvedRecipientName },
            { "eventName",     cert.EventName },
            { "description",   cert.Description ?? string.Empty },
            { "issuedDate",    cert.IssuedDate.ToString("MMMM dd, yyyy") },
            { "issuedBy",      $"{cert.IssuedByUser.FirstName} {cert.IssuedByUser.LastName}" },
            { "signature",     string.Empty }
        };

        var templateBytes = System.IO.File.ReadAllBytes(templatePath);
        using var inputMs  = new MemoryStream(templateBytes);
        var       outputMs = new MemoryStream();

        using (var inputZip  = new ZipArchive(inputMs,  ZipArchiveMode.Read))
        using (var outputZip = new ZipArchive(outputMs, ZipArchiveMode.Create, leaveOpen: true))
        {
            foreach (var entry in inputZip.Entries)
            {
                var newEntry = outputZip.CreateEntry(entry.FullName, CompressionLevel.Optimal);
                newEntry.LastWriteTime = entry.LastWriteTime;

                using var inputStream  = entry.Open();
                using var outputStream = newEntry.Open();

                // Replace tokens only inside XML parts (slides, notes, layout, master, …)
                if (entry.FullName.EndsWith(".xml", StringComparison.OrdinalIgnoreCase))
                {
                    using var reader = new StreamReader(inputStream, Encoding.UTF8);
                    var xml = reader.ReadToEnd();

                    foreach (var (key, val) in values)
                        xml = xml.Replace($"{{{{{key}}}}}", XmlEscape(val), StringComparison.OrdinalIgnoreCase);

                    var xmlBytes = Encoding.UTF8.GetBytes(xml);
                    outputStream.Write(xmlBytes);
                }
                else
                {
                    inputStream.CopyTo(outputStream);
                }
            }
        }

        return outputMs.ToArray();
    }

    private static string XmlEscape(string value) =>
        value.Replace("&", "&amp;")
             .Replace("<", "&lt;")
             .Replace(">", "&gt;")
             .Replace("\"", "&quot;")
             .Replace("'", "&apos;");
}
