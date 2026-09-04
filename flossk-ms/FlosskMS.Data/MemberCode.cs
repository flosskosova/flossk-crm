using System.Security.Cryptography;
using FlosskMS.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace FlosskMS.Data;

/// <summary>
/// Generates member badge codes like <c>FOSS-K7M2QX9P</c> — an unambiguous alphabet
/// (no 0/O/1/I/L) so they are easy to read off a printed badge and type back.
/// </summary>
public static class MemberCode
{
    public const string Prefix = "FOSS-";
    private const string Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 31 chars
    private const int Length = 8;

    public static string New()
    {
        Span<char> buffer = stackalloc char[Length];
        for (var i = 0; i < Length; i++)
            buffer[i] = Alphabet[RandomNumberGenerator.GetInt32(Alphabet.Length)];
        return Prefix + new string(buffer);
    }
}

/// <summary>
/// Assigns a unique <see cref="ApplicationUser.MemberCode"/> to every user being inserted
/// that does not already have one — covers every creation path (register, admin seed,
/// membership approval, tests) without touching call sites.
/// </summary>
public sealed class MemberCodeInterceptor : SaveChangesInterceptor
{
    public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
    {
        if (eventData.Context is not null)
            await AssignAsync(eventData.Context, cancellationToken);

        return await base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        if (eventData.Context is not null)
            AssignAsync(eventData.Context, CancellationToken.None).GetAwaiter().GetResult();

        return base.SavingChanges(eventData, result);
    }

    private static async Task AssignAsync(DbContext context, CancellationToken ct)
    {
        var newUsers = context.ChangeTracker.Entries<ApplicationUser>()
            .Where(e => e.State == EntityState.Added && string.IsNullOrEmpty(e.Entity.MemberCode))
            .ToList();

        if (newUsers.Count == 0)
            return;

        var taken = new HashSet<string>(
            await context.Set<ApplicationUser>()
                .Where(u => u.MemberCode != "")
                .Select(u => u.MemberCode)
                .ToListAsync(ct));

        // Also avoid codes assigned to other pending inserts in this same save.
        foreach (var entry in context.ChangeTracker.Entries<ApplicationUser>()
                     .Where(e => e.State == EntityState.Added && !string.IsNullOrEmpty(e.Entity.MemberCode)))
        {
            taken.Add(entry.Entity.MemberCode);
        }

        foreach (var entry in newUsers)
        {
            string code;
            do { code = MemberCode.New(); } while (!taken.Add(code));
            entry.Entity.MemberCode = code;
        }
    }
}
