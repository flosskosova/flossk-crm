using AutoMapper;
using FlosskMS.Business.DTOs;
using FlosskMS.Data.Entities;

namespace FlosskMS.Business.Mappings;

public class CertificateProfile : Profile
{
    public CertificateProfile()
    {
        CreateMap<Certificate, CertificateDto>()
            .ForMember(dest => dest.CertificateType, opt => opt.MapFrom(src => src.Type.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.RecipientName, opt => opt.MapFrom(src => src.RecipientUser.FirstName + " " + src.RecipientUser.LastName))
            .ForMember(dest => dest.RecipientEmail, opt => opt.MapFrom(src => src.RecipientUser.Email ?? string.Empty))
            .ForMember(dest => dest.RecipientProfilePictureUrl, opt => opt.Ignore())
            .ForMember(dest => dest.IssuedByName, opt => opt.MapFrom(src => src.IssuedByUser.FirstName + " " + src.IssuedByUser.LastName));

        CreateMap<CertificateTemplate, CertificateTemplateDto>()
            .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedByUser.FirstName + " " + src.CreatedByUser.LastName))
            .ForMember(dest => dest.PreviewPath, opt => opt.MapFrom(src => src.FilePath));
    }
}
