using System.ComponentModel.DataAnnotations;

namespace FlosskMS.Business.DTOs;

public class CreateCourseResourceDto : IValidatableObject
{
    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string Title { get; set; } = string.Empty;

    public List<string> Urls { get; set; } = [];

    public List<Guid> FileIds { get; set; } = [];

    [StringLength(500)]
    public string? Description { get; set; }

    /// <summary>Documentation, Tutorial, Tool, Reference, Other</summary>
    public string Type { get; set; } = "Other";

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Urls.Count == 0 && FileIds.Count == 0)
            yield return new ValidationResult(
                "A resource must have at least one URL or one file attachment.",
                [nameof(Urls), nameof(FileIds)]);

        foreach (var url in Urls)
        {
            if (!Uri.TryCreate(url, UriKind.Absolute, out _))
                yield return new ValidationResult($"'{url}' is not a valid URL.", [nameof(Urls)]);
        }
    }
}

public class UpdateCourseResourceDto : IValidatableObject
{
    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string Title { get; set; } = string.Empty;

    public List<string> Urls { get; set; } = [];

    public List<Guid> FileIds { get; set; } = [];

    [StringLength(500)]
    public string? Description { get; set; }

    public string Type { get; set; } = "Other";

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Urls.Count == 0 && FileIds.Count == 0)
            yield return new ValidationResult(
                "A resource must have at least one URL or one file attachment.",
                [nameof(Urls), nameof(FileIds)]);

        foreach (var url in Urls)
        {
            if (!Uri.TryCreate(url, UriKind.Absolute, out _))
                yield return new ValidationResult($"'{url}' is not a valid URL.", [nameof(Urls)]);
        }
    }
}
