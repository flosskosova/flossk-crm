using FlosskMS.Business.DTOs;
using FlosskMS.Data;
using FlosskMS.Data.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using SkiaSharp;

namespace FlosskMS.Business.Services;

public class CertificateService : ICertificateService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IHostEnvironment _env;

    public CertificateService(
        ApplicationDbContext dbContext,
        IHostEnvironment env)
    {
        _dbContext = dbContext;
        _env = env;
    }

    public async Task<IActionResult> IssueCertificatesAsync(IssueCertificateDto request, string issuedByUserId)
    {
        if (request.RecipientUserIds == null || request.RecipientUserIds.Count == 0)
            return new BadRequestObjectResult(new { Error = "At least one recipient is required." });

        if (!Enum.TryParse<CertificateType>(request.Type, true, out var certType))
            return new BadRequestObjectResult(new { Error = $"Invalid certificate type: {request.Type}" });

        var issuer = await _dbContext.Users.FindAsync(issuedByUserId);
        if (issuer == null)
            return new UnauthorizedResult();

        var recipients = await _dbContext.Users
            .Where(u => request.RecipientUserIds.Contains(u.Id))
            .ToListAsync();

        if (recipients.Count == 0)
            return new BadRequestObjectResult(new { Error = "No valid recipients found." });

        var issuedDate = request.IssuedDate ?? DateTime.UtcNow;

        var certificates = recipients.Select(recipient => new Certificate
        {
            Id = Guid.NewGuid(),
            Type = certType,
            EventName = request.EventName,
            Description = request.Description,
            Status = CertificateStatus.Issued,
            IssuedDate = issuedDate,
            CreatedAt = DateTime.UtcNow,
            RecipientUserId = recipient.Id,
            IssuedByUserId = issuedByUserId,
            TemplateId = request.TemplateId
        }).ToList();

        _dbContext.Certificates.AddRange(certificates);
        await _dbContext.SaveChangesAsync();

        // Reload with navigation properties
        var certIds = certificates.Select(c => c.Id).ToList();
        var saved = await _dbContext.Certificates
            .Include(c => c.RecipientUser)
            .Include(c => c.IssuedByUser)
            .Where(c => certIds.Contains(c.Id))
            .ToListAsync();

        var dtos = saved.Select(MapToDto).ToList();

        return new OkObjectResult(dtos);
    }

    public async Task<IActionResult> GetCertificatesAsync(int page = 1, int pageSize = 10)
    {
        var query = _dbContext.Certificates
            .Include(c => c.RecipientUser)
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

    public async Task<IActionResult> GetCertificateByIdAsync(Guid id)
    {
        var certificate = await _dbContext.Certificates
            .Include(c => c.RecipientUser)
            .Include(c => c.IssuedByUser)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (certificate == null)
            return new NotFoundObjectResult(new { Error = "Certificate not found." });

        return new OkObjectResult(MapToDto(certificate));
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

        QuestPDF.Settings.License = LicenseType.Community;

        byte[]? templateImageBytes = null;
        if (certificate.Template != null)
        {
            var templatePath = Path.Combine(_env.ContentRootPath, "uploads", "cert-templates", Path.GetFileName(certificate.Template.FilePath));
            if (System.IO.File.Exists(templatePath))
                templateImageBytes = await System.IO.File.ReadAllBytesAsync(templatePath);
        }

        byte[] pdfBytes;
        if (templateImageBytes != null && certificate.Template?.Fields.Count > 0)
        {
            // SkiaSharp path: render text onto the template image, then wrap in a PDF
            var compositeImageBytes = RenderCertificateWithSkia(certificate, templateImageBytes, certificate.Template.Fields.ToList());
            pdfBytes = WrapImageInPdf(compositeImageBytes);
        }
        else
        {
            pdfBytes = GenerateCertificatePdf(certificate, templateImageBytes);
        }

        var recipientName = $"{certificate.RecipientUser.FirstName}_{certificate.RecipientUser.LastName}";

        return new FileContentResult(pdfBytes, "application/pdf")
        {
            FileDownloadName = $"FLOSSK_Certificate_{recipientName}_{certificate.EventName.Replace(" ", "_")}.pdf"
        };
    }

    public async Task<IActionResult> UploadTemplateAsync(IFormFile file, string name, string userId)
    {
        var allowedTypes = new[] { "image/png", "image/jpeg", "image/jpg", "image/webp" };
        if (!allowedTypes.Contains(file.ContentType.ToLower()))
            return new BadRequestObjectResult(new { Error = "Only PNG, JPG, and WebP images are supported as certificate templates." });

        const long maxSize = 10 * 1024 * 1024; // 10 MB
        if (file.Length > maxSize)
            return new BadRequestObjectResult(new { Error = "Template file must not exceed 10 MB." });

        var user = await _dbContext.Users.FindAsync(userId);
        if (user == null) return new UnauthorizedResult();

        var templateDir = Path.Combine(_env.ContentRootPath, "uploads", "cert-templates");
        Directory.CreateDirectory(templateDir);

        var ext = Path.GetExtension(file.FileName);
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

        return new OkObjectResult(MapTemplateToDto(template, user));
    }

    public async Task<IActionResult> GetTemplatesAsync()
    {
        var templates = await _dbContext.CertificateTemplates
            .Include(t => t.CreatedByUser)
            .OrderByDescending(t => t.UploadedAt)
            .ToListAsync();

        var dtos = templates.Select(t => MapTemplateToDto(t, t.CreatedByUser)).ToList();
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

    private CertificateDto MapToDto(Certificate cert)
    {
        var recipientFiles = _dbContext.UploadedFiles
            .Where(f => f.CreatedByUserId == cert.RecipientUserId && f.FileType == FileType.ProfilePicture)
            .OrderByDescending(f => f.UploadedAt)
            .FirstOrDefault();

        return new CertificateDto
        {
            Id = cert.Id,
            CertificateType = cert.Type.ToString(),
            EventName = cert.EventName,
            Description = cert.Description,
            Status = cert.Status.ToString(),
            IssuedDate = cert.IssuedDate,
            CreatedAt = cert.CreatedAt,
            RecipientUserId = cert.RecipientUserId,
            RecipientName = $"{cert.RecipientUser.FirstName} {cert.RecipientUser.LastName}",
            RecipientEmail = cert.RecipientUser.Email ?? string.Empty,
            RecipientProfilePictureUrl = recipientFiles?.FilePath ?? string.Empty,
            IssuedByUserId = cert.IssuedByUserId,
            IssuedByName = $"{cert.IssuedByUser.FirstName} {cert.IssuedByUser.LastName}"
        };
    }

    private static CertificateTemplateDto MapTemplateToDto(CertificateTemplate t, ApplicationUser user) => new()
    {
        Id = t.Id,
        Name = t.Name,
        OriginalFileName = t.OriginalFileName,
        ContentType = t.ContentType,
        FileSize = t.FileSize,
        UploadedAt = t.UploadedAt,
        CreatedByName = $"{user.FirstName} {user.LastName}",
        PreviewPath = t.FilePath
    };

    private byte[] GenerateCertificatePdf(Certificate certificate, byte[]? templateImageBytes = null)
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
                        ComposeTemplateOverlay(c, certificate, recipientName);
                    else
                        ComposeCertificateContent(c, certificate, recipientName);
                });
            });
        });

        return document.GeneratePdf();
    }

    private void ComposeCertificateContent(IContainer container, Certificate certificate, string recipientName)
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
            column.Item().AlignCenter().Text($"of {certificate.Type}")
                .FontSize(16).FontColor(Colors.Grey.Darken2);

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
                    c.Item().AlignRight().Text("Issued By").FontSize(10).FontColor(Colors.Grey.Darken1);
                    c.Item().AlignRight().Text($"{certificate.IssuedByUser.FirstName} {certificate.IssuedByUser.LastName}").FontSize(12).Bold();
                });
            });
        });
    }

    private void ComposeTemplateOverlay(IContainer container, Certificate certificate, string recipientName)
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
                    c.Item().AlignRight().Text("Issued By").FontSize(10).FontColor(Colors.Grey.Darken1);
                    c.Item().AlignRight().Text($"{certificate.IssuedByUser.FirstName} {certificate.IssuedByUser.LastName}").FontSize(12).Bold();
                });
            });
        });
    }

    // ── SkiaSharp renderer ────────────────────────────────────────────────────

    private static byte[] WrapImageInPdf(byte[] imageBytes)
    {
        QuestPDF.Settings.License = LicenseType.Community;
        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(0);
                page.Content().Image(imageBytes, ImageScaling.FitArea);
            });
        });
        return doc.GeneratePdf();
    }

    private static byte[] RenderCertificateWithSkia(
        Certificate cert,
        byte[] templateImageBytes,
        List<CertificateTemplateField> fields)
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
                DrawSignatureField(canvas, fx, fy, fw, fh);
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
            DrawTextInBox(canvas, text, fx, fy, fw, fh, isBold, SKColors.Black);
        }

        using var encoded = outBitmap.Encode(SKEncodedImageFormat.Png, 100);
        return encoded.ToArray();
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

        // Auto-size: start at 60% of box height, scale down to fit width
        float maxW = bw * 0.9f;
        font.Size = bh * 0.6f;
        float textW = font.MeasureText(text);
        if (textW > maxW)
            font.Size *= maxW / textW;
        if (font.Size < 6f) font.Size = 6f;

        // Re-measure after resizing
        textW = font.MeasureText(text);

        var metrics = font.Metrics;
        float textBlockH = -metrics.Ascent + metrics.Descent;

        float x = bx + (bw - textW) / 2f;
        float y = by + (bh - textBlockH) / 2f + (-metrics.Ascent);

        canvas.DrawText(text, x, y, font, paint);
    }

    private static void DrawSignatureField(SKCanvas canvas, float bx, float by, float bw, float bh)
    {
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
}
