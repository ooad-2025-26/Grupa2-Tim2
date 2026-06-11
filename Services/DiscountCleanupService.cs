using Microsoft.EntityFrameworkCore;
using Task6.Data;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Task6.Services
{
    public class DiscountCleanupService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<DiscountCleanupService> _logger;
        private readonly TimeSpan _delay = TimeSpan.FromHours(1);

        public DiscountCleanupService(IServiceProvider serviceProvider, ILogger<DiscountCleanupService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Discount cleanup service started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CleanupExpiredDiscountsAsync(stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error while cleaning up expired discounts.");
                }

                await Task.Delay(_delay, stoppingToken);
            }

            _logger.LogInformation("Discount cleanup service stopped.");
        }

        private async Task CleanupExpiredDiscountsAsync(CancellationToken cancellationToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<EscapeRoomDbContext>();

            var now = DateTime.UtcNow;
            var expiredRooms = await db.EscapeRooms
                .Where(r => r.DiscountPercent > 0 && r.DiscountEnd.HasValue && r.DiscountEnd.Value < now)
                .ToListAsync(cancellationToken);

            if (!expiredRooms.Any())
            {
                _logger.LogDebug("No expired discounts found.");
                return;
            }

            foreach (var room in expiredRooms)
            {
                room.DiscountPercent = 0;
                room.DiscountStart = null;
                room.DiscountEnd = null;
            }

            await db.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Cleaned up {Count} expired discounts.", expiredRooms.Count);
        }
    }
}
