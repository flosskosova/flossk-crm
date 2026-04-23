namespace FlosskMS.Business.DTOs;

public class AuthResponseDto
{
    public bool Success { get; set; }
    public string? Token { get; set; }
    public DateTime? Expiration { get; set; }
    public UserDto? User { get; set; }
    public Guid? CourseId { get; set; }
    public List<string> Errors { get; set; } = new();
}
