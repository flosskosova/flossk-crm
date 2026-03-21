namespace FlosskMS.Business.DTOs;

public class TemplateLayoutDto
{
    public Guid TemplateId { get; set; }
    public List<TemplateFieldDto> Fields { get; set; } = [];
}
