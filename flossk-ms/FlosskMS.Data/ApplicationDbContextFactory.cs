using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace FlosskMS.Data;

// Used by EF tooling at design time (migrations/update) when startup configuration is unavailable.
public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        var connectionString = ResolveConnectionString();

        optionsBuilder.UseNpgsql(connectionString, npgsql =>
            npgsql.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.GetName().Name));

        return new ApplicationDbContext(optionsBuilder.Options);
    }

    private static string ResolveConnectionString()
    {
        var fromEnvironment = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");
        if (!string.IsNullOrWhiteSpace(fromEnvironment))
            return fromEnvironment;

        var envFilePath = FindEnvFile();
        if (envFilePath is null)
        {
            throw new InvalidOperationException(
                "Could not find .env file and ConnectionStrings__DefaultConnection is not set.");
        }

        foreach (var rawLine in File.ReadLines(envFilePath))
        {
            var line = rawLine.Trim();
            if (line.Length == 0 || line.StartsWith('#'))
                continue;

            const string key = "ConnectionStrings__DefaultConnection=";
            if (line.StartsWith(key, StringComparison.Ordinal))
                return line[key.Length..].Trim();
        }

        throw new InvalidOperationException(
            "ConnectionStrings__DefaultConnection was not found in .env.");
    }

    private static string? FindEnvFile()
    {
        var dir = new DirectoryInfo(Directory.GetCurrentDirectory());

        while (dir is not null)
        {
            var candidate = Path.Combine(dir.FullName, ".env");
            if (File.Exists(candidate))
                return candidate;

            dir = dir.Parent;
        }

        return null;
    }
}