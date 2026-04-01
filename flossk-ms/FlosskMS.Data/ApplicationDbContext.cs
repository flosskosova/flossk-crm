using FlosskMS.Data.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace FlosskMS.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<ApprovedEmail> ApprovedEmails { get; set; }
    public DbSet<UploadedFile> UploadedFiles { get; set; }
    public DbSet<Announcement> Announcements { get; set; }
    public DbSet<AnnouncementReaction> AnnouncementReactions { get; set; }
    public DbSet<AnnouncementView> AnnouncementViews { get; set; }
    public DbSet<MembershipRequest> MembershipRequests { get; set; }
    public DbSet<CollaborationPad> CollaborationPads { get; set; }
    public DbSet<UserRfidCard> UserRfidCards { get; set; }
    public DbSet<Project> Projects { get; set; }
    public DbSet<Objective> Objectives { get; set; }
    public DbSet<Resource> Resources { get; set; }
    public DbSet<ResourceFile> ResourceFiles { get; set; }
    public DbSet<ProjectTeamMember> ProjectTeamMembers { get; set; }
    public DbSet<ProjectModerator> ProjectModerators { get; set; }
    public DbSet<ObjectiveTeamMember> ObjectiveTeamMembers { get; set; }
    public DbSet<CalendarEvent> CalendarEvents { get; set; }
    public DbSet<InventoryItem> InventoryItems { get; set; }
    public DbSet<InventoryItemImage> InventoryItemImages { get; set; }
    public DbSet<InventoryItemCheckout> InventoryItemCheckouts { get; set; }
    public DbSet<Log> Logs { get; set; }
    public DbSet<Election> Elections { get; set; }
    public DbSet<ElectionCandidate> ElectionCandidates { get; set; }
    public DbSet<ElectionVote> ElectionVotes { get; set; }
    public DbSet<ElectionCategory> ElectionCategories { get; set; }
    public DbSet<UserContribution> UserContributions { get; set; }
    public DbSet<Certificate> Certificates { get; set; }
    public DbSet<CertificateTemplate> CertificateTemplates { get; set; }
    public DbSet<CertificateTemplateField> CertificateTemplateFields { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<PushSubscription> PushSubscriptions { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(e => e.FirstName).HasMaxLength(100);
            entity.Property(e => e.LastName).HasMaxLength(100);
        });

        builder.Entity<ApprovedEmail>(entity =>
        {
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Email).HasMaxLength(256).IsRequired();
        });

        builder.Entity<UploadedFile>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FileName).HasMaxLength(255).IsRequired();
            entity.Property(e => e.OriginalFileName).HasMaxLength(255).IsRequired();
            entity.Property(e => e.ContentType).HasMaxLength(100).IsRequired();
            entity.Property(e => e.FilePath).HasMaxLength(500).IsRequired();
            entity.Property(e => e.ScanResult).HasMaxLength(500);
            
            entity.HasOne(e => e.CreatedByUser)
                .WithMany()
                .HasForeignKey(e => e.CreatedByUserId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Announcement>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Body).IsRequired();
            entity.Property(e => e.Importance)
                .HasConversion<string>()
                .HasMaxLength(20);
            entity.Property(e => e.Category)
                .HasConversion<string>()
                .HasMaxLength(20);
            
            entity.HasOne(e => e.CreatedByUser)
                .WithMany()
                .HasForeignKey(e => e.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
            
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.Category);
            entity.HasIndex(e => e.Importance);
        });

        builder.Entity<AnnouncementReaction>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Emoji).HasMaxLength(10).IsRequired();
            
            entity.HasOne(e => e.Announcement)
                .WithMany(a => a.Reactions)
                .HasForeignKey(e => e.AnnouncementId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            
            // Ensure a user can only have one reaction per emoji per announcement
            entity.HasIndex(e => new { e.AnnouncementId, e.UserId, e.Emoji }).IsUnique();
        });

        builder.Entity<AnnouncementView>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.HasOne(e => e.Announcement)
                .WithMany()
                .HasForeignKey(e => e.AnnouncementId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            
            // Ensure a user can only view an announcement once (tracked)
            entity.HasIndex(e => new { e.AnnouncementId, e.UserId }).IsUnique();
            entity.HasIndex(e => e.ViewedAt);
        });

        builder.Entity<MembershipRequest>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FullName).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Address).HasMaxLength(500).IsRequired();
            entity.Property(e => e.City).HasMaxLength(100).IsRequired();
            entity.Property(e => e.PhoneNumber).HasMaxLength(20).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(256).IsRequired();
            entity.Property(e => e.SchoolOrCompany).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Statement).HasMaxLength(2000).IsRequired();
            entity.Property(e => e.IdCardNumber).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            // Applicant signature relationship
            entity.HasOne(e => e.ApplicantSignatureFile)
                .WithMany()
                .HasForeignKey(e => e.ApplicantSignatureFileId)
                .OnDelete(DeleteBehavior.Restrict);

            // Guardian signature relationship
            entity.HasOne(e => e.GuardianSignatureFile)
                .WithMany()
                .HasForeignKey(e => e.GuardianSignatureFileId)
                .OnDelete(DeleteBehavior.Restrict);

            // Board member signature relationship
            entity.HasOne(e => e.BoardMemberSignatureFile)
                .WithMany()
                .HasForeignKey(e => e.BoardMemberSignatureFileId)
                .OnDelete(DeleteBehavior.Restrict);

            // Reviewer relationship
            entity.HasOne(e => e.ReviewedByUser)
                .WithMany()
                .HasForeignKey(e => e.ReviewedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.Email);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
        });

        builder.Entity<CollaborationPad>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Url).HasMaxLength(2000).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(1000);
            
            entity.HasOne(e => e.CreatedByUser)
                .WithMany()
                .HasForeignKey(e => e.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
            
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.Name);
        });

        builder.Entity<UserRfidCard>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CardIdentifier).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.Property(e => e.RevocationReason).HasMaxLength(500);

            // RegisteredBy is required
            entity.HasOne(e => e.RegisteredByUser)
                .WithMany()
                .HasForeignKey(e => e.RegisteredByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // User assignment is optional (card can be unassigned)
            entity.HasOne(e => e.User)
                .WithMany(u => u.RfidCards)
                .HasForeignKey(e => e.UserId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.AssignedByUser)
                .WithMany()
                .HasForeignKey(e => e.AssignedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.RevokedByUser)
                .WithMany()
                .HasForeignKey(e => e.RevokedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.CardIdentifier).IsUnique();
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.IsActive);
        });

        // Project configuration
        builder.Entity<Project>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(10000);
            entity.Property(e => e.Status)
                .HasConversion<string>()
                .HasMaxLength(20);
            
            entity.HasOne(e => e.CreatedByUser)
                .WithMany()
                .HasForeignKey(e => e.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.Moderators)
                .WithOne(m => m.Project)
                .HasForeignKey(m => m.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Ignore(e => e.ProgressPercentage); // Calculated property

            entity.HasIndex(e => e.Title);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.StartDate);
            entity.HasIndex(e => e.EndDate);
        });

        // Objective configuration
        builder.Entity<Objective>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(10000);
            entity.Property(e => e.Status)
                .HasConversion<string>()
                .HasMaxLength(20);
            
            entity.HasOne(e => e.Project)
                .WithMany(p => p.Objectives)
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.CreatedByUser)
                .WithMany()
                .HasForeignKey(e => e.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.Title);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.ProjectId);
        });

        // Resource configuration
        builder.Entity<Resource>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Urls)
                .HasColumnType("text[]")
                .HasDefaultValueSql("'{}'");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Type)
                .HasConversion<string>()
                .HasMaxLength(20);
            
            entity.HasOne(e => e.Project)
                .WithMany(p => p.Resources)
                .HasForeignKey(e => e.ProjectId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.Objective)
                .WithMany(o => o.Resources)
                .HasForeignKey(e => e.ObjectiveId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.CreatedByUser)
                .WithMany()
                .HasForeignKey(e => e.CreatedByUserId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.Type);
            entity.HasIndex(e => e.ProjectId);
            entity.HasIndex(e => e.ObjectiveId);
        });

        // ResourceFile configuration (many-to-many join between Resource and UploadedFile)
        builder.Entity<ResourceFile>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.HasOne(e => e.Resource)
                .WithMany(r => r.Files)
                .HasForeignKey(e => e.ResourceId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.File)
                .WithMany()
                .HasForeignKey(e => e.FileId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.ResourceId);
            entity.HasIndex(e => e.FileId);
            entity.HasIndex(e => new { e.ResourceId, e.FileId }).IsUnique();
        });

        // ProjectTeamMember (many-to-many join table)
        builder.Entity<ProjectTeamMember>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Role).HasMaxLength(100);
            
            entity.HasOne(e => e.Project)
                .WithMany(p => p.TeamMembers)
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Ensure a user can only be added once per project
            entity.HasIndex(e => new { e.ProjectId, e.UserId }).IsUnique();
        });

        // ProjectModerator (many-to-many join table)
        builder.Entity<ProjectModerator>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasOne(e => e.Project)
                .WithMany(p => p.Moderators)
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Ensure a user can only appear once per project (a user can moderate multiple projects)
            entity.HasIndex(e => new { e.ProjectId, e.UserId }).IsUnique();
        });

        // ObjectiveTeamMember (many-to-many join table)
        builder.Entity<ObjectiveTeamMember>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.HasOne(e => e.Objective)
                .WithMany(o => o.TeamMembers)
                .HasForeignKey(e => e.ObjectiveId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Ensure a user can only be added once per objective
            entity.HasIndex(e => new { e.ObjectiveId, e.UserId }).IsUnique();
        });

        builder.Entity<CalendarEvent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CalendarUrl).HasMaxLength(2000).IsRequired();
            entity.Property(e => e.Title).HasMaxLength(200);
            
            entity.HasOne(e => e.CreatedByUser)
                .WithMany()
                .HasForeignKey(e => e.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // InventoryItem configuration
        builder.Entity<InventoryItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(2000);
            entity.Property(e => e.Category)
                .HasConversion<string>()
                .HasMaxLength(200);
            entity.Property(e => e.Status)
                .HasConversion<string>()
                .HasMaxLength(20);
            
            entity.HasOne(e => e.CreatedByUser)
                .WithMany()
                .HasForeignKey(e => e.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.Name);
            entity.HasIndex(e => e.Category);
            entity.HasIndex(e => e.Status);
        });

        // InventoryItemImage configuration
        builder.Entity<InventoryItemImage>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.HasOne(e => e.InventoryItem)
                .WithMany(i => i.Images)
                .HasForeignKey(e => e.InventoryItemId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.UploadedFile)
                .WithMany()
                .HasForeignKey(e => e.UploadedFileId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.InventoryItemId);
            entity.HasIndex(e => e.UploadedFileId);
            entity.HasIndex(e => new { e.InventoryItemId, e.UploadedFileId }).IsUnique();
        });

        // Election configuration
        builder.Entity<Election>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(2000);
            entity.Property(e => e.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.HasOne(e => e.CreatedByUser)
                .WithMany()
                .HasForeignKey(e => e.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.FinalizedByUser)
                .WithMany()
                .HasForeignKey(e => e.FinalizedByUserId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => e.StartDate);
            entity.HasIndex(e => e.EndDate);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.IsFinalized);
        });

        builder.Entity<ElectionCandidate>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasOne(e => e.Election)
                .WithMany(e => e.Candidates)
                .HasForeignKey(e => e.ElectionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // A user can only be a candidate once per election
            entity.HasIndex(e => new { e.ElectionId, e.UserId }).IsUnique();
        });

        builder.Entity<ElectionVote>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasOne(e => e.Election)
                .WithMany(e => e.Votes)
                .HasForeignKey(e => e.ElectionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.VoterUser)
                .WithMany()
                .HasForeignKey(e => e.VoterUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.CandidateUser)
                .WithMany()
                .HasForeignKey(e => e.CandidateUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // A voter can vote for exactly 3 distinct candidates per election
            entity.HasIndex(e => new { e.ElectionId, e.VoterUserId, e.CandidateUserId }).IsUnique();
            entity.HasIndex(e => e.CandidateUserId);
        });

        // Log configuration
        builder.Entity<Log>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.EntityType).HasMaxLength(100).IsRequired();
            entity.Property(e => e.EntityId).HasMaxLength(100).IsRequired();
            entity.Property(e => e.EntityName).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Action).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Detail).HasMaxLength(1000);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.EntityType);
            entity.HasIndex(e => e.EntityId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Timestamp);
        });

        // UserContribution configuration
        builder.Entity<UserContribution>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasOne(e => e.Project)
                .WithMany()
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // One contribution record per user per project
            entity.HasIndex(e => new { e.ProjectId, e.UserId }).IsUnique();
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Score);
        });

        // ElectionCategory configuration
        builder.Entity<ElectionCategory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.VotingRule)
                .HasConversion<string>()
                .HasMaxLength(30);

            entity.HasOne(e => e.CreatedByUser)
                .WithMany()
                .HasForeignKey(e => e.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.Title);
            entity.HasIndex(e => e.VotingRule);
            entity.HasIndex(e => e.CreatedAt);
        });

        // Certificate
        builder.Entity<Certificate>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.EventName).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(2000);
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(20);
            entity.HasOne(e => e.RecipientUser).WithMany()
                .HasForeignKey(e => e.RecipientUserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.IssuedByUser).WithMany()
                .HasForeignKey(e => e.IssuedByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Template).WithMany()
                .HasForeignKey(e => e.TemplateId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.Project).WithMany()
                .HasForeignKey(e => e.ProjectId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(e => e.RecipientUserId);
            entity.HasIndex(e => e.IssuedByUserId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
        });

        // CertificateTemplate
        builder.Entity<CertificateTemplate>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.OriginalFileName).HasMaxLength(255).IsRequired();
            entity.Property(e => e.FilePath).HasMaxLength(500).IsRequired();
            entity.Property(e => e.ContentType).HasMaxLength(100).IsRequired();
            entity.HasOne(e => e.CreatedByUser).WithMany()
                .HasForeignKey(e => e.CreatedByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => e.UploadedAt);
        });

        // CertificateTemplateField
        builder.Entity<CertificateTemplateField>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Key).HasMaxLength(50).IsRequired();
            entity.HasOne(e => e.Template)
                .WithMany(t => t.Fields)
                .HasForeignKey(e => e.TemplateId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.TemplateId);
        });

        // Notification
        builder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Body).HasMaxLength(2000);
            entity.Property(e => e.Metadata).HasMaxLength(4000);
            entity.Property(e => e.Type)
                .HasConversion<string>()
                .HasMaxLength(50);
            entity.Property(e => e.Priority)
                .HasConversion<string>()
                .HasMaxLength(20);
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => new { e.UserId, e.IsRead });
        });

        // PushSubscription
        builder.Entity<PushSubscription>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Endpoint).HasMaxLength(2000).IsRequired();
            entity.Property(e => e.P256dh).HasMaxLength(500).IsRequired();
            entity.Property(e => e.Auth).HasMaxLength(500).IsRequired();
            entity.Property(e => e.UserAgent).HasMaxLength(500);
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Endpoint).IsUnique();
        });
    }
}
