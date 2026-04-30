namespace FlosskMS.Business.DTOs;

public class MembershipRequestDto
{
    public Guid Id { get; set; }
    
    // Personal Information
    public string FullName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string SchoolOrCompany { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string Statement { get; set; } = string.Empty;
    
    // ID Card
    public string IdCardNumber { get; set; } = string.Empty;
    
    // Signature Files
    public Guid? ApplicantSignatureFileId { get; set; }
    public Guid? GuardianSignatureFileId { get; set; }
    
    // Status
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    
    // Review Information
    public string? ReviewedByUserId { get; set; }
    public string? ReviewedByFirstName { get; set; }
    public string? ReviewedByLastName { get; set; }
    public Guid? BoardMemberSignatureFileId { get; set; }
    
    // Rejection
    public string? RejectionReason { get; set; }
    
    // Computed property
    public bool IsUnder14 { get; set; }
}
