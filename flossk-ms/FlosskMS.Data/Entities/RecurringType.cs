using System.Text.Json.Serialization;

namespace FlosskMS.Data.Entities;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum RecurringType
{
    None = 0,
    Daily = 1,
    Monthly = 2,
    Weekly = 3,
    Annually = 4
}
