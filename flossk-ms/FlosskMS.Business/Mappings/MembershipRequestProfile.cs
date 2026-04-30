using AutoMapper;
using FlosskMS.Business.DTOs;
using FlosskMS.Data.Entities;

namespace FlosskMS.Business.Mappings;

public class MembershipRequestProfile : Profile
{
    public MembershipRequestProfile()
    {
        CreateMap<MembershipRequest, MembershipRequestDto>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.ReviewedByFirstName, opt => opt.MapFrom(src => src.ReviewedByUser != null ? src.ReviewedByUser.FirstName : null))
            .ForMember(dest => dest.ReviewedByLastName, opt => opt.MapFrom(src => src.ReviewedByUser != null ? src.ReviewedByUser.LastName : null))
            .ForMember(dest => dest.IsUnder14, opt => opt.MapFrom(src => src.IsUnder14()));

        CreateMap<CreateMembershipRequestDto, MembershipRequest>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.ApplicantSignatureFileId, opt => opt.Ignore())
            .ForMember(dest => dest.ApplicantSignatureFile, opt => opt.Ignore())
            .ForMember(dest => dest.GuardianSignatureFileId, opt => opt.Ignore())
            .ForMember(dest => dest.GuardianSignatureFile, opt => opt.Ignore())
            .ForMember(dest => dest.Status, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.ReviewedAt, opt => opt.Ignore())
            .ForMember(dest => dest.ReviewedByUserId, opt => opt.Ignore())
            .ForMember(dest => dest.ReviewedByUser, opt => opt.Ignore())
            .ForMember(dest => dest.BoardMemberSignatureFileId, opt => opt.Ignore())
            .ForMember(dest => dest.BoardMemberSignatureFile, opt => opt.Ignore())
            .ForMember(dest => dest.RejectionReason, opt => opt.Ignore());
    }
}
