using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Task6.Data;
using System.Globalization;
using System.Text.RegularExpressions;
using Task6.Models;
using Task6.Services;
using Task6.ViewModels;

namespace Task6.Controllers
{
    [Authorize]
    public class ZaposlenikController : Controller
    {
        private readonly EscapeRoomDbContext _context;
        private readonly EmailService _emailService;
        private readonly SupabaseStorageService _storageService;

        public ZaposlenikController(EscapeRoomDbContext context, EmailService emailService, SupabaseStorageService storageService)
        {
            _context = context;
            _emailService = emailService;
            _storageService = storageService;
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

        public async Task<IActionResult> Rooms()
        {
            if (!await JeZaposlenik())
                return RedirectToAction("Index", "Home");

            var sobe = await _context.EscapeRooms.ToListAsync();
            return View(sobe);
        }

        [HttpGet]
        public async Task<IActionResult> CreateRoom()
        {
            if (!await JeZaposlenik())
                return RedirectToAction("Index", "Home");

            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CreateRoom(EscapeRoom room, IFormFile? imageFile)
        {
            if (!await JeZaposlenik())
                return RedirectToAction("Index", "Home");

            // validate raw input for decimal separator (only dot allowed) and non-negative
            ModelState.Remove("Cijena");
            var rawCijena = Request.Form["Cijena"].ToString();
            if (string.IsNullOrWhiteSpace(rawCijena) || !Regex.IsMatch(rawCijena, @"^\d+(\.\d+)?$"))
            {
                ModelState.AddModelError("Cijena", "Cijena mora biti nenegativan broj. Između brojeva smije biti samo tačka.");
            }
            else if (!double.TryParse(rawCijena, NumberStyles.AllowDecimalPoint, CultureInfo.InvariantCulture, out var parsedCijena) || parsedCijena < 0)
            {
                ModelState.AddModelError("Cijena", "Cijena mora biti nenegativan broj.");
            }
            else
            {
                room.Cijena = parsedCijena;
            }

            if (ModelState.IsValid)
            {
                if (imageFile != null && imageFile.Length > 0)
                {
                    var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp", "image/jpg" };
                    if (!allowedTypes.Contains(imageFile.ContentType.ToLower()))
                    {
                        ModelState.AddModelError("ImageUrl", "Dozvoljeni formati: JPG, PNG, WEBP");
                        return View(room);
                    }

                    if (imageFile.Length > 5 * 1024 * 1024)
                    {
                        ModelState.AddModelError("ImageUrl", "Slika ne smije biti veća od 5MB");
                        return View(room);
                    }

                    var imageUrl = await _storageService.UploadImageAsync(
                        imageFile.OpenReadStream(),
                        imageFile.FileName,
                        imageFile.ContentType
                    );

                    room.ImageUrl = imageUrl;
                }

                _context.EscapeRooms.Add(room);
                await _context.SaveChangesAsync();

                var korisnici = await _context.Users.Where(u => !string.IsNullOrEmpty(u.Email)).ToListAsync();
                foreach (var korisnik in korisnici)
                {
                    var body = $@"
                        <div style='font-family: Arial, sans-serif; padding: 20px;'>
                            <h2 style='color:#233D4D;'>The Last Key</h2>
                            <h3 style='color:#FE7F2D;'>Nova escape soba!</h3>
                            <p style='color:#233D4D; font-size:16px;'>Obavještavamo vas o novoj ponudi - dodana je nova escape soba: <strong>{room.Naziv}</strong>.</p>
                            <p style='color:#233D4D; font-size:16px;'>{room.Opis}</p>
                            <p style='color:#233D4D; font-size:16px;'><strong>Cijena:</strong> {room.Cijena} KM</p>
                            <hr />
                            <p style='font-size:13px; color:#777;'>Ovo je automatska obavijest sistema The Last Key.</p>
                        </div>
                    ";

                    await _emailService.SendEmailAsync(korisnik.Email!, $"The Last Key - Nova soba: {room.Naziv}", body);
                }

                return RedirectToAction(nameof(Rooms));
            }

            return View(room);
        }

        [HttpGet]
        public async Task<IActionResult> EditRoom(int id)
        {
            if (!await JeZaposlenik())
                return RedirectToAction("Index", "Home");

            var room = await _context.EscapeRooms.FindAsync(id);

            if (room == null)
                return NotFound();

            return View(room);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EditRoom(EscapeRoom room, IFormFile? imageFile)
        {
            if (!await JeZaposlenik())
                return RedirectToAction("Index", "Home");

            ModelState.Remove("Cijena");
            var rawCijena = Request.Form["Cijena"].ToString();
            if (string.IsNullOrWhiteSpace(rawCijena) || !Regex.IsMatch(rawCijena, @"^\d+(\.\d+)?$"))
            {
                ModelState.AddModelError("Cijena", "Cijena mora biti nenegativan broj. Između brojeva smije biti samo tačka.");
            }
            else if (!double.TryParse(rawCijena, NumberStyles.AllowDecimalPoint, CultureInfo.InvariantCulture, out var parsedCijena) || parsedCijena < 0)
            {
                ModelState.AddModelError("Cijena", "Cijena mora biti nenegativan broj.");
            }
            else
            {
                room.Cijena = parsedCijena;
            }

            if (ModelState.IsValid)
            {
                var existingRoom = await _context.EscapeRooms.AsNoTracking().FirstOrDefaultAsync(r => r.RoomID == room.RoomID);
                if (existingRoom == null) return NotFound();

                if (imageFile != null && imageFile.Length > 0)
                {
                    var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp", "image/jpg" };
                    if (!allowedTypes.Contains(imageFile.ContentType.ToLower()))
                    {
                        ModelState.AddModelError("ImageUrl", "Dozvoljeni formati: JPG, PNG, WEBP");
                        return View(room);
                    }

                    if (imageFile.Length > 5 * 1024 * 1024)
                    {
                        ModelState.AddModelError("ImageUrl", "Slika ne smije biti veća od 5MB");
                        return View(room);
                    }

                    if (!string.IsNullOrEmpty(existingRoom.ImageUrl))
                    {
                        await _storageService.DeleteImageAsync(existingRoom.ImageUrl);
                    }

                    var imageUrl = await _storageService.UploadImageAsync(
                        imageFile.OpenReadStream(),
                        imageFile.FileName,
                        imageFile.ContentType
                    );

                    room.ImageUrl = imageUrl;
                }
                else
                {
                    room.ImageUrl = existingRoom.ImageUrl;
                }

                _context.EscapeRooms.Update(room);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Rooms));
            }

            return View(room);
        }

        [HttpGet]
        public async Task<IActionResult> DeleteRoom(int id)
        {
            if (!await JeZaposlenik())
                return RedirectToAction("Index", "Home");

            var room = await _context.EscapeRooms.FindAsync(id);

            if (room == null)
                return NotFound();

            if (!string.IsNullOrEmpty(room.ImageUrl))
            {
                await _storageService.DeleteImageAsync(room.ImageUrl);
            }

            _context.EscapeRooms.Remove(room);
            await _context.SaveChangesAsync();

            return RedirectToAction(nameof(Rooms));
        }

        public async Task<IActionResult> Termini()
        {
            if (!await JeZaposlenik())
                return RedirectToAction("Index", "Home");

            var termini = await _context.Termini
                .Include(t => t.EscapeRoom)
                .OrderBy(t => t.Datum)
                .ToListAsync();

            return View(termini);
        }

        [HttpGet]
        public async Task<IActionResult> CreateTermin()
        {
            if (!await JeZaposlenik())
                return RedirectToAction("Index", "Home");

            ViewBag.Rooms = await _context.EscapeRooms.ToListAsync();
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CreateTermin(Termin termin)
        {
            if (!await JeZaposlenik())
                return RedirectToAction("Index", "Home");

            ModelState.Remove("EscapeRoom");

            var terminDateTime = termin.Datum.Date;
            if (TimeSpan.TryParse(termin.Vrijeme, out var terminVrijeme))
            {
                terminDateTime = terminDateTime.Add(terminVrijeme);
            }

            if (terminDateTime < DateTime.Now)
            {
                ModelState.AddModelError(string.Empty, "Ne možete kreirati termin koji je u prošlosti.");
            }

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
            if (!await JeZaposlenik())
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
            if (!await JeZaposlenik())
                return RedirectToAction("Index", "Home");

            ModelState.Remove("EscapeRoom");

            var terminDateTime = termin.Datum.Date;
            if (TimeSpan.TryParse(termin.Vrijeme, out var terminVrijeme))
            {
                terminDateTime = terminDateTime.Add(terminVrijeme);
            }

            if (terminDateTime < DateTime.Now)
            {
                ModelState.AddModelError(string.Empty, "Ne možete postaviti termin koji je u prošlosti.");
            }

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
            if (!await JeZaposlenik())
                return RedirectToAction("Index", "Home");

            var termin = await _context.Termini.FindAsync(id);

            if (termin == null)
                return NotFound();

            _context.Termini.Remove(termin);
            await _context.SaveChangesAsync();

            return RedirectToAction(nameof(Termini));
        }

        public async Task<IActionResult> Notifications()
        {
            if (!await JeZaposlenik())
                return RedirectToAction("Index", "Home");

            var obavijesti = await _context.Obavijesti
                .OrderByDescending(o => o.Datum)
                .ToListAsync();

            return View(obavijesti);
        }

        [HttpGet]
        public async Task<IActionResult> CreateNotification()
        {
            if (!await JeZaposlenik())
                return RedirectToAction("Index", "Home");

            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CreateNotification(Obavijest obavijest)
        {
            if (!await JeZaposlenik())
                return RedirectToAction("Index", "Home");

            obavijest.Datum = DateTime.UtcNow;

            _context.Obavijesti.Add(obavijest);
            await _context.SaveChangesAsync();

            return RedirectToAction(nameof(Notifications));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            if (!await JeZaposlenik())
                return RedirectToAction("Index", "Home");

            var obavijest = await _context.Obavijesti.FindAsync(id);

            if (obavijest == null)
                return NotFound();

            _context.Obavijesti.Remove(obavijest);
            await _context.SaveChangesAsync();

            return RedirectToAction(nameof(Notifications));
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

        [HttpGet]
        public async Task<IActionResult> Popusti()
        {
            if (!await JeZaposlenik())
                return RedirectToAction("Index", "Home");

            var rooms = await _context.EscapeRooms.ToListAsync();
            var vm = new DiscountViewModel();
            vm.Rooms = rooms.Select(r => (r.RoomID, r.Naziv)).ToList();
            return View(vm);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Popusti(DiscountViewModel model)
        {
            if (!await JeZaposlenik())
                return RedirectToAction("Index", "Home");

            if (model.DiscountPercent < 0 || model.DiscountPercent > 100)
            {
                ModelState.AddModelError("DiscountPercent", "Popust mora biti između 0 i 100.");
            }

            if (!model.StartDate.HasValue || !model.EndDate.HasValue || model.StartDate.Value >= model.EndDate.Value)
            {
                ModelState.AddModelError(string.Empty, "Neispravan vremenski period za popust.");
            }

            if (!model.SelectedRoomIds.Any())
            {
                ModelState.AddModelError(string.Empty, "Odaberite barem jednu sobu.");
            }

            if (!ModelState.IsValid)
            {
                var rooms = await _context.EscapeRooms.ToListAsync();
                model.Rooms = rooms.Select(r => (r.RoomID, r.Naziv)).ToList();
                return View(model);
            }

            var roomsToUpdate = await _context.EscapeRooms
                .Where(r => model.SelectedRoomIds.Contains(r.RoomID))
                .ToListAsync();

            foreach (var room in roomsToUpdate)
            {
                room.DiscountPercent = model.DiscountPercent;
                room.DiscountStart = DateTime.SpecifyKind(model.StartDate.Value, DateTimeKind.Utc);
                room.DiscountEnd = DateTime.SpecifyKind(model.EndDate.Value, DateTimeKind.Utc);
            }

            await _context.SaveChangesAsync();

            var korisnici = await _context.Users.Where(u => !string.IsNullOrEmpty(u.Email)).ToListAsync();

            foreach (var korisnik in korisnici)
            {
                var body = $"<div style='font-family: Arial, sans-serif; padding:20px;'><h2 style='color:#233D4D;'>The Last Key</h2><h3 style='color:#FE7F2D;'>Novi popust</h3>";
                body += "<p style='color:#233D4D; font-size:16px;'>Imamo posebnu ponudu za vas! Na sljedeće escape sobe trenutno vrijedi popust:</p>";
                body += "<ul>";
                foreach (var room in roomsToUpdate)
                {
                    var newPrice = Math.Round(room.Cijena * (1 - model.DiscountPercent / 100.0), 2);
                    body += $"<li><strong>{room.Naziv}</strong>: <s>{room.Cijena} KM</s> -> {newPrice} KM ({model.DiscountPercent}% )</li>";
                }
                body += "</ul>";
                body += $"<p>Popust vrijedi od {model.StartDate.Value:dd.MM.yyyy} do {model.EndDate.Value:dd.MM.yyyy}.</p></div>";

                await _emailService.SendEmailAsync(korisnik.Email!, "The Last Key - Novi popust", body);
            }

            TempData["DiscountSuccess"] = "Popust je primijenjen i svi korisnici su obaviješteni.";
            return RedirectToAction(nameof(Popusti));
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

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Cancel(int id)
        {
            if (!await JeZaposlenik())
                return RedirectToAction("Index", "Home");

            var rez = await _context.Rezervacije
                .Include(r => r.Termin)
                    .ThenInclude(t => t.EscapeRoom)
                .Include(r => r.Korisnik)
                .FirstOrDefaultAsync(r => r.RezervacijaID == id);

            if (rez == null)
                return NotFound();

            var bilaAktivna = rez.Status;

            if (rez.Termin != null)
                rez.Termin.Dostupnost = true;

            if (bilaAktivna && !string.IsNullOrEmpty(rez.Korisnik?.Email))
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

            _context.Rezervacije.Remove(rez);
            await _context.SaveChangesAsync();

            TempData["CancelSuccess"] = "Rezervacija je uspješno otkazana i izbrisana.";
            return RedirectToAction(nameof(Reservations));
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