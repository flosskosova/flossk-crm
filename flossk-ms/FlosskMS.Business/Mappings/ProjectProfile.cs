using AutoMapper;
using FlosskMS.Business.DTOs;
using FlosskMS.Data.Entities;

namespace FlosskMS.Business.Mappings;

public class ProjectProfile : Profile
{
    public ProjectProfile()
    {
        CreateMap<Project, ProjectDto>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.Types, opt => opt.MapFrom(src =>
                Enum.GetValues<ProjectType>()
                    .Where(t => t != ProjectType.None && src.Types.HasFlag(t))
                    .Select(t => t.ToString())
                    .ToList()))
            .ForMember(dest => dest.BannerUrl, opt => opt.MapFrom(src => src.BannerUrl))
            .ForMember(dest => dest.CreatedByUserId, opt => opt.MapFrom(src => src.CreatedByUserId))
            .ForMember(dest => dest.CreatedByFirstName, opt => opt.MapFrom(src => src.CreatedByUser.FirstName))
            .ForMember(dest => dest.CreatedByLastName, opt => opt.MapFrom(src => src.CreatedByUser.LastName))
            .ForMember(dest => dest.Moderators, opt => opt.MapFrom(src => src.Moderators))
            .ForMember(dest => dest.TeamMembers, opt => opt.MapFrom(src => src.TeamMembers))
            .ForMember(dest => dest.Objectives, opt => opt.MapFrom(src => src.Objectives))
            .ForMember(dest => dest.Resources, opt => opt.MapFrom(src => src.Resources));

        CreateMap<Project, ProjectListDto>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.Types, opt => opt.MapFrom(src =>
                Enum.GetValues<ProjectType>()
                    .Where(t => t != ProjectType.None && src.Types.HasFlag(t))
                    .Select(t => t.ToString())
                    .ToList()))
            .ForMember(dest => dest.BannerUrl, opt => opt.MapFrom(src => src.BannerUrl))
            .ForMember(dest => dest.CreatedByUserId, opt => opt.MapFrom(src => src.CreatedByUserId))
            .ForMember(dest => dest.CreatedByFirstName, opt => opt.MapFrom(src => src.CreatedByUser.FirstName))
            .ForMember(dest => dest.CreatedByLastName, opt => opt.MapFrom(src => src.CreatedByUser.LastName))
            .ForMember(dest => dest.Moderators, opt => opt.MapFrom(src => src.Moderators))
            .ForMember(dest => dest.TeamMemberCount, opt => opt.MapFrom(src => src.TeamMembers.Count))
            .ForMember(dest => dest.ObjectiveCount, opt => opt.MapFrom(src => src.Objectives.Count))
            .ForMember(dest => dest.TeamMembers, opt => opt.MapFrom(src => src.TeamMembers))
            .ForMember(dest => dest.Objectives, opt => opt.MapFrom(src => src.Objectives))
            .ForMember(dest => dest.Resources, opt => opt.MapFrom(src => src.Resources));

        CreateMap<CreateProjectDto, Project>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedByUserId, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedByUser, opt => opt.Ignore())
            .ForMember(dest => dest.Moderators, opt => opt.Ignore())
            .ForMember(dest => dest.TeamMembers, opt => opt.Ignore())
            .ForMember(dest => dest.Objectives, opt => opt.Ignore())
            .ForMember(dest => dest.Resources, opt => opt.Ignore())
            .ForMember(dest => dest.Types, opt => opt.Ignore())
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => Enum.Parse<ProjectStatus>(src.Status, true)));

        CreateMap<UpdateProjectDto, Project>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedByUserId, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedByUser, opt => opt.Ignore())
            .ForMember(dest => dest.Moderators, opt => opt.Ignore())
            .ForMember(dest => dest.TeamMembers, opt => opt.Ignore())
            .ForMember(dest => dest.Objectives, opt => opt.Ignore())
            .ForMember(dest => dest.Resources, opt => opt.Ignore())
            .ForMember(dest => dest.Types, opt => opt.Ignore())
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => Enum.Parse<ProjectStatus>(src.Status, true)));

        // ProjectModerator → ModeratorInfoDto
        CreateMap<ProjectModerator, ModeratorInfoDto>()
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.UserId))
            .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => src.User.FirstName))
            .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => src.User.LastName));

        // Objective mappings
        CreateMap<Objective, ObjectiveDto>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.CreatedByFirstName, opt => opt.MapFrom(src => src.CreatedByUser.FirstName))
            .ForMember(dest => dest.CreatedByLastName, opt => opt.MapFrom(src => src.CreatedByUser.LastName))
            .ForMember(dest => dest.TeamMembers, opt => opt.MapFrom(src => src.TeamMembers))
            .ForMember(dest => dest.Resources, opt => opt.MapFrom(src => src.Resources));

        CreateMap<CreateObjectiveDto, Objective>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedByUserId, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedByUser, opt => opt.Ignore())
            .ForMember(dest => dest.Project, opt => opt.Ignore())
            .ForMember(dest => dest.TeamMembers, opt => opt.Ignore())
            .ForMember(dest => dest.Resources, opt => opt.Ignore())
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => Enum.Parse<ObjectiveStatus>(src.Status, true)));

        CreateMap<UpdateObjectiveDto, Objective>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.ProjectId, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedByUserId, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedByUser, opt => opt.Ignore())
            .ForMember(dest => dest.Project, opt => opt.Ignore())
            .ForMember(dest => dest.TeamMembers, opt => opt.Ignore())
            .ForMember(dest => dest.Resources, opt => opt.Ignore())
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => Enum.Parse<ObjectiveStatus>(src.Status, true)));

        // Resource mappings
        CreateMap<Resource, ResourceDto>()
            .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Type.ToString().ToLowerInvariant()))
            .ForMember(dest => dest.CreatedByUserName, opt => opt.MapFrom(src => 
                src.CreatedByUser != null 
                    ? $"{src.CreatedByUser.FirstName} {src.CreatedByUser.LastName}".Trim() 
                    : null))
            .ForMember(dest => dest.Files, opt => opt.MapFrom(src => src.Files.Select(rf => new FileDto
            {
                Id = rf.File.Id,
                FileName = rf.File.FileName,
                ContentType = rf.File.ContentType,
                FileSize = rf.File.FileSize,
                UploadedAt = rf.File.UploadedAt,
                CreatedByUserId = rf.File.CreatedByUserId ?? string.Empty,
                IsSafe = rf.File.IsSafe
            })));

        CreateMap<CreateResourceDto, Resource>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.Project, opt => opt.Ignore())
            .ForMember(dest => dest.Objective, opt => opt.Ignore())
            .ForMember(dest => dest.Files, opt => opt.Ignore())
            .ForMember(dest => dest.Type, opt => opt.MapFrom(src => Enum.Parse<ResourceType>(src.Type, true)));

        CreateMap<UpdateResourceDto, Resource>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.ProjectId, opt => opt.Ignore())
            .ForMember(dest => dest.ObjectiveId, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.Project, opt => opt.Ignore())
            .ForMember(dest => dest.Objective, opt => opt.Ignore())
            .ForMember(dest => dest.Files, opt => opt.Ignore())
            .ForMember(dest => dest.Type, opt => opt.MapFrom(src => Enum.Parse<ResourceType>(src.Type, true)));

        CreateMap<ProjectTeamMember, TeamMemberDto>()
            .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => src.User.FirstName))
            .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => src.User.LastName))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.User.Email))
            .ForMember(dest => dest.ProfilePictureUrl, opt => opt.MapFrom(src => 
                src.User.UploadedFiles != null 
                    ? src.User.UploadedFiles
                        .Where(f => f.FileType == FileType.ProfilePicture)
                        .Select(f => "/uploads/" + f.FileName)
                        .FirstOrDefault()
                    : null))
            .ForMember(dest => dest.JoinedAt, opt => opt.MapFrom(src => src.JoinedAt));

        CreateMap<ObjectiveTeamMember, TeamMemberDto>()
            .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => src.User.FirstName))
            .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => src.User.LastName))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.User.Email))
            .ForMember(dest => dest.ProfilePictureUrl, opt => opt.MapFrom(src => 
                src.User.UploadedFiles != null 
                    ? src.User.UploadedFiles
                        .Where(f => f.FileType == FileType.ProfilePicture)
                        .Select(f => "/uploads/" + f.FileName)
                        .FirstOrDefault()
                    : null))
            .ForMember(dest => dest.Role, opt => opt.Ignore())
            .ForMember(dest => dest.JoinedAt, opt => opt.MapFrom(src => src.AssignedAt));
    }
}
