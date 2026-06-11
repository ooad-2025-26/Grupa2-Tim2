using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Task6.Data;
using Task6.Models;
using Task6.Services;
using Task6.ViewModels;

namespace Task6.Controllers
{
    [Authorize]
    public class PopustiController : Controller
    {
        private readonly EscapeRoomDbContext _context;
        private readonly EmailService _emailService;

        public PopustiController(EscapeRoomDbContext context, EmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        private async Task<ApplicationUser?> GetCurrentUserAsync()
        {
            var email = User.Identity?.Name;
            if (string.IsNullOrEmpty(email))
                return null;

            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        private async Task<bool> JeAdmin()
        {
            var korisnik = await GetCurrentUserAsync();
            return korisnik != null && korisnik.Uloga == Uloga.Admin;
        }

        private async Task<bool> JeZaposlenik()
        {
            var korisnik = await GetCurrentUserAsync();
            return korisnik != null && korisnik.Uloga == Uloga.Zaposlenik;
        }

        public async Task<IActionResult> Index()
        {
            if (!await JeAdmin() && !await JeZaposlenik())
                return RedirectToAction("Index", "Home");

            var popusti = await _context.Obavijesti
                .Where(o => o.TipObavijesti == TipObavijesti.Popust)
                .OrderByDescending(o => o.Datum)
                .ToListAsync();

            return View(popusti);
        }

        [HttpGet]
        public async Task<IActionResult> Create()
        {
            if (!await JeAdmin() && !await JeZaposlenik())
                return RedirectToAction("Index", "Home");

            return View(new PopustViewModel());
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(PopustViewModel model)
        {
            if (!await JeAdmin() && !await JeZaposlenik())
                return RedirectToAction("Index", "Home");

            if (!ModelState.IsValid)
                return View(model);

            var obavijest = new Obavijest
            {
                Naslov = model.Naslov,
                Sadrzaj = model.Sadrzaj,
                TipObavijesti = TipObavijesti.Popust,
                Datum = DateTime.UtcNow
            };

            _context.Obavijesti.Add(obavijest);
            await _context.SaveChangesAsync();

            var korisnici = await _context.Users.Where(u => !string.IsNullOrEmpty(u.Email)).ToListAsync();
            foreach (var korisnik in korisnici)
            {
                var body = $@"
                    <div style='font-family: Arial, sans-serif; padding: 20px;'>
                        <h2 style='color:#233D4D;'>The Last Key</h2>
                        <h3 style='color:#FE7F2D;'>{obavijest.Naslov}</h3>
                        <p style='color:#233D4D; font-size:16px;'>{obavijest.Sadrzaj}</p>
                        <hr />
                        <p style='font-size:13px; color:#777;'>Ovo je automatska obavijest sistema The Last Key.</p>
                    </div>
                ";

                await _emailService.SendEmailAsync(korisnik.Email!, $"The Last Key - {obavijest.Naslov}", body);
            }

            TempData["SuccessMessage"] = "Popust je kreiran i korisnici su obaviješteni.";
            return RedirectToAction(nameof(Index));
        }

        [HttpGet("Popusti/Create/{escapeRoomId}")]
        [HttpGet("Popusti/CreateRoomDiscount")]
        public async Task<IActionResult> CreateRoomDiscount(int escapeRoomId)
        {
            if (!await JeAdmin() && !await JeZaposlenik())
                return RedirectToAction("Index", "Home");

            var room = await _context.EscapeRooms.FindAsync(escapeRoomId);
            if (room == null)
                return NotFound();

            var model = new RoomDiscountViewModel
            {
                EscapeRoomId = room.RoomID,
                EscapeRoomName = room.Naziv
            };

            return View("CreateRoomDiscount", model);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CreateRoomDiscount(RoomDiscountViewModel model)
        {
            if (!await JeAdmin() && !await JeZaposlenik())
                return RedirectToAction("Index", "Home");

            if (model.EndDate < model.StartDate)
            {
                ModelState.AddModelError("EndDate", "Datum završetka mora biti jednak ili nakon početka.");
            }

            if (!ModelState.IsValid)
            {
                if (model.EscapeRoomId != 0)
                {
                    var room = await _context.EscapeRooms.FindAsync(model.EscapeRoomId);
                    if (room != null)
                        model.EscapeRoomName = room.Naziv;
                }

                return View("CreateRoomDiscount", model);
            }

            var roomToUpdate = await _context.EscapeRooms.FindAsync(model.EscapeRoomId);
            if (roomToUpdate == null)
                return NotFound();

            roomToUpdate.DiscountPercent = model.DiscountPercent;
            roomToUpdate.DiscountStart = DateTime.SpecifyKind(model.StartDate.Value, DateTimeKind.Utc);
            roomToUpdate.DiscountEnd = DateTime.SpecifyKind(model.EndDate.Value, DateTimeKind.Utc);

            await _context.SaveChangesAsync();

            TempData["SuccessMessage"] = "Popust je spremljen za sobu.";

            if (await JeAdmin())
                return RedirectToAction("Rooms", "Admin");

            return RedirectToAction("Rooms", "Zaposlenik");
        }
    }
}
