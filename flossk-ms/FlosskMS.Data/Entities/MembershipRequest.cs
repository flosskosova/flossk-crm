namespace FlosskMS.Data.Entities;

public class MembershipRequest
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
    
    // ID Card Number
    public string IdCardNumber { get; set; } = string.Empty;
    
    // Applicant Signature (required if 14 or older)
    public Guid? ApplicantSignatureFileId { get; set; }
    public UploadedFile? ApplicantSignatureFile { get; set; }
    
    // Guardian Signature (required if under 14)
    public Guid? GuardianSignatureFileId { get; set; }
    public UploadedFile? GuardianSignatureFile { get; set; }
    
    // Request Status
    public MembershipRequestStatus Status { get; set; } = MembershipRequestStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }
    
    // Review Information (for approval/rejection)
    public string? ReviewedByUserId { get; set; }
    public ApplicationUser? ReviewedByUser { get; set; }
    
    // Board Member Signature (required for approval)
    public Guid? BoardMemberSignatureFileId { get; set; }
    public UploadedFile? BoardMemberSignatureFile { get; set; }
    
    // Rejection reason (optional, set when request is rejected)
    public string? RejectionReason { get; set; }
    
    /// <summary>
    /// Determines if the applicant is under 14 years old based on their date of birth
    /// </summary>
    public bool IsUnder14()
    {
        var today = DateTime.UtcNow.Date;
        var age = today.Year - DateOfBirth.Year;
        if (DateOfBirth.Date > today.AddYears(-age)) age--;
        return age < 14;
    }
}
