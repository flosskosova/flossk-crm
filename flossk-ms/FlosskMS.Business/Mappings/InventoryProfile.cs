using AutoMapper;
using FlosskMS.Business.DTOs;
using FlosskMS.Data.Entities;

namespace FlosskMS.Business.Mappings;

public class InventoryProfile : Profile
{
    public InventoryProfile()
    {
        CreateMap<InventoryItem, InventoryItemDto>()
            .ForMember(dest => dest.Category, opt => opt.MapFrom(src => src.Category.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.Condition, opt => opt.MapFrom(src => src.Condition.ToString()))
            .ForMember(dest => dest.QuantityInUse, opt => opt.MapFrom(src => src.CheckedOutQuantity))
            .ForMember(dest => dest.QuantityAvailable, opt => opt.MapFrom(src => src.Quantity - src.CheckedOutQuantity))
            .ForMember(dest => dest.CurrentUserId, opt => opt.MapFrom(src => 
                src.Checkouts.OrderBy(c => c.CheckedOutAt).FirstOrDefault() != null 
                    ? src.Checkouts.OrderBy(c => c.CheckedOutAt).FirstOrDefault()!.UserId 
                    : null))
            .ForMember(dest => dest.CurrentUserEmail, opt => opt.MapFrom(src => 
                src.Checkouts.OrderBy(c => c.CheckedOutAt).FirstOrDefault() != null 
                    ? src.Checkouts.OrderBy(c => c.CheckedOutAt).FirstOrDefault()!.User.Email 
                    : null))
            .ForMember(dest => dest.CurrentUserFirstName, opt => opt.MapFrom(src => 
                src.Checkouts.OrderBy(c => c.CheckedOutAt).FirstOrDefault() != null 
                    ? src.Checkouts.OrderBy(c => c.CheckedOutAt).FirstOrDefault()!.User.FirstName 
                    : null))
            .ForMember(dest => dest.CurrentUserLastName, opt => opt.MapFrom(src => 
                src.Checkouts.OrderBy(c => c.CheckedOutAt).FirstOrDefault() != null 
                    ? src.Checkouts.OrderBy(c => c.CheckedOutAt).FirstOrDefault()!.User.LastName 
                    : null))
            .ForMember(dest => dest.CurrentUserFullName, opt => opt.MapFrom(src => 
                src.Checkouts.OrderBy(c => c.CheckedOutAt).FirstOrDefault() != null 
                    ? $"{src.Checkouts.OrderBy(c => c.CheckedOutAt).FirstOrDefault()!.User.FirstName} {src.Checkouts.OrderBy(c => c.CheckedOutAt).FirstOrDefault()!.User.LastName}".Trim() 
                    : null))
            .ForMember(dest => dest.CurrentUserProfilePictureUrl, opt => opt.MapFrom(src => 
                src.Checkouts.OrderBy(c => c.CheckedOutAt).FirstOrDefault() != null && src.Checkouts.OrderBy(c => c.CheckedOutAt).FirstOrDefault()!.User.UploadedFiles != null
                    ? src.Checkouts.OrderBy(c => c.CheckedOutAt).FirstOrDefault()!.User.UploadedFiles
                        .Where(f => f.FileType == FileType.ProfilePicture)
                        .Select(f => "/uploads/" + f.FileName)
                        .FirstOrDefault()
                    : null))
            .ForMember(dest => dest.CheckedOutAt, opt => opt.MapFrom(src => 
                src.Checkouts.OrderBy(c => c.CheckedOutAt).FirstOrDefault() != null 
                    ? src.Checkouts.OrderBy(c => c.CheckedOutAt).FirstOrDefault()!.CheckedOutAt 
                    : (DateTime?)null))
            .ForMember(dest => dest.CreatedByUserEmail, opt => opt.MapFrom(src => src.CreatedByUser.Email))
            .ForMember(dest => dest.CreatedByUserFirstName, opt => opt.MapFrom(src => src.CreatedByUser.FirstName))
            .ForMember(dest => dest.CreatedByUserLastName, opt => opt.MapFrom(src => src.CreatedByUser.LastName))
            .ForMember(dest => dest.CreatedByUserFullName, opt => opt.MapFrom(src =>
                src.CreatedByUser != null
                    ? $"{src.CreatedByUser.FirstName} {src.CreatedByUser.LastName}".Trim()
                    : null))
            .ForMember(dest => dest.CreatedByUserProfilePictureUrl, opt => opt.MapFrom(src =>
                src.CreatedByUser != null && src.CreatedByUser.UploadedFiles != null
                    ? src.CreatedByUser.UploadedFiles
                        .Where(f => f.FileType == FileType.ProfilePicture)
                        .Select(f => "/uploads/" + f.FileName)
                        .FirstOrDefault()
                    : null))
            .ForMember(dest => dest.ConditionReportedByUserFullName, opt => opt.MapFrom(src =>
                src.ConditionReportedByUser != null
                    ? $"{src.ConditionReportedByUser.FirstName} {src.ConditionReportedByUser.LastName}".Trim()
                    : null))
            .ForMember(dest => dest.ConditionReportedByUserProfilePictureUrl, opt => opt.MapFrom(src =>
                src.ConditionReportedByUser != null && src.ConditionReportedByUser.UploadedFiles != null
                    ? src.ConditionReportedByUser.UploadedFiles
                        .Where(f => f.FileType == FileType.ProfilePicture)
                        .Select(f => "/uploads/" + f.FileName)
                        .FirstOrDefault()
                    : null))
            .ForMember(dest => dest.Images, opt => opt.MapFrom(src => src.Images));

        CreateMap<InventoryItem, InventoryItemListDto>()
            .ForMember(dest => dest.Category, opt => opt.MapFrom(src => src.Category.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.Condition, opt => opt.MapFrom(src => src.Condition.ToString()))
            .ForMember(dest => dest.QuantityInUse, opt => opt.MapFrom(src => src.CheckedOutQuantity))
            .ForMember(dest => dest.QuantityAvailable, opt => opt.MapFrom(src => src.Quantity - src.CheckedOutQuantity))
            .ForMember(dest => dest.CurrentUserId, opt => opt.MapFrom(src => 
                src.Checkouts.OrderBy(c => c.CheckedOutAt).FirstOrDefault() != null 
                    ? src.Checkouts.OrderBy(c => c.CheckedOutAt).FirstOrDefault()!.UserId 
                    : null))
            .ForMember(dest => dest.CurrentUserEmail, opt => opt.MapFrom(src => 
                src.Checkouts.OrderBy(c => c.CheckedOutAt).FirstOrDefault() != null 
                    ? src.Checkouts.OrderBy(c => c.CheckedOutAt).FirstOrDefault()!.User.Email 
                    : null))
            .ForMember(dest => dest.CurrentUserFirstName, opt => opt.MapFrom(src => 
                src.Checkouts.OrderBy(c => c.CheckedOutAt).FirstOrDefault() != null 
                    ? src.Checkouts.OrderBy(c => c.CheckedOutAt).FirstOrDefault()!.User.FirstName 
                    : null))
            .ForMember(dest => dest.CurrentUserLastName, opt => opt.MapFrom(src => 
                src.Checkouts.OrderBy(c => c.CheckedOutAt).FirstOrDefault() != null 
                    ? src.Checkouts.OrderBy(c => c.CheckedOutAt).FirstOrDefault()!.User.LastName 
                    : null))
            .ForMember(dest => dest.CurrentUserFullName, opt => opt.MapFrom(src => 
                src.Checkouts.OrderBy(c => c.CheckedOutAt).FirstOrDefault() != null 
                    ? $"{src.Checkouts.OrderBy(c => c.CheckedOutAt).FirstOrDefault()!.User.FirstName} {src.Checkouts.OrderBy(c => c.CheckedOutAt).FirstOrDefault()!.User.LastName}".Trim() 
                    : null))
            .ForMember(dest => dest.CurrentUserProfilePictureUrl, opt => opt.MapFrom(src => 
                src.Checkouts.OrderBy(c => c.CheckedOutAt).FirstOrDefault() != null && src.Checkouts.OrderBy(c => c.CheckedOutAt).FirstOrDefault()!.User.UploadedFiles != null
                    ? src.Checkouts.OrderBy(c => c.CheckedOutAt).FirstOrDefault()!.User.UploadedFiles
                        .Where(f => f.FileType == FileType.ProfilePicture)
                        .Select(f => "/uploads/" + f.FileName)
                        .FirstOrDefault()
                    : null))
            .ForMember(dest => dest.CreatedByUserFullName, opt => opt.MapFrom(src =>
                src.CreatedByUser != null
                    ? $"{src.CreatedByUser.FirstName} {src.CreatedByUser.LastName}".Trim()
                    : null))
            .ForMember(dest => dest.CreatedByUserProfilePictureUrl, opt => opt.MapFrom(src =>
                src.CreatedByUser != null && src.CreatedByUser.UploadedFiles != null
                    ? src.CreatedByUser.UploadedFiles
                        .Where(f => f.FileType == FileType.ProfilePicture)
                        .Select(f => "/uploads/" + f.FileName)
                        .FirstOrDefault()
                    : null))
            .ForMember(dest => dest.ConditionReportedByUserFullName, opt => opt.MapFrom(src =>
                src.ConditionReportedByUser != null
                    ? $"{src.ConditionReportedByUser.FirstName} {src.ConditionReportedByUser.LastName}".Trim()
                    : null))
            .ForMember(dest => dest.ConditionReportedByUserProfilePictureUrl, opt => opt.MapFrom(src =>
                src.ConditionReportedByUser != null && src.ConditionReportedByUser.UploadedFiles != null
                    ? src.ConditionReportedByUser.UploadedFiles
                        .Where(f => f.FileType == FileType.ProfilePicture)
                        .Select(f => "/uploads/" + f.FileName)
                        .FirstOrDefault()
                    : null))
            .ForMember(dest => dest.Images, opt => opt.MapFrom(src => src.Images));

        CreateMap<InventoryItemImage, InventoryItemImageDto>()
            .ForMember(dest => dest.FileId, opt => opt.MapFrom(src => src.UploadedFileId))
            .ForMember(dest => dest.FileName, opt => opt.MapFrom(src => src.UploadedFile.FileName))
            .ForMember(dest => dest.FilePath, opt => opt.MapFrom(src => "/uploads/" + src.UploadedFile.FileName));

        CreateMap<InventoryItemCheckout, InventoryItemCheckoutDto>()
            .ForMember(dest => dest.UserEmail, opt => opt.MapFrom(src => src.User.Email))
            .ForMember(dest => dest.UserFirstName, opt => opt.MapFrom(src => src.User.FirstName))
            .ForMember(dest => dest.UserLastName, opt => opt.MapFrom(src => src.User.LastName))
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
                    : null));

        CreateMap<CreateInventoryItemDto, InventoryItem>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.Status, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedByUserId, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedByUser, opt => opt.Ignore())
            .ForMember(dest => dest.Images, opt => opt.Ignore())
            .ForMember(dest => dest.Checkouts, opt => opt.Ignore())
            .ForMember(dest => dest.CheckedOutQuantity, opt => opt.Ignore())
            .ForMember(dest => dest.Category, opt => opt.MapFrom(src => Enum.Parse<InventoryCategory>(src.Category, true)));
    }
}
