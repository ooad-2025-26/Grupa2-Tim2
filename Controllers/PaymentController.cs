using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using Task6.Data;
using Task6.Models;
using Task6.Services;

namespace Task6.Controllers
{
    [Authorize]
    public class PaymentController : Controller
    {
        private readonly EscapeRoomDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly EmailService _emailService;

        public PaymentController(
            EscapeRoomDbContext context,
            UserManager<ApplicationUser> userManager,
            EmailService emailService)
        {
            _context = context;
            _userManager = userManager;
            _emailService = emailService;
        }

        [HttpGet]
        public async Task<IActionResult> Pay(int reservationId)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return RedirectToAction("Login", "Account");

            var rezervacija = await _context.Rezervacije
                .Include(r => r.Korisnik)
                .Include(r => r.Termin)
                    .ThenInclude(t => t.EscapeRoom)
                .FirstOrDefaultAsync(r =>
                    r.RezervacijaID == reservationId &&
                    r.KorisnikID == user.Id);

            if (rezervacija == null)
                return NotFound();

            if (!rezervacija.Status)
            {
                TempData["PaymentError"] = "Otkazana rezervacija se ne može platiti.";
                return RedirectToAction("Index", "Profil");
            }

            var postojecePlacanje = await _context.Placanja
                .FirstOrDefaultAsync(p => p.RezervacijaID == reservationId);

            if (postojecePlacanje != null && postojecePlacanje.Status)
            {
                TempData["PaymentInfo"] = "Ova rezervacija je već plaćena.";
                return RedirectToAction("Index", "Profil");
            }

            ViewBag.Rezervacija = rezervacija;
            ViewBag.Iznos = rezervacija.BrojOsoba * rezervacija.Termin.EscapeRoom.Cijena;

            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Pay(
            int reservationId,
            string brojKartice,
            string imeNaKartici,
            string datumIsteka,
            string cvv)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return RedirectToAction("Login", "Account");

            var rezervacija = await _context.Rezervacije
                .Include(r => r.Korisnik)
                .Include(r => r.Termin)
                    .ThenInclude(t => t.EscapeRoom)
                .FirstOrDefaultAsync(r =>
                    r.RezervacijaID == reservationId &&
                    r.KorisnikID == user.Id);

            if (rezervacija == null)
                return NotFound();

            ViewBag.Rezervacija = rezervacija;
            ViewBag.Iznos = rezervacija.BrojOsoba * rezervacija.Termin.EscapeRoom.Cijena;

            if (!rezervacija.Status)
            {
                TempData["PaymentError"] = "Otkazana rezervacija se ne može platiti.";
                return RedirectToAction("Index", "Profil");
            }

            if (string.IsNullOrWhiteSpace(brojKartice) ||
                string.IsNullOrWhiteSpace(imeNaKartici) ||
                string.IsNullOrWhiteSpace(datumIsteka) ||
                string.IsNullOrWhiteSpace(cvv))
            {
                ModelState.AddModelError(string.Empty, "Sva polja su obavezna.");
                return View();
            }

            var ociscenBrojKartice = brojKartice.Replace(" ", "");

            if (ociscenBrojKartice.Length != 16 || !ociscenBrojKartice.All(char.IsDigit))
            {
                ModelState.AddModelError(string.Empty, "Broj kartice mora imati tačno 16 cifara.");
                return View();
            }

            if (imeNaKartici.Trim().Length < 3)
            {
                ModelState.AddModelError(string.Empty, "Ime na kartici mora imati najmanje 3 karaktera.");
                return View();
            }

            if (!DateTime.TryParseExact(
                    datumIsteka,
                    "MM/yy",
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.None,
                    out var datumKartice))
            {
                ModelState.AddModelError(string.Empty, "Datum isteka mora biti u formatu MM/YY.");
                return View();
            }

            var mjesec = int.Parse(datumIsteka.Substring(0, 2));

            if (mjesec < 1 || mjesec > 12)
            {
                ModelState.AddModelError(string.Empty, "Mjesec mora biti između 01 i 12.");
                return View();
            }

            var krajMjeseca = new DateTime(
                datumKartice.Year,
                datumKartice.Month,
                DateTime.DaysInMonth(datumKartice.Year, datumKartice.Month));

            if (krajMjeseca < DateTime.Now.Date)
            {
                ModelState.AddModelError(string.Empty, "Kartica je istekla.");
                return View();
            }

            if (cvv.Length != 3 || !cvv.All(char.IsDigit))
            {
                ModelState.AddModelError(string.Empty, "CVV mora imati tačno 3 cifre.");
                return View();
            }

            var iznos = rezervacija.BrojOsoba * rezervacija.Termin.EscapeRoom.Cijena;

            var placanje = await _context.Placanja
                .FirstOrDefaultAsync(p => p.RezervacijaID == reservationId);

            if (placanje == null)
            {
                placanje = new Placanje
                {
                    RezervacijaID = reservationId,
                    Iznos = iznos,
                    Datum = DateTime.UtcNow,
                    Status = true
                };

                _context.Placanja.Add(placanje);
            }
            else
            {
                placanje.Iznos = iznos;
                placanje.Datum = DateTime.UtcNow;
                placanje.Status = true;

                _context.Placanja.Update(placanje);
            }

            await _context.SaveChangesAsync();

            if (!string.IsNullOrEmpty(user.Email))
            {
                await _emailService.SendEmailAsync(
                    user.Email,
                    "The Last Key - Potvrda plaćanja",
                    $@"
                    <div style='font-family: Arial, sans-serif; padding: 20px;'>
                        <h2 style='color:#233D4D;'>The Last Key</h2>
                        <h3 style='color:#FE7F2D;'>Plaćanje uspješno</h3>
                        <p>Poštovani/a {user.Ime}, vaša uplata je uspješno evidentirana.</p>
                        <p><strong>Soba:</strong> {rezervacija.Termin.EscapeRoom.Naziv}</p>
                        <p><strong>Datum:</strong> {rezervacija.Termin.Datum:dd.MM.yyyy}</p>
                        <p><strong>Vrijeme:</strong> {rezervacija.Termin.Vrijeme}</p>
                        <p><strong>Iznos:</strong> {iznos} KM</p>
                    </div>"
                );
            }

            TempData["PaymentSuccess"] = "Plaćanje je uspješno izvršeno.";
            return RedirectToAction("Index", "Profil");
        }
    }
}