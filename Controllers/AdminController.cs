using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Task6.Data;
using Task6.Models;
using Task6.Services;

namespace Task6.Controllers
{
    public class AdminController : Controller
    {
        private readonly EscapeRoomDbContext _context;
        private readonly EmailService _emailService;

        public AdminController(EscapeRoomDbContext context, EmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        private async Task<bool> JeAdmin()
        {
            var email = User.Identity?.Name;

            var korisnik = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email);

            return korisnik != null && korisnik.Uloga == Uloga.Admin;
        }

        public async Task<IActionResult> Dashboard()
        {
            if (!await JeAdmin())
                return RedirectToAction("Index", "Home");

            ViewBag.Stats = new
            {
                TotalUsers = await _context.Users.CountAsync(),
                TotalRooms = await _context.EscapeRooms.CountAsync(),
                TotalReservations = await _context.Rezervacije.CountAsync(),
                PendingPayments = await _context.Placanja.CountAsync(),
                TotalReviews = await _context.Recenzije.CountAsync(),
                AverageRating = await _context.Recenzije.AnyAsync()
                    ? await _context.Recenzije.AverageAsync(r => r.Ocjena)
                    : 0
            };

            return View();
        }

        public async Task<IActionResult> Rooms()
        {
            if (!await JeAdmin())
                return RedirectToAction("Index", "Home");

            var sobe = await _context.EscapeRooms.ToListAsync();
            return View(sobe);
        }

        [HttpGet]
        public async Task<IActionResult> CreateRoom()
        {
            if (!await JeAdmin())
                return RedirectToAction("Index", "Home");

            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CreateRoom(EscapeRoom room)
        {
            if (!await JeAdmin())
                return RedirectToAction("Index", "Home");

            if (ModelState.IsValid)
            {
                _context.EscapeRooms.Add(room);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Rooms));
            }

            return View(room);
        }

        [HttpGet]
        public async Task<IActionResult> EditRoom(int id)
        {
            if (!await JeAdmin())
                return RedirectToAction("Index", "Home");

            var room = await _context.EscapeRooms.FindAsync(id);

            if (room == null)
                return NotFound();

            return View(room);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EditRoom(EscapeRoom room)
        {
            if (!await JeAdmin())
                return RedirectToAction("Index", "Home");

            if (ModelState.IsValid)
            {
                _context.EscapeRooms.Update(room);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Rooms));
            }

            return View(room);
        }

        [HttpGet]
        public async Task<IActionResult> DeleteRoom(int id)
        {
            if (!await JeAdmin())
                return RedirectToAction("Index", "Home");

            var room = await _context.EscapeRooms.FindAsync(id);

            if (room == null)
                return NotFound();

            _context.EscapeRooms.Remove(room);
            await _context.SaveChangesAsync();

            return RedirectToAction(nameof(Rooms));
        }

        public async Task<IActionResult> Reservations()
        {
            if (!await JeAdmin())
                return RedirectToAction("Index", "Home");

            var rezervacije = await _context.Rezervacije
                .Include(r => r.Korisnik)
                .Include(r => r.Termin)
                    .ThenInclude(t => t.EscapeRoom)
                .ToListAsync();

            return View(rezervacije);
        }

        public async Task<IActionResult> Payments()
        {
            if (!await JeAdmin())
                return RedirectToAction("Index", "Home");

            var placanja = await _context.Placanja
                .Include(p => p.Rezervacija)
                    .ThenInclude(r => r.Korisnik)
                .ToListAsync();

            return View(placanja);
        }

        public async Task<IActionResult> Reviews()
        {
            if (!await JeAdmin())
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
            if (!await JeAdmin())
                return RedirectToAction("Index", "Home");

            var recenzija = await _context.Recenzije.FindAsync(id);

            if (recenzija == null)
                return NotFound();

            _context.Recenzije.Remove(recenzija);
            await _context.SaveChangesAsync();

            return RedirectToAction(nameof(Reviews));
        }

        public async Task<IActionResult> Notifications()
        {
            if (!await JeAdmin())
                return RedirectToAction("Index", "Home");

            var obavijesti = await _context.Obavijesti.ToListAsync();

            return View(obavijesti);
        }

        [HttpGet]
        public async Task<IActionResult> CreateNotification()
        {
            if (!await JeAdmin())
                return RedirectToAction("Index", "Home");

            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CreateNotification(Obavijest obavijest)
        {
            if (!await JeAdmin())
                return RedirectToAction("Index", "Home");

            obavijest.Datum = DateTime.UtcNow;

            _context.Obavijesti.Add(obavijest);
            await _context.SaveChangesAsync();

            if (obavijest.TipObavijesti == TipObavijesti.Popust ||
                obavijest.TipObavijesti == TipObavijesti.Novost)
            {
                var korisnici = await _context.Users
                    .Where(u => !string.IsNullOrEmpty(u.Email))
                    .ToListAsync();

                foreach (var korisnik in korisnici)
                {
                    await _emailService.SendEmailAsync(
                        korisnik.Email!,
                        $"The Last Key - {obavijest.Naslov}",
                        $@"
                        <div style='font-family: Arial, sans-serif; padding: 20px;'>
                            <h2 style='color:#233D4D;'>The Last Key</h2>
                            <h3 style='color:#FE7F2D;'>{obavijest.Naslov}</h3>
                            <p style='color:#233D4D; font-size:16px;'>{obavijest.Sadrzaj}</p>
                            <hr />
                            <p style='font-size:13px; color:#777;'>
                                Ovo je automatska obavijest sistema The Last Key.
                            </p>
                        </div>
                        "
                    );
                }
            }

            return RedirectToAction(nameof(Notifications));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            if (!await JeAdmin())
                return RedirectToAction("Index", "Home");

            var obavijest = await _context.Obavijesti.FindAsync(id);

            if (obavijest == null)
                return NotFound();

            _context.Obavijesti.Remove(obavijest);
            await _context.SaveChangesAsync();

            return RedirectToAction(nameof(Notifications));
        }

        [HttpGet]
        public async Task<IActionResult> EditNotification(int id)
        {
            if (!await JeAdmin())
                return RedirectToAction("Index", "Home");

            var obavijest = await _context.Obavijesti.FindAsync(id);

            if (obavijest == null)
                return NotFound();

            return View(obavijest);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EditNotification(Obavijest obavijest)
        {
            if (!await JeAdmin())
                return RedirectToAction("Index", "Home");

            if (ModelState.IsValid)
            {
                obavijest.Datum = DateTime.UtcNow;
                _context.Obavijesti.Update(obavijest);
                await _context.SaveChangesAsync();

                return RedirectToAction(nameof(Notifications));
            }

            return View(obavijest);
        }
        public async Task<IActionResult> Termini()
        {
            if (!await JeAdmin())
                return RedirectToAction("Index", "Home");

            var termini = await _context.Termini
                .Include(t => t.EscapeRoom)
                .ToListAsync();

            return View(termini);
        }
        [HttpGet]
        public async Task<IActionResult> CreateTermin()
        {
            if (!await JeAdmin())
                return RedirectToAction("Index", "Home");

            ViewBag.Rooms = await _context.EscapeRooms.ToListAsync();

            return View();
        }
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CreateTermin(Termin termin)
        {
            if (!await JeAdmin())
                return RedirectToAction("Index", "Home");

            ModelState.Remove("EscapeRoom");

            if (ModelState.IsValid)
            {
                termin.Datum = DateTime.SpecifyKind(termin.Datum, DateTimeKind.Utc);

                _context.Termini.Add(termin);
                await _context.SaveChangesAsync();

                return RedirectToAction(nameof(Termini));
            }

            ViewBag.Rooms = await _context.EscapeRooms.ToListAsync();
            return View(termin);
        }
        [HttpGet]
        public async Task<IActionResult> EditTermin(int id)
        {
            if (!await JeAdmin())
                return RedirectToAction("Index", "Home");

            var termin = await _context.Termini.FindAsync(id);

            if (termin == null)
                return NotFound();

            ViewBag.Rooms = await _context.EscapeRooms.ToListAsync();

            return View(termin);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EditTermin(Termin termin)
        {
            if (!await JeAdmin())
                return RedirectToAction("Index", "Home");

            ModelState.Remove("EscapeRoom");

            if (ModelState.IsValid)
            {
                termin.Datum = DateTime.SpecifyKind(termin.Datum, DateTimeKind.Utc);

                _context.Termini.Update(termin);
                await _context.SaveChangesAsync();

                return RedirectToAction(nameof(Termini));
            }

            ViewBag.Rooms = await _context.EscapeRooms.ToListAsync();
            return View(termin);
        }

        [HttpGet]
        public async Task<IActionResult> DeleteTermin(int id)
        {
            if (!await JeAdmin())
                return RedirectToAction("Index", "Home");

            var termin = await _context.Termini.FindAsync(id);

            if (termin == null)
                return NotFound();

            _context.Termini.Remove(termin);
            await _context.SaveChangesAsync();

            return RedirectToAction(nameof(Termini));
        }
        public async Task<IActionResult> Users()
        {
            if (!await JeAdmin())
                return RedirectToAction("Index", "Home");

            var korisnici = await _context.Users.ToListAsync();

            return View(korisnici);
        }
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ChangeUserRole(string id, Uloga uloga)
        {
            if (!await JeAdmin())
                return RedirectToAction("Index", "Home");

            var korisnik = await _context.Users.FindAsync(id);

            if (korisnik == null)
                return NotFound();

            korisnik.Uloga = uloga;

            _context.Users.Update(korisnik);
            await _context.SaveChangesAsync();

            return RedirectToAction(nameof(Users));
        }
        public async Task<IActionResult> ReservationDetails(int id)
        {
            if (!await JeAdmin())
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

        public async Task<IActionResult> Support()
        {
            if (!await JeAdmin())
                return RedirectToAction("Index", "Home");

            var podrske = await _context.Podrske.ToListAsync();

            return View(podrske);
        }
    }
}
