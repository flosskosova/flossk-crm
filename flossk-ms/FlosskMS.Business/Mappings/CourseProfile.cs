using AutoMapper;
using FlosskMS.Business.DTOs;
using FlosskMS.Data.Entities;

namespace FlosskMS.Business.Mappings;

public class CourseProfile : Profile
{
    public CourseProfile()
    {
        // Course → CourseDto
        CreateMap<Course, CourseDto>()
            .ForMember(dest => dest.Level, opt => opt.MapFrom(src => src.Level.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.ProjectTitle, opt => opt.MapFrom(src => src.Project.Title))
            .ForMember(dest => dest.CreatedByUserId, opt => opt.MapFrom(src => src.CreatedByUserId))
            .ForMember(dest => dest.CreatedByFirstName, opt => opt.MapFrom(src => src.CreatedByUser.FirstName))
            .ForMember(dest => dest.CreatedByLastName, opt => opt.MapFrom(src => src.CreatedByUser.LastName))
            .ForMember(dest => dest.Instructors, opt => opt.MapFrom(src => src.Instructors))
            .ForMember(dest => dest.Modules, opt => opt.MapFrom(src => src.Modules.OrderBy(m => m.Order)))
            .ForMember(dest => dest.Sessions, opt => opt.MapFrom(src => src.Sessions));

        // Course → CourseListDto
        CreateMap<Course, CourseListDto>()
            .ForMember(dest => dest.Level, opt => opt.MapFrom(src => src.Level.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.ProjectTitle, opt => opt.MapFrom(src => src.Project.Title))
            .ForMember(dest => dest.ModuleCount, opt => opt.MapFrom(src => src.Modules.Count))
            .ForMember(dest => dest.SessionCount, opt => opt.MapFrom(src => src.Sessions.Count))
            .ForMember(dest => dest.Instructors, opt => opt.MapFrom(src => src.Instructors));

        // CourseInstructor → CourseInstructorDto
        CreateMap<CourseInstructor, CourseInstructorDto>()
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.UserId))
            .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => src.User.FirstName))
            .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => src.User.LastName))
            .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role));

        // CourseModule → CourseModuleDto
        CreateMap<CourseModule, CourseModuleDto>()
            .ForMember(dest => dest.Resources, opt => opt.MapFrom(src => src.Resources))
            .ForMember(dest => dest.Reviews, opt => opt.MapFrom(src => src.Reviews));

        // CourseResource → CourseResourceDto
        CreateMap<CourseResource, CourseResourceDto>()
            .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Type.ToString()))
            .ForMember(dest => dest.Files, opt => opt.MapFrom(src => src.Files));

        // CourseResourceFile → CourseResourceFileDto
        CreateMap<CourseResourceFile, CourseResourceFileDto>()
            .ForMember(dest => dest.FileId, opt => opt.MapFrom(src => src.FileId))
            .ForMember(dest => dest.FileName, opt => opt.MapFrom(src => src.File.FileName))
            .ForMember(dest => dest.OriginalFileName, opt => opt.MapFrom(src => src.File.OriginalFileName))
            .ForMember(dest => dest.ContentType, opt => opt.MapFrom(src => src.File.ContentType))
            .ForMember(dest => dest.FileSize, opt => opt.MapFrom(src => src.File.FileSize))
            .ForMember(dest => dest.FilePath, opt => opt.MapFrom(src => src.File.FilePath));

        // CourseReview → CourseReviewDto
        CreateMap<CourseReview, CourseReviewDto>();

        // CourseSession → CourseSessionDto
        CreateMap<CourseSession, CourseSessionDto>()
            .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Type.ToString()));
    }
}
