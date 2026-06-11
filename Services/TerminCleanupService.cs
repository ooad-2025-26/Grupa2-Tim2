using Microsoft.EntityFrameworkCore;
using Task6.Data;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Task6.Services
{
    public class TerminCleanupService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<TerminCleanupService> _logger;
        private readonly TimeSpan _delay = TimeSpan.FromMinutes(15);

        public TerminCleanupService(IServiceProvider serviceProvider, ILogger<TerminCleanupService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Termin cleanup service started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CleanupExpiredTerminiAsync(stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error while cleaning up expired termini.");
                }

                await Task.Delay(_delay, stoppingToken);
            }

            _logger.LogInformation("Termin cleanup service stopped.");
        }

        private async Task CleanupExpiredTerminiAsync(CancellationToken cancellationToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<EscapeRoomDbContext>();

            var now = DateTime.Now;

            var dostupniTermini = await db.Termini
                .Where(t => t.Dostupnost)
                .ToListAsync(cancellationToken);

            var expiredTermini = dostupniTermini
                .Where(t =>
                {
                    var terminDateTime = t.Datum.Date;

                    if (TimeSpan.TryParse(t.Vrijeme, out var vrijeme))
                    {
                        terminDateTime = terminDateTime.Add(vrijeme);
                    }

                    return terminDateTime < now;
                })
                .ToList();

            if (!expiredTermini.Any())
            {
                _logger.LogDebug("No expired termini found.");
                return;
            }

            db.Termini.RemoveRange(expiredTermini);
            await db.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Cleaned up {Count} expired termini.", expiredTermini.Count);
        }
    }
}
