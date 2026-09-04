using FlosskMS.Business.DTOs;
using FlosskMS.Data;
using FlosskMS.Data.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FlosskMS.Business.Services;

public class PosService(
    ApplicationDbContext dbContext,
    UserManager<ApplicationUser> userManager,
    ILogger<PosService> logger) : IPosService
{
    private readonly ApplicationDbContext _dbContext = dbContext;
    private readonly UserManager<ApplicationUser> _userManager = userManager;
    private readonly ILogger<PosService> _logger = logger;

    private static readonly SemaphoreSlim _orderLock = new(1, 1);
    private static int _orderCounter = 0;
    private static string _lastOrderDate = "";

    // ===================== Categories =====================
    public async Task<IActionResult> GetCategoriesAsync()
    {
        var categories = await _dbContext.PosCategories
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .Select(c => new PosCategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                SortOrder = c.SortOrder
            })
            .ToListAsync();
        return new OkObjectResult(categories);
    }

    public async Task<IActionResult> CreateCategoryAsync(CreatePosCategoryDto request)
    {
        var category = new PosCategory
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            SortOrder = request.SortOrder
        };
        _dbContext.PosCategories.Add(category);
        await _dbContext.SaveChangesAsync();
        _logger.LogInformation("POS category created: {Name}", request.Name);
        return new OkObjectResult(new PosCategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            SortOrder = category.SortOrder
        });
    }

    public async Task<IActionResult> UpdateCategoryAsync(Guid id, CreatePosCategoryDto request)
    {
        var category = await _dbContext.PosCategories.FindAsync(id);
        if (category == null)
            return new NotFoundObjectResult(new { message = "Category not found." });

        category.Name = request.Name;
        category.Description = request.Description;
        category.SortOrder = request.SortOrder;
        category.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();
        return new OkObjectResult(new { message = "Category updated." });
    }

    public async Task<IActionResult> DeleteCategoryAsync(Guid id)
    {
        var category = await _dbContext.PosCategories
            .Include(c => c.Products)
            .FirstOrDefaultAsync(c => c.Id == id);
        if (category == null)
            return new NotFoundObjectResult(new { message = "Category not found." });

        if (category.Products.Count != 0)
            return new BadRequestObjectResult(new { message = "Cannot delete category with existing products." });

        _dbContext.PosCategories.Remove(category);
        await _dbContext.SaveChangesAsync();
        _logger.LogInformation("POS category deleted: {Id}", id);
        return new OkObjectResult(new { message = "Category deleted." });
    }

    // ===================== Products =====================
    public async Task<IActionResult> GetProductsAsync(Guid? categoryId = null)
    {
        var query = _dbContext.PosProducts
            .Include(p => p.Category)
            .AsQueryable();

        if (categoryId.HasValue)
            query = query.Where(p => p.CategoryId == categoryId.Value);

        var products = await query
            .OrderBy(p => p.Category!.Name)
            .ThenBy(p => p.Name)
            .Select(p => new PosProductDto
            {
                Id = p.Id,
                Name = p.Name,
                Price = p.Price,
                Stock = p.Stock,
                IsAvailable = p.IsAvailable,
                CategoryId = p.CategoryId,
                CategoryName = p.Category!.Name
            })
            .ToListAsync();
        return new OkObjectResult(products);
    }

    public async Task<IActionResult> CreateProductAsync(CreatePosProductDto request, string userId)
    {
        var product = new PosProduct
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Price = request.Price,
            Stock = request.Stock,
            IsAvailable = request.IsAvailable,
            CategoryId = request.CategoryId,
            CreatedByUserId = userId
        };
        _dbContext.PosProducts.Add(product);
        await _dbContext.SaveChangesAsync();
        _logger.LogInformation("POS product created: {Name} @ {Price}", request.Name, request.Price);
        return new OkObjectResult(new { message = "Product created.", id = product.Id });
    }

    public async Task<IActionResult> UpdateProductAsync(Guid id, CreatePosProductDto request)
    {
        var product = await _dbContext.PosProducts.FindAsync(id);
        if (product == null)
            return new NotFoundObjectResult(new { message = "Product not found." });

        product.Name = request.Name;
        product.Price = request.Price;
        product.Stock = request.Stock;
        product.IsAvailable = request.IsAvailable;
        product.CategoryId = request.CategoryId;
        product.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();
        return new OkObjectResult(new { message = "Product updated." });
    }

    public async Task<IActionResult> DeleteProductAsync(Guid id)
    {
        var product = await _dbContext.PosProducts.FindAsync(id);
        if (product == null)
            return new NotFoundObjectResult(new { message = "Product not found." });

        _dbContext.PosProducts.Remove(product);
        await _dbContext.SaveChangesAsync();
        _logger.LogInformation("POS product deleted: {Id}", id);
        return new OkObjectResult(new { message = "Product deleted." });
    }

    // ===================== Customers =====================
    public async Task<IActionResult> GetCustomersAsync(string? search = null)
    {
        var query = _dbContext.PosCustomers.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(c =>
                (c.FirstName + " " + c.LastName).Contains(search) ||
                (c.Email != null && c.Email.Contains(search)));

        var customers = await query
            .OrderByDescending(c => c.VisitCount)
            .Select(c => new PosCustomerDto
            {
                Id = c.Id,
                FirstName = c.FirstName,
                LastName = c.LastName,
                Email = c.Email,
                TotalSpent = c.TotalSpent,
                VisitCount = c.VisitCount,
                LastVisitAt = c.LastVisitAt
            })
            .ToListAsync();
        return new OkObjectResult(customers);
    }

    public async Task<IActionResult> CreateCustomerAsync(CreatePosCustomerDto request)
    {
        var customer = new PosCustomer
        {
            Id = Guid.NewGuid(),
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email
        };
        _dbContext.PosCustomers.Add(customer);
        await _dbContext.SaveChangesAsync();
        return new OkObjectResult(new PosCustomerDto
        {
            Id = customer.Id,
            FirstName = customer.FirstName,
            LastName = customer.LastName,
            Email = customer.Email
        });
    }

    public async Task<IActionResult> UpdateCustomerAsync(Guid id, CreatePosCustomerDto request)
    {
        var customer = await _dbContext.PosCustomers.FindAsync(id);
        if (customer == null)
            return new NotFoundObjectResult(new { message = "Customer not found." });

        customer.FirstName = request.FirstName;
        customer.LastName = request.LastName;
        customer.Email = request.Email;
        customer.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();
        return new OkObjectResult(new { message = "Customer updated." });
    }

    // ===================== Orders =====================
    public async Task<IActionResult> CreateOrderAsync(CreatePosOrderDto request, string userId, string operatorName)
    {
        await _orderLock.WaitAsync();
        try
        {
            var datePart = DateTime.UtcNow.ToString("yyyyMMdd");
            if (_lastOrderDate != datePart)
            {
                _lastOrderDate = datePart;
                _orderCounter = await _dbContext.PosOrders
                    .CountAsync(o => o.CreatedAt.Date == DateTime.UtcNow.Date);
            }
            _orderCounter++;
            var orderNumber = $"POS-{datePart}-{_orderCounter:D4}";

            var total = request.Subtotal + request.Donation;
            var change = request.AmountGiven - total;
            if (change < 0)
                return new BadRequestObjectResult(new { message = "Amount given is less than the total." });

            var openShift = await _dbContext.PosShifts
                .FirstOrDefaultAsync(s => s.CreatedByUserId == userId && s.Status == "open");
            if (openShift == null)
                return new BadRequestObjectResult(new { message = "Start a shift before processing a sale." });

            var productIds = request.Items.Select(i => i.ProductId).Distinct().ToList();
            var products = await _dbContext.PosProducts
                .Where(p => productIds.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id);

            foreach (var item in request.Items)
            {
                if (!products.TryGetValue(item.ProductId, out var product))
                    return new BadRequestObjectResult(new { message = $"Product \"{item.ProductName}\" no longer exists." });
                if (product.Stock < item.Quantity)
                    return new BadRequestObjectResult(new { message = $"Not enough stock for \"{product.Name}\" (only {product.Stock} left)." });
            }

            var order = new PosOrder
            {
                Id = Guid.NewGuid(),
                OrderNumber = orderNumber,
                CustomerId = request.CustomerId,
                ShiftId = openShift.Id,
                CustomerName = request.CustomerName,
                OperatorName = operatorName,
                Subtotal = request.Subtotal,
                Donation = request.Donation,
                Total = total,
                AmountGiven = request.AmountGiven,
                Change = change,
                PaymentMethod = request.PaymentMethod,
                Notes = request.Notes,
                CreatedByUserId = userId
            };

            foreach (var item in request.Items)
            {
                order.Items.Add(new PosOrderItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = order.Id,
                    ProductId = item.ProductId,
                    ProductName = item.ProductName,
                    Price = item.Price,
                    Quantity = item.Quantity,
                    Subtotal = item.Subtotal
                });
                products[item.ProductId].Stock -= item.Quantity;
            }

            _dbContext.PosOrders.Add(order);
            await _dbContext.SaveChangesAsync();

            var log = new PosPaymentLog
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                OrderNumber = order.OrderNumber,
                CustomerName = request.CustomerName,
                OperatorName = operatorName,
                Subtotal = request.Subtotal,
                Donation = request.Donation,
                Total = total,
                AmountGiven = request.AmountGiven,
                Change = change,
                PaymentMethod = request.PaymentMethod,
                Action = "created"
            };
            _dbContext.PosPaymentLogs.Add(log);

            var hiddenLog = new PosHiddenLog
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                OrderNumber = order.OrderNumber,
                CustomerName = request.CustomerName,
                OperatorName = operatorName,
                Subtotal = request.Subtotal,
                Donation = request.Donation,
                Total = total,
                AmountGiven = request.AmountGiven,
                Change = change,
                PaymentMethod = request.PaymentMethod,
                Action = "created"
            };
            _dbContext.PosHiddenLogs.Add(hiddenLog);

            if (request.CustomerId.HasValue)
            {
                var customer = await _dbContext.PosCustomers.FindAsync(request.CustomerId.Value);
                if (customer != null)
                {
                    customer.TotalSpent += total;
                    customer.VisitCount++;
                    customer.LastVisitAt = DateTime.UtcNow;
                }
            }

            await _dbContext.SaveChangesAsync();
            _logger.LogInformation("POS order created: {OrderNumber} total={Total}", orderNumber, total);

            return new OkObjectResult(new PosOrderDto
            {
                Id = order.Id,
                OrderNumber = order.OrderNumber,
                CustomerName = order.CustomerName,
                OperatorName = operatorName,
                Subtotal = order.Subtotal,
                Donation = order.Donation,
                Total = order.Total,
                AmountGiven = order.AmountGiven,
                Change = order.Change,
                PaymentMethod = order.PaymentMethod,
                Notes = order.Notes,
                CreatedAt = order.CreatedAt,
                Items = order.Items.Select(i => new PosOrderItemDto
                {
                    ProductId = i.ProductId,
                    ProductName = i.ProductName,
                    Price = i.Price,
                    Quantity = i.Quantity,
                    Subtotal = i.Subtotal
                }).ToList()
            });
        }
        finally
        {
            _orderLock.Release();
        }
    }

    public async Task<IActionResult> GetOrdersAsync(DateTime? from = null, DateTime? to = null, int page = 1, int pageSize = 50)
    {
        var query = _dbContext.PosOrders
            .Include(o => o.Items)
            .AsQueryable();

        if (from.HasValue) query = query.Where(o => o.CreatedAt >= from.Value);
        if (to.HasValue) query = query.Where(o => o.CreatedAt <= to.Value);

        var total = await query.CountAsync();
        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new PosOrderDto
            {
                Id = o.Id,
                OrderNumber = o.OrderNumber,
                CustomerName = o.CustomerName,
                OperatorName = o.OperatorName,
                Subtotal = o.Subtotal,
                Donation = o.Donation,
                Total = o.Total,
                AmountGiven = o.AmountGiven,
                Change = o.Change,
                PaymentMethod = o.PaymentMethod,
                Notes = o.Notes,
                CreatedAt = o.CreatedAt,
                Items = o.Items.Select(i => new PosOrderItemDto
                {
                    ProductId = i.ProductId,
                    ProductName = i.ProductName,
                    Price = i.Price,
                    Quantity = i.Quantity,
                    Subtotal = i.Subtotal
                }).ToList()
            })
            .ToListAsync();

        return new OkObjectResult(new { data = orders, total, page, pageSize });
    }

    // ===================== Payment Logs =====================
    public async Task<IActionResult> GetPaymentLogsAsync(DateTime? from = null, DateTime? to = null, int page = 1, int pageSize = 50)
    {
        var query = _dbContext.PosPaymentLogs.AsQueryable();
        if (from.HasValue) query = query.Where(l => l.CreatedAt >= from.Value);
        if (to.HasValue) query = query.Where(l => l.CreatedAt <= to.Value);

        var total = await query.CountAsync();
        var logs = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new PosPaymentLogDto
            {
                Id = l.Id,
                OrderId = l.OrderId,
                OrderNumber = l.OrderNumber,
                CustomerName = l.CustomerName,
                OperatorName = l.OperatorName,
                Subtotal = l.Subtotal,
                Donation = l.Donation,
                Total = l.Total,
                AmountGiven = l.AmountGiven,
                Change = l.Change,
                PaymentMethod = l.PaymentMethod,
                Action = l.Action,
                CreatedAt = l.CreatedAt
            })
            .ToListAsync();

        return new OkObjectResult(new { data = logs, total, page, pageSize });
    }

    // ===================== Donation Logs =====================
    public async Task<IActionResult> GetDonationLogsAsync(DateTime? from = null, DateTime? to = null, int page = 1, int pageSize = 50)
    {
        var query = _dbContext.PosPaymentLogs.Where(l => l.Donation > 0);
        if (from.HasValue) query = query.Where(l => l.CreatedAt >= from.Value);
        if (to.HasValue) query = query.Where(l => l.CreatedAt <= to.Value);

        var total = await query.CountAsync();
        var logs = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new PosDonationLogDto
            {
                Id = l.Id,
                OrderId = l.OrderId,
                OrderNumber = l.OrderNumber,
                CustomerName = l.CustomerName,
                OperatorName = l.OperatorName,
                Donation = l.Donation,
                Subtotal = l.Subtotal,
                Total = l.Total,
                PaymentMethod = l.PaymentMethod,
                Action = l.Action,
                CreatedAt = l.CreatedAt
            })
            .ToListAsync();

        return new OkObjectResult(new { data = logs, total, page, pageSize });
    }

    // ===================== Analytics =====================
    public async Task<IActionResult> GetAnalyticsAsync(DateTime? from = null, DateTime? to = null)
    {
        var now = DateTime.UtcNow;
        var startDate = from.HasValue
            ? (from.Value.Kind == DateTimeKind.Utc ? from.Value : DateTime.SpecifyKind(from.Value, DateTimeKind.Utc))
            : new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var endDate = to.HasValue
            ? (to.Value.Kind == DateTimeKind.Utc ? to.Value : DateTime.SpecifyKind(to.Value, DateTimeKind.Utc))
            : now;

        var ordersInRange = await _dbContext.PosOrders
            .Where(o => o.CreatedAt >= startDate && o.CreatedAt <= endDate)
            .ToListAsync();

        var currentMonth = new PosMonthlySummary
        {
            Year = now.Year,
            Month = now.Month,
            TotalSales = ordersInRange.Sum(o => o.Subtotal),
            TotalDonations = ordersInRange.Sum(o => o.Donation),
            TotalRevenue = ordersInRange.Sum(o => o.Total),
            OrderCount = ordersInRange.Count,
            CustomerCount = ordersInRange.Where(o => o.CustomerId != null).Select(o => o.CustomerId).Distinct().Count(),
            AverageOrderValue = ordersInRange.Count > 0 ? ordersInRange.Average(o => o.Total) : 0
        };

        var monthlyData = await _dbContext.PosOrders
            .Where(o => (from == null || o.CreatedAt >= startDate) && (to == null || o.CreatedAt <= endDate))
            .GroupBy(o => new { o.CreatedAt.Year, o.CreatedAt.Month })
            .Select(g => new PosMonthlySummary
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                TotalSales = g.Sum(o => o.Subtotal),
                TotalDonations = g.Sum(o => o.Donation),
                TotalRevenue = g.Sum(o => o.Total),
                OrderCount = g.Count(),
                CustomerCount = g.Where(o => o.CustomerId != null).Select(o => o.CustomerId).Distinct().Count(),
                AverageOrderValue = g.Average(o => o.Total)
            })
            .OrderByDescending(m => m.Year)
            .ThenByDescending(m => m.Month)
            .Take(12)
            .ToListAsync();

        var topProducts = await _dbContext.PosOrderItems
            .Where(i => i.Order!.CreatedAt >= startDate && i.Order.CreatedAt <= endDate)
            .GroupBy(i => new { i.ProductId, i.ProductName })
            .Select(g => new PosTopProductDto
            {
                ProductId = g.Key.ProductId,
                ProductName = g.Key.ProductName,
                TotalQuantity = g.Sum(i => i.Quantity),
                TotalRevenue = g.Sum(i => i.Subtotal)
            })
            .OrderByDescending(p => p.TotalRevenue)
            .Take(10)
            .ToListAsync();

        var topCustomers = await _dbContext.PosCustomers
            .OrderByDescending(c => c.TotalSpent)
            .Take(10)
            .Select(c => new PosTopCustomerDto
            {
                CustomerId = c.Id,
                CustomerName = c.FirstName + " " + c.LastName,
                TotalSpent = c.TotalSpent,
                VisitCount = c.VisitCount,
                LastVisitAt = c.LastVisitAt
            })
            .ToListAsync();

        var last30Days = now.AddDays(-30);
        var dailySales = await _dbContext.PosOrders
            .Where(o => o.CreatedAt >= last30Days)
            .GroupBy(o => o.CreatedAt.Date)
            .Select(g => new PosDailySalesDto
            {
                Date = g.Key,
                TotalSales = g.Sum(o => o.Subtotal),
                TotalDonations = g.Sum(o => o.Donation),
                OrderCount = g.Count()
            })
            .OrderBy(d => d.Date)
            .ToListAsync();

        var paymentMethodBreakdown = await _dbContext.PosOrders
            .Where(o => o.CreatedAt >= startDate && o.CreatedAt <= endDate)
            .GroupBy(o => o.PaymentMethod)
            .Select(g => new { Method = g.Key, Total = g.Sum(o => o.Total), Count = g.Count() })
            .ToListAsync();

        var peakHours = await _dbContext.PosOrders
            .Where(o => o.CreatedAt >= startDate && o.CreatedAt <= endDate)
            .GroupBy(o => o.CreatedAt.Hour)
            .Select(g => new { Hour = g.Key, Count = g.Count(), TotalRevenue = g.Sum(o => o.Total) })
            .OrderByDescending(g => g.Count)
            .Take(5)
            .ToListAsync();

        var analytics = new PosAnalyticsDto
        {
            CurrentMonth = currentMonth,
            MonthlyHistory = monthlyData,
            TopProducts = topProducts,
            TopCustomers = topCustomers,
            DailySales = dailySales,
            TotalRevenue = ordersInRange.Sum(o => o.Total),
            TotalDonations = ordersInRange.Sum(o => o.Donation),
            TotalOrders = ordersInRange.Count,
            AverageOrderValue = currentMonth.AverageOrderValue,
            DonationCount = ordersInRange.Count(o => o.Donation > 0),
            PaymentMethodBreakdown = paymentMethodBreakdown.Select(p => new PosPaymentMethodBreakdownDto
            {
                Method = p.Method,
                Total = p.Total,
                Count = p.Count
            }).ToList(),
            PeakHours = peakHours.Select(p => new PosHourlySummaryDto
            {
                Hour = p.Hour,
                OrderCount = p.Count,
                Revenue = p.TotalRevenue
            }).ToList()
        };

        return new OkObjectResult(analytics);
    }

    // ===================== Shifts =====================
    public async Task<IActionResult> StartShiftAsync(StartPosShiftDto request, string userId, string operatorName)
    {
        var openShift = await _dbContext.PosShifts
            .FirstOrDefaultAsync(s => s.CreatedByUserId == userId && s.Status == "open");
        if (openShift != null)
            return new BadRequestObjectResult(new { message = "You already have an open shift. End it before starting a new one." });

        var shift = new PosShift
        {
            Id = Guid.NewGuid(),
            OperatorName = operatorName,
            StartingCash = request.StartingCash,
            Status = "open",
            Notes = request.Notes,
            CreatedByUserId = userId
        };
        _dbContext.PosShifts.Add(shift);
        await _dbContext.SaveChangesAsync();
        _logger.LogInformation("POS shift started by {Operator}", operatorName);
        return new OkObjectResult(new PosShiftDto
        {
            Id = shift.Id,
            OperatorName = shift.OperatorName,
            StartingCash = shift.StartingCash,
            Status = shift.Status,
            Notes = shift.Notes,
            StartedAt = shift.StartedAt
        });
    }

    public async Task<IActionResult> EndShiftAsync(Guid shiftId, EndPosShiftDto request, string userId, bool isAdmin)
    {
        var shift = await _dbContext.PosShifts.FindAsync(shiftId);
        if (shift == null)
            return new NotFoundObjectResult(new { message = "Shift not found." });

        if (shift.CreatedByUserId != userId && !isAdmin)
            return new ObjectResult(new { message = "You can only end your own shift." }) { StatusCode = 403 };

        if (shift.Status != "open")
            return new BadRequestObjectResult(new { message = "Shift is already ended." });

        var orders = await _dbContext.PosOrders
            .Where(o => o.ShiftId == shift.Id)
            .ToListAsync();

        shift.EndingCash = request.EndingCash;
        shift.TotalSales = orders.Sum(o => o.Subtotal);
        shift.TotalDonations = orders.Sum(o => o.Donation);
        shift.OrderCount = orders.Count;
        shift.ExpectedCash = shift.StartingCash + shift.TotalSales;
        shift.Status = "ended";
        shift.EndedAt = DateTime.UtcNow;
        shift.Notes = request.Notes;

        await _dbContext.SaveChangesAsync();
        _logger.LogInformation("POS shift ended by {Operator}: start={StartingCash}, end={EndingCash}, expected={ExpectedCash}",
            shift.OperatorName, shift.StartingCash, shift.EndingCash, shift.ExpectedCash);

        return new OkObjectResult(new PosShiftDto
        {
            Id = shift.Id,
            OperatorName = shift.OperatorName,
            StartingCash = shift.StartingCash,
            EndingCash = shift.EndingCash,
            ExpectedCash = shift.ExpectedCash,
            TotalSales = shift.TotalSales,
            TotalDonations = shift.TotalDonations,
            OrderCount = shift.OrderCount,
            Status = shift.Status,
            Notes = shift.Notes,
            StartedAt = shift.StartedAt,
            EndedAt = shift.EndedAt
        });
    }

    public async Task<IActionResult> GetOpenShiftAsync(string userId)
    {
        var shift = await _dbContext.PosShifts
            .FirstOrDefaultAsync(s => s.CreatedByUserId == userId && s.Status == "open");
        if (shift == null)
            return new OkObjectResult(new { shift = (object?)null });

        var orders = await _dbContext.PosOrders
            .Where(o => o.ShiftId == shift.Id)
            .ToListAsync();

        return new OkObjectResult(new { shift = new PosShiftDto
        {
            Id = shift.Id,
            OperatorName = shift.OperatorName,
            StartingCash = shift.StartingCash,
            EndingCash = shift.EndingCash,
            ExpectedCash = shift.ExpectedCash,
            TotalSales = orders.Sum(o => o.Subtotal),
            TotalDonations = orders.Sum(o => o.Donation),
            OrderCount = orders.Count,
            Status = shift.Status,
            Notes = shift.Notes,
            StartedAt = shift.StartedAt,
            EndedAt = shift.EndedAt
        }});
    }

    public async Task<IActionResult> GetShiftsAsync(int page = 1, int pageSize = 20)
    {
        var total = await _dbContext.PosShifts.CountAsync();
        var shifts = await _dbContext.PosShifts
            .OrderByDescending(s => s.StartedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new PosShiftDto
            {
                Id = s.Id,
                OperatorName = s.OperatorName,
                StartingCash = s.StartingCash,
                EndingCash = s.EndingCash,
                ExpectedCash = s.ExpectedCash,
                TotalSales = s.TotalSales,
                TotalDonations = s.TotalDonations,
                OrderCount = s.OrderCount,
                Status = s.Status,
                Notes = s.Notes,
                StartedAt = s.StartedAt,
                EndedAt = s.EndedAt
            })
            .ToListAsync();

        return new OkObjectResult(new { data = shifts, total, page, pageSize });
    }

    // ===================== Operator Management =====================
    public async Task<IActionResult> GetOperatorsAsync()
    {
        var users = _userManager.Users.OrderBy(u => u.FirstName).ToList();
        var operators = new List<PosOperatorDto>();
        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            if (roles.Contains("Admin") || roles.Contains("Leader"))
                continue;
            var isOp = roles.Contains("PosOperator");
            operators.Add(new PosOperatorDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email ?? "",
                IsPosOperator = isOp,
                Roles = roles.ToList()
            });
        }
        return new OkObjectResult(operators);
    }

    public async Task<IActionResult> AddOperatorAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return new NotFoundObjectResult(new { message = "User not found." });

        if (await _userManager.IsInRoleAsync(user, "PosOperator"))
            return new BadRequestObjectResult(new { message = "User is already a POS operator." });

        var result = await _userManager.AddToRoleAsync(user, "PosOperator");
        if (!result.Succeeded)
            return new BadRequestObjectResult(new { message = "Failed to add role.", errors = result.Errors.Select(e => e.Description) });

        _logger.LogInformation("POS operator added: {Email}", user.Email);
        return new OkObjectResult(new { message = "POS operator added." });
    }

    public async Task<IActionResult> RemoveOperatorAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return new NotFoundObjectResult(new { message = "User not found." });

        if (!await _userManager.IsInRoleAsync(user, "PosOperator"))
            return new BadRequestObjectResult(new { message = "User is not a POS operator." });

        var result = await _userManager.RemoveFromRoleAsync(user, "PosOperator");
        if (!result.Succeeded)
            return new BadRequestObjectResult(new { message = "Failed to remove role.", errors = result.Errors.Select(e => e.Description) });

        _logger.LogInformation("POS operator removed: {Email}", user.Email);
        return new OkObjectResult(new { message = "POS operator removed." });
    }
}
