using System.ComponentModel.DataAnnotations;
using FlosskMS.Data.Entities;

namespace FlosskMS.Business.DTOs;

public class EventDto
{
    public Guid Id { get; set; }
    public string EventName { get; set; } = string.Empty;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? RecurringDate { get; set; }
    public RecurringType RecurringType { get; set; }
    public bool IsProjectTimeline { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? ProjectId { get; set; }
    public string? ProjectTitle { get; set; }
    public DateTime? ProjectStartDate { get; set; }
    public DateTime? ProjectEndDate { get; set; }
}

public class CreateEventDto : IValidatableObject
{
    public string EventName { get; set; } = string.Empty;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? RecurringDate { get; set; }
    public RecurringType RecurringType { get; set; }
    public Guid? ProjectId { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        return EventRequestValidation.Validate(EventName, StartDate, EndDate, RecurringDate, RecurringType);
    }
}

public class UpdateEventDto : IValidatableObject
{
    public string EventName { get; set; } = string.Empty;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? RecurringDate { get; set; }
    public RecurringType RecurringType { get; set; }
    public Guid? ProjectId { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        return EventRequestValidation.Validate(EventName, StartDate, EndDate, RecurringDate, RecurringType);
    }
}

internal static class EventRequestValidation
{
    public static IEnumerable<ValidationResult> Validate(
        string eventName,
        DateTime? startDate,
        DateTime? endDate,
        DateTime? recurringDate,
        RecurringType recurringType)
    {
        if (string.IsNullOrWhiteSpace(eventName))
        {
            yield return new ValidationResult("EventName is required.", [nameof(CreateEventDto.EventName)]);
        }

        if (recurringType == RecurringType.None)
        {
            if (!startDate.HasValue || !endDate.HasValue)
            {
                yield return new ValidationResult(
                    "Non-recurring events require StartDate and EndDate.",
                    [nameof(CreateEventDto.StartDate), nameof(CreateEventDto.EndDate)]);
            }

            if (recurringDate.HasValue)
            {
                yield return new ValidationResult(
                    "Non-recurring events must not include RecurringDate.",
                    [nameof(CreateEventDto.RecurringDate)]);
            }

            if (startDate.HasValue && endDate.HasValue && endDate < startDate)
            {
                yield return new ValidationResult(
                    "EndDate must be after or equal to StartDate.",
                    [nameof(CreateEventDto.StartDate), nameof(CreateEventDto.EndDate)]);
            }

            yield break;
        }

        if (!recurringDate.HasValue)
        {
            yield return new ValidationResult(
                "Recurring events require RecurringDate.",
                [nameof(CreateEventDto.RecurringDate)]);
        }

        if (startDate.HasValue || endDate.HasValue)
        {
            yield return new ValidationResult(
                "Recurring events must not include StartDate or EndDate.",
                [nameof(CreateEventDto.StartDate), nameof(CreateEventDto.EndDate)]);
        }
    }
}