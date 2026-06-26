using AutoMapper;
using FlosskMS.Business.DTOs;
using FlosskMS.Data.Entities;

namespace FlosskMS.Business.Mappings;

public class LogProfile : Profile
{
    public LogProfile()
    {
        CreateMap<Log, LogDto>()
            .ForMember(dest => dest.UserFullName, opt => opt.MapFrom(src =>
                src.User != null
                    ? $"{src.User.FirstName} {src.User.LastName}".Trim()
                    : string.Empty))
            .ForMember(dest => dest.UserProfilePictureUrl, opt => opt.MapFrom(src =>
                src.User != null && src.User.UploadedFiles != null
                    ? src.User.UploadedFiles
                        .Where(f => f.FileType == FileType.ProfilePicture)
                        .Select(f => "/uploads/" + f.FileName)
                        .FirstOrDefault()
                    : null))
            .ForMember(dest => dest.IpAddress, opt => opt.MapFrom(src => src.IpAddress))
            .ForMember(dest => dest.UserAgent, opt => opt.MapFrom(src => src.UserAgent));
    }
}
