using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using Task6.Data;
using Task6.Models;

namespace Task6.Controllers
{
    [Authorize]
    public class ReservationController : Controller
    {
        private readonly EscapeRoomDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public ReservationController(EscapeRoomDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        // GET: /Reservation/MyReservations
        public async Task<IActionResult> MyReservations()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return RedirectToAction("Login", "Account");

            var reservations = await _context.Rezervacije
                .Include(r => r.Termin)
                .ThenInclude(t => t.EscapeRoom)
                .Where(r => r.KorisnikID == user.Id)
                .OrderByDescending(r => r.DatumKreiranja)
                .ToListAsync();

            return View(reservations);
        }

        // POST: /Reservation/Book/5
        [HttpPost]
        public async Task<IActionResult> Book(int terminId, int brojOsoba)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            // Use transaction to prevent double booking
            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                // Reload the termin inside transaction with an update lock
                var termin = await _context.Termini
                    .Where(t => t.TerminID == terminId)
                    .FirstOrDefaultAsync();

                if (termin == null || !termin.Dostupnost)
                {
                    return BadRequest(new { message = "Termin nije dostupan." });
                }

                // Mark termin as occupied and create reservation
                termin.Dostupnost = false;
                var rez = new Rezervacija
                {
                    KorisnikID = user.Id,
                    TerminID = termin.TerminID,
                    BrojOsoba = brojOsoba,
                    DatumKreiranja = System.DateTime.Now,
                    Status = true
                };

                _context.Rezervacije.Add(rez);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = "Rezervacija uspješna." });
            }
        }

        // POST: /Reservation/Cancel/5
        [HttpPost]
        public async Task<IActionResult> Cancel(int id)
        {
            var rez = await _context.Rezervacije.Include(r => r.Termin).FirstOrDefaultAsync(r => r.RezervacijaID == id);
            if (rez == null) return NotFound();

            var user = await _userManager.GetUserAsync(User);
            if (user == null || rez.KorisnikID != user.Id) return Unauthorized();

            rez.Status = false; // cancelled
            if (rez.Termin != null)
            {
                rez.Termin.Dostupnost = true;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Rezervacija otkazana." });
        }
    }
}
