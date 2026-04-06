using System.Text;
using DotNetEnv;
using FlosskMS.Business.Configuration;
using FlosskMS.Business.DomainEvents;
using FlosskMS.Business.DomainEvents.Announcements;
using FlosskMS.Business.DomainEvents.Announcements.Notifications;
using FlosskMS.Business.DomainEvents.Memberships;
using FlosskMS.Business.DomainEvents.Projects;
using FlosskMS.Business.Services;
using FlosskMS.Data;
using FlosskMS.Data.Entities;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using FlosskMS.API.Middleware;

using FlosskMS.API.Hubs;
using FlosskMS.API.Services;

var envFile = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", ".env"));
if (File.Exists(envFile))
    Env.Load(envFile);

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "FlosskMS API", Version = "v1" });
    
    options.MapType<IFormFile>(() => new OpenApiSchema
    {
        Type = "string",
        Format = "binary"
    });
    
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Scheme = "Bearer",
                BearerFormat = "JWT",
                Name = "Bearer",
                In = ParameterLocation.Header,
                Reference = new OpenApiReference
                {
                    Id = "Bearer",
                    Type = ReferenceType.SecurityScheme
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddControllers();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>() 
    ?? throw new InvalidOperationException("JwtSettings not configured");
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret))
    };
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var path = context.HttpContext.Request.Path;

            // Allow token via query string for SignalR hub connections
            if (path.StartsWithSegments("/hubs/notifications"))
            {
                var accessToken = context.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(accessToken))
                    context.Token = accessToken;
            }

            // Allow token via query string for file view/download endpoints
            if (path.StartsWithSegments("/api/Files") &&
                (path.Value?.Contains("/view") == true || path.Value?.Contains("/download") == true))
            {
                var token = context.Request.Query["token"];
                if (!string.IsNullOrEmpty(token))
                    context.Token = token;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();
builder.Services.AddAutoMapper(typeof(FlosskMS.Business.Mappings.AnnouncementProfile).Assembly);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.WithOrigins(
                "http://localhost:4200",
                "http://localhost:36975",
                "http://localhost:4000",
                "http://frontend:80",
                "http://localhost"
              )
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

builder.Services.AddSignalR();
builder.Services.AddSingleton<IConnectionTracker, ConnectionTracker>();
builder.Services.AddSingleton<IPresenceTracker, PresenceTracker>();
builder.Services.AddScoped<IRealtimeNotificationService, RealtimeNotificationService>();
builder.Services.AddScoped<IPushNotificationService, PushNotificationService>();

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IClamAvService, ClamAvService>();
builder.Services.AddScoped<IFileService, FileService>();
builder.Services.AddScoped<IAnnouncementService, AnnouncementService>();
builder.Services.AddScoped<IMembershipRequestService, MembershipRequestService>();
builder.Services.AddScoped<ICollaborationPadService, CollaborationPadService>();
builder.Services.AddScoped<IRfidCardService, RfidCardService>();
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<ICalendarEventService, CalendarEventService>();
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<ILogService, LogService>();
builder.Services.AddScoped<IElectionService, ElectionService>();
builder.Services.AddScoped<IElectionCategoryService, ElectionCategoryService>();
builder.Services.AddScoped<IContributionService, ContributionService>();
builder.Services.AddScoped<ICertificateService, CertificateService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IDomainEventDispatcher, DomainEventDispatcher>();
builder.Services.AddScoped<IDomainEventHandler<TeamMemberAddedToProjectEvent>, TeamMemberAddedNotificationHandler>();
builder.Services.AddScoped<IDomainEventHandler<TeamMemberRemovedFromProjectEvent>, TeamMemberRemovedFromProjectNotificationHandler>();
builder.Services.AddScoped<IDomainEventHandler<TeamMemberAssignedToObjectiveEvent>, TeamMemberAssignedToObjectiveNotificationHandler>();
builder.Services.AddScoped<IDomainEventHandler<TeamMemberRemovedFromObjectiveEvent>, TeamMemberRemovedFromObjectiveNotificationHandler>();
builder.Services.AddScoped<IDomainEventHandler<TeamMemberPromotedToModeratorEvent>, TeamMemberPromotedToModeratorNotificationHandler>();
builder.Services.AddScoped<IDomainEventHandler<TeamMemberDemotedFromModeratorEvent>, TeamMemberDemotedFromModeratorNotificationHandler>();
builder.Services.AddScoped<IDomainEventHandler<AnnouncementCreatedEvent>, AnnouncementCreatedNotificationHandler>();
builder.Services.AddScoped<IDomainEventHandler<MembershipApplicationSubmittedEvent>, MembershipApplicationSubmittedNotificationHandler>();
builder.Services.AddScoped<IDomainEventHandler<MembershipRequestApprovedEvent>, MembershipRequestApprovedNotificationHandler>();
builder.Services.AddScoped<IDomainEventHandler<MembershipRequestRejectedEvent>, MembershipRequestRejectedNotificationHandler>();

builder.Services.Configure<FileUploadSettings>(builder.Configuration.GetSection("FileUploadSettings"));
builder.Services.Configure<ClamAvSettings>(builder.Configuration.GetSection("ClamAvSettings"));
builder.Services.Configure<VapidSettings>(builder.Configuration.GetSection("VapidSettings"));
builder.Services.AddScoped<IEmailService, EmailService>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var seederLogger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DbSeeder");

    await dbContext.Database.MigrateAsync();

    await DbSeeder.SeedAsync(roleManager, userManager, dbContext, seederLogger);
}

app.UseMiddleware<GlobalExceptionMiddleware>();

if (app.Environment.IsDevelopment() || app.Environment.EnvironmentName == "Docker")
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.ConfigObject.AdditionalItems["persistAuthorization"] = true;
    });
}

if (app.Environment.EnvironmentName != "Docker")
{
    app.UseHttpsRedirection();
}

var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "uploads");
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
}
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

app.UseCors("AllowAngularApp");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();
