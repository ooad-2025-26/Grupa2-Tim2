using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Task6.Data;
using Task6.Models;
using Task6.Services;

namespace Task6.Controllers
{
    [Authorize]
    public class ReservationController : Controller
    {
        private readonly EscapeRoomDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly EmailService _emailService;

        public ReservationController(
            EscapeRoomDbContext context,
            UserManager<ApplicationUser> userManager,
            EmailService emailService)
        {
            _context = context;
            _userManager = userManager;
            _emailService = emailService;
        }

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

            var placeneRezervacije = await _context.Placanja
                .Where(p => p.Status)
                .Select(p => p.RezervacijaID)
                .ToListAsync();

            ViewBag.PlaceneRezervacije = placeneRezervacije;

            return View(reservations);
        }

        public async Task<IActionResult> Details(int id)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return RedirectToAction("Login", "Account");

            var rezervacija = await _context.Rezervacije
                .Include(r => r.Korisnik)
                .Include(r => r.Termin)
                    .ThenInclude(t => t.EscapeRoom)
                .FirstOrDefaultAsync(r => r.RezervacijaID == id && r.KorisnikID == user.Id);

            if (rezervacija == null)
                return NotFound();

            var placanje = await _context.Placanja
                .FirstOrDefaultAsync(p => p.RezervacijaID == rezervacija.RezervacijaID);

            ViewBag.Placanje = placanje;

            return View(rezervacija);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Book(int terminId, int brojOsoba)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                var termin = await _context.Termini
                    .Include(t => t.EscapeRoom)
                    .FirstOrDefaultAsync(t => t.TerminID == terminId);

                if (termin == null || !termin.Dostupnost)
                    return BadRequest(new { message = "Termin nije dostupan." });

                var terminDateTime = termin.Datum.Date;
                if (TimeSpan.TryParse(termin.Vrijeme, out var terminVrijeme))
                {
                    terminDateTime = terminDateTime.Add(terminVrijeme);
                }

                if (terminDateTime < DateTime.UtcNow)
                    return BadRequest(new { message = "Termin nije dostupan." });

                termin.Dostupnost = false;

                var rez = new Rezervacija
                {
                    KorisnikID = user.Id,
                    TerminID = termin.TerminID,
                    BrojOsoba = brojOsoba,
                    DatumKreiranja = DateTime.UtcNow,
                    Status = true
                };

                _context.Rezervacije.Add(rez);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                if (!string.IsNullOrEmpty(user.Email))
                {
                    await _emailService.SendEmailAsync(
                        user.Email,
                        "The Last Key - Potvrda rezervacije",
                        $@"
                        <div style='font-family: Arial, sans-serif; padding: 20px;'>
                            <h2 style='color:#233D4D;'>The Last Key</h2>
                            <h3 style='color:#FE7F2D;'>Rezervacija uspješna</h3>
                            <p>Poštovani/a {user.Ime}, vaša rezervacija je uspješno kreirana.</p>
                            <p><strong>Soba:</strong> {termin.EscapeRoom.Naziv}</p>
                            <p><strong>Datum:</strong> {termin.Datum:dd.MM.yyyy}</p>
                            <p><strong>Vrijeme:</strong> {termin.Vrijeme}</p>
                            <p><strong>Broj osoba:</strong> {brojOsoba}</p>
                            <hr />
                            <p style='font-size:13px; color:#777;'>
                                Hvala što koristite The Last Key.
                            </p>
                        </div>"
                    );
                }

                return RedirectToAction("MyReservations", "Reservation");
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Cancel(int id)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return RedirectToAction("Login", "Account");

            var rez = await _context.Rezervacije
                .Include(r => r.Termin)
                    .ThenInclude(t => t.EscapeRoom)
                .Include(r => r.Korisnik)
                .FirstOrDefaultAsync(r => r.RezervacijaID == id && r.KorisnikID == user.Id);

            if (rez == null) return NotFound();

            if (!rez.Status)
            {
                TempData["CancelError"] = "Rezervaciju nije moguće otkazati.";
                return RedirectToAction("Index", "Profil");
            }

            if (rez.Termin != null)
            {
                var terminDateTime = rez.Termin.Datum.Date;
                if (TimeSpan.TryParse(rez.Termin.Vrijeme, out var terminVrijeme))
                {
                    terminDateTime = terminDateTime.Add(terminVrijeme);
                }

                if (terminDateTime < DateTime.UtcNow)
                {
                    TempData["CancelError"] = "Rezervaciju nije moguće otkazati.";
                    return RedirectToAction("Index", "Profil");
                }
            }

            rez.Status = false;

            if (rez.Termin != null)
                rez.Termin.Dostupnost = true;

            await _context.SaveChangesAsync();

            TempData["CancelSuccess"] = "Uspješno ste otkazali rezervaciju.";

            if (!string.IsNullOrEmpty(rez.Korisnik.Email))
            {
                await _emailService.SendEmailAsync(
                    rez.Korisnik.Email,
                    "The Last Key - Rezervacija otkazana",
                    $@"
                    <div style='font-family: Arial, sans-serif; padding: 20px;'>
                        <h2 style='color:#233D4D;'>The Last Key</h2>
                        <h3 style='color:#FE7F2D;'>Rezervacija otkazana</h3>
                        <p>Poštovani/a {rez.Korisnik.Ime}, vaša rezervacija je otkazana.</p>
                        <p><strong>Soba:</strong> {rez.Termin.EscapeRoom.Naziv}</p>
                        <p><strong>Datum:</strong> {rez.Termin.Datum:dd.MM.yyyy}</p>
                        <p><strong>Vrijeme:</strong> {rez.Termin.Vrijeme}</p>
                        <hr />
                        <p style='font-size:13px; color:#777;'>
                            Ovo je automatska poruka sistema The Last Key.
                        </p>
                    </div>"
                );
            }

            return RedirectToAction("Index", "Profil");
        }
    }
}