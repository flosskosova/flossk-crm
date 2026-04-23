using FlosskMS.Data.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FlosskMS.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(
        RoleManager<IdentityRole> roleManager,
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext dbContext,
        ILogger? logger = null)
    {
        await SeedRolesAsync(roleManager, logger);
        await SeedAdminUserAsync(userManager, dbContext, logger);
    }

    private static async Task SeedRolesAsync(RoleManager<IdentityRole> roleManager, ILogger? logger)
    {
        string[] roles = ["Admin", "User", "Full Member", "Leader", "Trainee"];

        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
                logger?.LogInformation("Seeder: created role '{Role}'", role);
            }
        }
    }

    private static async Task SeedAdminUserAsync(
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext dbContext,
        ILogger? logger)
    {
        const string adminEmail = "daorsahyseni@gmail.com";
        const string adminPassword = "P@ssword123";

        var adminUser = await userManager.FindByEmailAsync(adminEmail);

        if (adminUser == null)
        {
            adminUser = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FirstName = "Daorsa",
                LastName = "Hyseni",
                CreatedAt = DateTime.UtcNow
            };

            var createResult = await userManager.CreateAsync(adminUser, adminPassword);
            if (!createResult.Succeeded)
            {
                var errors = string.Join(", ", createResult.Errors.Select(e => e.Description));
                logger?.LogError("Seeder: failed to create admin user — {Errors}", errors);
                return;
            }

            logger?.LogInformation("Seeder: admin user created ({Email})", adminEmail);
        }
        else
        {
            logger?.LogInformation("Seeder: admin user already exists ({Email})", adminEmail);
        }

        // Ensure Admin role
        if (!await userManager.IsInRoleAsync(adminUser, "Admin"))
        {
            await userManager.AddToRoleAsync(adminUser, "Admin");
            logger?.LogInformation("Seeder: assigned Admin role to {Email}", adminEmail);
        }

        // Ensure email is approved
        if (!await dbContext.ApprovedEmails.AnyAsync(e => e.Email.ToLower() == adminEmail.ToLower()))
        {
            dbContext.ApprovedEmails.Add(new ApprovedEmail { Email = adminEmail });
            await dbContext.SaveChangesAsync();
            logger?.LogInformation("Seeder: approved email entry added for {Email}", adminEmail);
        }
    }
}
