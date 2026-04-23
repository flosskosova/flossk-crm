using FlosskMS.Business.DTOs;
using FlosskMS.Data;
using FlosskMS.Data.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FlosskMS.Business.Services;

public class ElectionService : IElectionService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<ElectionService> _logger;

    public ElectionService(
        ApplicationDbContext dbContext,
        UserManager<ApplicationUser> userManager,
        ILogger<ElectionService> logger)
    {
        _dbContext = dbContext;
        _userManager = userManager;
        _logger = logger;
    }

    // -------------------------------------------------------------------------
    // GET ALL
    // -------------------------------------------------------------------------

    public async Task<IActionResult> GetElectionsAsync()
    {
        var elections = await _dbContext.Elections
            .Include(e => e.Candidates)
            .Include(e => e.Votes)
            .OrderByDescending(e => e.StartDate)
            .ToListAsync();

        // Synchronise stored status with real-world time (auto-finalizes if end date passed)
        foreach (var election in elections)
            await SyncStatusAsync(election);

        await _dbContext.SaveChangesAsync();

        var dtos = elections.Select(MapToListDto).ToList();
        return new OkObjectResult(dtos);
    }

    // -------------------------------------------------------------------------
    // GET BY ID
    // -------------------------------------------------------------------------

    public async Task<IActionResult> GetElectionByIdAsync(Guid id, string userId)
    {
        var election = await _dbContext.Elections
            .Include(e => e.CreatedByUser)
            .Include(e => e.Candidates).ThenInclude(c => c.User)
            .Include(e => e.Votes)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (election == null)
            return new NotFoundObjectResult(new { Error = "Election not found." });

        await SyncStatusAsync(election);
        await _dbContext.SaveChangesAsync();

        return new OkObjectResult(MapToDto(election, userId));
    }

    // -------------------------------------------------------------------------
    // CREATE  (Admin only — enforced in controller)
    // -------------------------------------------------------------------------

    public async Task<IActionResult> CreateElectionAsync(CreateElectionDto request, string userId)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return new BadRequestObjectResult(new { Error = "Title is required." });

        if (request.StartDate >= request.EndDate)
            return new BadRequestObjectResult(new { Error = "End date must be after start date." });

        if (request.CandidateIds == null || request.CandidateIds.Count < 2)
            return new BadRequestObjectResult(new { Error = "At least 4 candidates are required." });

        // Verify every candidate user exists
        var candidateUsers = await _dbContext.Users
            .Where(u => request.CandidateIds.Contains(u.Id))
            .ToListAsync();

        var missing = request.CandidateIds.Except(candidateUsers.Select(u => u.Id)).ToList();
        if (missing.Count > 0)
            return new BadRequestObjectResult(new { Error = $"Users not found: {string.Join(", ", missing)}" });

        var now = DateTime.UtcNow;
        var status = now < request.StartDate
            ? ElectionStatus.Upcoming
            : now <= request.EndDate
                ? ElectionStatus.Active
                : ElectionStatus.Completed;

        var election = new Election
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            StartDate = request.StartDate.ToUniversalTime(),
            EndDate = request.EndDate.ToUniversalTime(),
            Status = status,
            CreatedAt = now,
            CreatedByUserId = userId,
            Candidates = candidateUsers.Select(u => new ElectionCandidate
            {
                Id = Guid.NewGuid(),
                UserId = u.Id
            }).ToList()
        };

        _dbContext.Elections.Add(election);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Election {ElectionId} created by user {UserId}", election.Id, userId);

        // Reload with navigation properties for the response
        await _dbContext.Entry(election).Reference(e => e.CreatedByUser).LoadAsync();
        await _dbContext.Entry(election).Collection(e => e.Candidates).Query()
            .Include(c => c.User).LoadAsync();

        return new OkObjectResult(MapToDto(election, userId));
    }

    // -------------------------------------------------------------------------
    // UPDATE  — dates & candidates only (Admin only — enforced in controller)
    // -------------------------------------------------------------------------

    public async Task<IActionResult> UpdateElectionAsync(Guid id, UpdateElectionDto request, string userId)
    {
        var election = await _dbContext.Elections
            .Include(e => e.CreatedByUser)
            .Include(e => e.Candidates).ThenInclude(c => c.User)
            .Include(e => e.Votes)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (election == null)
            return new NotFoundObjectResult(new { Error = "Election not found." });

        if (election.Status == ElectionStatus.Completed)
            return new BadRequestObjectResult(new { Error = "Completed elections cannot be edited." });

        if (election.IsFinalized)
            return new BadRequestObjectResult(new { Error = "Finalized elections cannot be edited." });

        bool votingStarted = election.Votes.Count > 0;

        if (votingStarted)
        {
            // Once voting has started only the end date may change
            if (request.EndDate.ToUniversalTime() <= election.StartDate)
                return new BadRequestObjectResult(new { Error = "End date must be after the election's start date." });

            election.EndDate = request.EndDate.ToUniversalTime();
        }
        else
        {
            if (request.StartDate >= request.EndDate)
                return new BadRequestObjectResult(new { Error = "End date must be after start date." });

            if (request.CandidateIds == null || request.CandidateIds.Count < 4)
                return new BadRequestObjectResult(new { Error = "At least 4 candidates are required." });

            // Verify every candidate user exists
            var candidateUsers = await _dbContext.Users
                .Where(u => request.CandidateIds.Contains(u.Id))
                .ToListAsync();

            var missing = request.CandidateIds.Except(candidateUsers.Select(u => u.Id)).ToList();
            if (missing.Count > 0)
                return new BadRequestObjectResult(new { Error = $"Users not found: {string.Join(", ", missing)}" });

            // Update dates and candidates
            election.StartDate = request.StartDate.ToUniversalTime();
            election.EndDate = request.EndDate.ToUniversalTime();

            _dbContext.ElectionCandidates.RemoveRange(election.Candidates);
            election.Candidates = candidateUsers.Select(u => new ElectionCandidate
            {
                Id = Guid.NewGuid(),
                ElectionId = election.Id,
                UserId = u.Id,
                User = u
            }).ToList();
        }

        await SyncStatusAsync(election);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Election {ElectionId} updated by user {UserId}", election.Id, userId);

        return new OkObjectResult(MapToDto(election, userId));
    }

    // -------------------------------------------------------------------------
    // DELETE  (Admin only — enforced in controller)
    // -------------------------------------------------------------------------

    public async Task<IActionResult> DeleteElectionAsync(Guid id, string userId)
    {
        var election = await _dbContext.Elections
            .Include(e => e.Votes)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (election == null)
            return new NotFoundObjectResult(new { Error = "Election not found." });

        if (election.IsFinalized)
            return new BadRequestObjectResult(new { Error = "Finalized elections cannot be deleted." });

        if (election.Votes.Count > 0)
            return new BadRequestObjectResult(new { Error = "Elections with recorded votes cannot be deleted." });

        _dbContext.Elections.Remove(election);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Election {ElectionId} deleted by user {UserId}", id, userId);

        return new OkObjectResult(new { Message = "Election deleted successfully." });
    }

    // -------------------------------------------------------------------------
    // CAST VOTE  (any authenticated member)
    // -------------------------------------------------------------------------

    public async Task<IActionResult> CastVoteAsync(Guid id, CastVoteDto request, string userId)
    {
        var election = await _dbContext.Elections
            .Include(e => e.Candidates)
            .Include(e => e.Votes)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (election == null)
            return new NotFoundObjectResult(new { Error = "Election not found." });

        await SyncStatusAsync(election);

        if (election.Status != ElectionStatus.Active)
            return new BadRequestObjectResult(new { Error = "Voting is only allowed during an active election." });

        if (election.Votes.Any(v => v.VoterUserId == userId))
            return new BadRequestObjectResult(new { Error = "You have already voted in this election." });

        if (request.CandidateUserIds == null || request.CandidateUserIds.Count != 1)
            return new BadRequestObjectResult(new { Error = "You must vote for exactly 1 candidate." });

        if (request.CandidateUserIds.Distinct().Count() != 1)
            return new BadRequestObjectResult(new { Error = "Duplicate candidates are not allowed." });

        if (request.CandidateUserIds.Contains(userId))
            return new BadRequestObjectResult(new { Error = "You cannot vote for yourself." });

        var validCandidateIds = election.Candidates.Select(c => c.UserId).ToHashSet();
        var invalid = request.CandidateUserIds.Where(cid => !validCandidateIds.Contains(cid)).ToList();
        if (invalid.Count > 0)
            return new BadRequestObjectResult(new { Error = "One or more selected candidates are not in this election." });

        var now = DateTime.UtcNow;
        var votes = request.CandidateUserIds.Select(candidateId => new ElectionVote
        {
            Id = Guid.NewGuid(),
            ElectionId = election.Id,
            VoterUserId = userId,
            CandidateUserId = candidateId,
            VotedAt = now
        }).ToList();

        _dbContext.ElectionVotes.AddRange(votes);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("User {UserId} voted in election {ElectionId} for {Count} candidates", userId, id, votes.Count);

        return new OkObjectResult(new { Message = "Votes recorded successfully." });
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /// <summary>
    /// Updates the stored Status based on the current UTC time.
    /// Automatically triggers role promotions the first time an election
    /// transitions to Completed (end date has passed).
    /// </summary>
    private async Task SyncStatusAsync(Election election)
    {
        var now = DateTime.UtcNow;
        election.Status = now < election.StartDate
            ? ElectionStatus.Upcoming
            : now <= election.EndDate
                ? ElectionStatus.Active
                : ElectionStatus.Completed;

        if (election.Status == ElectionStatus.Completed
            && !election.IsFinalized
            && election.Votes.Count > 0)
        {
            await AutoFinalizeAsync(election);
        }
    }

    /// <summary>
    /// Ranks candidates, promotes top-3 to Admin.
    /// Called automatically by SyncStatusAsync — never manually.
    /// </summary>
    private async Task AutoFinalizeAsync(Election election)
    {
        var ranked = election.Candidates
            .Select(c => new
            {
                c.UserId,
                VoteCount = election.Votes.Count(v => v.CandidateUserId == c.UserId)
            })
            .OrderByDescending(x => x.VoteCount)
            .ToList();

        for (var i = 0; i < Math.Min(3, ranked.Count); i++)
        {
            var user = await _userManager.FindByIdAsync(ranked[i].UserId);
            if (user == null) continue;

            if (await _userManager.IsInRoleAsync(user, "Admin"))
            {
                _logger.LogInformation(
                    "User {UserId} already has Admin role — skipping promotion (election {ElectionId}, rank: #{Rank}, votes: {Votes})",
                    user.Id, election.Id, i + 1, ranked[i].VoteCount);
                continue;
            }

            if (await _userManager.IsInRoleAsync(user, "Full Member"))
                await _userManager.RemoveFromRoleAsync(user, "Full Member");

            await _userManager.AddToRoleAsync(user, "Admin");

            _logger.LogInformation(
                "User {UserId} auto-promoted to Admin after election {ElectionId} ended (rank: #{Rank}, votes: {Votes})",
                user.Id, election.Id, i + 1, ranked[i].VoteCount);
        }

        election.IsFinalized = true;
        election.FinalizedAt = DateTime.UtcNow;

        _logger.LogInformation("Election {ElectionId} auto-finalized (end date reached)", election.Id);
    }

    private static ElectionListDto MapToListDto(Election e) => new()
    {
        Id = e.Id,
        Title = e.Title,
        StartDate = e.StartDate,
        EndDate = e.EndDate,
        Status = e.Status.ToString().ToLower(),
        TotalVotes = e.Votes.Count,
        CandidateCount = e.Candidates.Count,
        IsFinalized = e.IsFinalized
    };

    private static ElectionDto MapToDto(Election e, string requestingUserId)
    {
        var voteCounts = e.Votes
            .GroupBy(v => v.CandidateUserId)
            .ToDictionary(g => g.Key, g => g.Count());

        return new ElectionDto
        {
            Id = e.Id,
            Title = e.Title,
            Description = e.Description,
            StartDate = e.StartDate,
            EndDate = e.EndDate,
            Status = e.Status.ToString().ToLower(),
            TotalVotes = e.Votes.Count,
            HasVoted = e.Votes.Any(v => v.VoterUserId == requestingUserId),
            IsFinalized = e.IsFinalized,
            FinalizedAt = e.FinalizedAt,
            CreatedAt = e.CreatedAt,
            CreatedByUserId = e.CreatedByUserId,
            CreatedByName = e.CreatedByUser != null
                ? $"{e.CreatedByUser.FirstName} {e.CreatedByUser.LastName}".Trim()
                : string.Empty,
            Candidates = e.Candidates
                .OrderByDescending(c => voteCounts.GetValueOrDefault(c.UserId, 0))
                .Select(c => new ElectionCandidateDto
                {
                    UserId = c.UserId,
                    FullName = c.User != null
                        ? $"{c.User.FirstName} {c.User.LastName}".Trim()
                        : string.Empty,
                    Biography = c.User?.Biography,
                    Votes = voteCounts.GetValueOrDefault(c.UserId, 0)
                }).ToList()
        };
    }
}
