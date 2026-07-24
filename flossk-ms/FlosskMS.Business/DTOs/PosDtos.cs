namespace FlosskMS.Business.DTOs;

public class PosCategoryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int SortOrder { get; set; }
}

public class CreatePosCategoryDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int SortOrder { get; set; }
}

public class PosProductDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public bool IsAvailable { get; set; }
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
}

public class CreatePosProductDto
{
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public bool IsAvailable { get; set; } = true;
    public Guid CategoryId { get; set; }
}

public class PosCustomerDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public decimal TotalSpent { get; set; }
    public int VisitCount { get; set; }
    public DateTime? LastVisitAt { get; set; }
}

public class CreatePosCustomerDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Email { get; set; }
}

public class PosDonationLogDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string? CustomerName { get; set; }
    public string OperatorName { get; set; } = string.Empty;
    public decimal Donation { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Total { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class PosOperatorDto
{
    public string Id { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsPosOperator { get; set; }
    public List<string> Roles { get; set; } = [];
}

public class PosOrderItemDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public decimal Subtotal { get; set; }
}

public class CreatePosOrderDto
{
    public Guid? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Donation { get; set; }
    public decimal AmountGiven { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public string? Notes { get; set; }
    public List<CreatePosOrderItemDto> Items { get; set; } = [];
}

public class CreatePosOrderItemDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public decimal Subtotal { get; set; }
}

public class PosOrderDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public Guid? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public string? OperatorName { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Donation { get; set; }
    public decimal Total { get; set; }
    public decimal AmountGiven { get; set; }
    public decimal Change { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<PosOrderItemDto> Items { get; set; } = [];
}

public class PosPaymentLogDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string? CustomerName { get; set; }
    public string OperatorName { get; set; } = string.Empty;
    public decimal Subtotal { get; set; }
    public decimal Donation { get; set; }
    public decimal Total { get; set; }
    public decimal AmountGiven { get; set; }
    public decimal Change { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class PosAnalyticsDto
{
    public PosMonthlySummary CurrentMonth { get; set; } = new();
    public List<PosMonthlySummary> MonthlyHistory { get; set; } = [];
    public List<PosTopProductDto> TopProducts { get; set; } = [];
    public List<PosTopCustomerDto> TopCustomers { get; set; } = [];
    public List<PosDailySalesDto> DailySales { get; set; } = [];
    public decimal TotalRevenue { get; set; }
    public decimal TotalDonations { get; set; }
    public int TotalOrders { get; set; }
    public decimal AverageOrderValue { get; set; }
    public int DonationCount { get; set; }
    public List<PosPaymentMethodBreakdownDto> PaymentMethodBreakdown { get; set; } = [];
    public List<PosHourlySummaryDto> PeakHours { get; set; } = [];
}

public class PosMonthlySummary
{
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal TotalSales { get; set; }
    public decimal TotalDonations { get; set; }
    public decimal TotalRevenue { get; set; }
    public int OrderCount { get; set; }
    public int CustomerCount { get; set; }
    public decimal AverageOrderValue { get; set; }
}

public class PosPaymentMethodBreakdownDto
{
    public string Method { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public int Count { get; set; }
}

public class PosHourlySummaryDto
{
    public int Hour { get; set; }
    public int OrderCount { get; set; }
    public decimal Revenue { get; set; }
}

public class PosTopProductDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int TotalQuantity { get; set; }
    public decimal TotalRevenue { get; set; }
}

public class PosTopCustomerDto
{
    public Guid CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public decimal TotalSpent { get; set; }
    public int VisitCount { get; set; }
    public DateTime? LastVisitAt { get; set; }
}

public class PosDailySalesDto
{
    public DateTime Date { get; set; }
    public decimal TotalSales { get; set; }
    public decimal TotalDonations { get; set; }
    public int OrderCount { get; set; }
}

public class PosShiftDto
{
    public Guid Id { get; set; }
    public string OperatorName { get; set; } = string.Empty;
    public decimal StartingCash { get; set; }
    public decimal? EndingCash { get; set; }
    public decimal? ExpectedCash { get; set; }
    public decimal? TotalSales { get; set; }
    public decimal? TotalDonations { get; set; }
    public int? OrderCount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
}

public class StartPosShiftDto
{
    public decimal StartingCash { get; set; }
    public string? Notes { get; set; }
}

public class EndPosShiftDto
{
    public decimal EndingCash { get; set; }
    public string? Notes { get; set; }
}
