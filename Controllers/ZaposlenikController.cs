using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Task6.Data;
using Task6.Models;
using Task6.Services;

namespace Task6.Controllers
{
    public class ZaposlenikController : Controller
    {
        private readonly EscapeRoomDbContext _context;
        private readonly EmailService _emailService;

        public ZaposlenikController(EscapeRoomDbContext context, EmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        private async Task<bool> JeZaposlenik()
        {
            var email = User.Identity?.Name;

            var korisnik = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email);

            return korisnik != null && korisnik.Uloga == Uloga.Zaposlenik;
        }

        public async Task<IActionResult> Dashboard()
        {
            if (!await JeZaposlenik())
                return RedirectToAction("Index", "Home");

            ViewBag.Stats = new
            {
                TotalRooms = await _context.EscapeRooms.CountAsync(),
                TotalReservations = await _context.Rezervacije.CountAsync(),
                TotalReviews = await _context.Recenzije.CountAsync(),
                TotalSupport = await _context.Podrske.CountAsync()
            };

            return View();
        }

        public async Task<IActionResult> Reservations()
        {
            if (!await JeZaposlenik())
                return RedirectToAction("Index", "Home");

            var rezervacije = await _context.Rezervacije
                .Include(r => r.Korisnik)
                .Include(r => r.Termin)
                    .ThenInclude(t => t.EscapeRoom)
                .ToListAsync();

            return View(rezervacije);
        }

        public async Task<IActionResult> ReservationDetails(int id)
        {
            if (!await JeZaposlenik())
                return RedirectToAction("Index", "Home");

            var rezervacija = await _context.Rezervacije
                .Include(r => r.Korisnik)
                .Include(r => r.Termin)
                    .ThenInclude(t => t.EscapeRoom)
                .FirstOrDefaultAsync(r => r.RezervacijaID == id);

            if (rezervacija == null)
                return NotFound();

            return View(rezervacija);
        }

        public async Task<IActionResult> Reviews()
        {
            if (!await JeZaposlenik())
                return RedirectToAction("Index", "Home");

            var recenzije = await _context.Recenzije
                .Include(r => r.Korisnik)
                .Include(r => r.EscapeRoom)
                .ToListAsync();

            return View(recenzije);
        }

        [HttpGet]
        public async Task<IActionResult> DeleteReview(int id)
        {
            if (!await JeZaposlenik())
                return RedirectToAction("Index", "Home");

            var recenzija = await _context.Recenzije.FindAsync(id);

            if (recenzija == null)
                return NotFound();

            _context.Recenzije.Remove(recenzija);
            await _context.SaveChangesAsync();

            return RedirectToAction(nameof(Reviews));
        }

        public async Task<IActionResult> Support()
        {
            if (!await JeZaposlenik())
                return RedirectToAction("Index", "Home");

            var upiti = await _context.Podrske
                .Include(p => p.Korisnik)
                .OrderByDescending(p => p.Datum)
                .ToListAsync();

            return View(upiti);
        }

        public async Task<IActionResult> SupportDetails(int id)
        {
            if (!await JeZaposlenik())
                return RedirectToAction("Index", "Home");

            var upit = await _context.Podrske
                .Include(p => p.Korisnik)
                .FirstOrDefaultAsync(p => p.PorukaID == id);

            if (upit == null)
                return NotFound();

            return View(upit);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ReplySupport(int id, string odgovor)
        {
            if (!await JeZaposlenik())
                return RedirectToAction("Index", "Home");

            var upit = await _context.Podrske
                .Include(p => p.Korisnik)
                .FirstOrDefaultAsync(p => p.PorukaID == id);

            if (upit == null)
                return NotFound();

            if (string.IsNullOrWhiteSpace(odgovor))
            {
                TempData["SupportError"] = "Odgovor ne može biti prazan.";
                return RedirectToAction(nameof(SupportDetails), new { id });
            }

            upit.Odgovor = odgovor;
            upit.Odgovoreno = true;
            upit.DatumOdgovora = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _emailService.SendEmailAsync(
                upit.Email,
                "The Last Key - Odgovor na vaš upit",
                $@"
        <div style='font-family: Arial, sans-serif; padding: 20px;'>
            <h2 style='color:#233D4D;'>The Last Key</h2>
            <h3 style='color:#FE7F2D;'>Odgovor na vaš upit</h3>
            <p>Poštovani/a {upit.Korisnik?.Ime},</p>
            <p><strong>Vaš upit:</strong> {upit.NaslovPoruke}</p>
            <p>{upit.Odgovor}</p>
            <hr />
            <p style='font-size:13px; color:#777;'>
                Hvala što koristite The Last Key.
            </p>
        </div>"
            );

            return RedirectToAction(nameof(SupportDetails), new { id });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteSupport(int id)
        {
            if (!await JeZaposlenik())
                return RedirectToAction("Index", "Home");

            var upit = await _context.Podrske.FindAsync(id);

            if (upit == null)
                return NotFound();

            _context.Podrske.Remove(upit);
            await _context.SaveChangesAsync();

            return RedirectToAction(nameof(Support));
        }
    }
}