using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Task6.Data;
using Task6.Models;

namespace Task6.Controllers
{
    [Authorize]
    public class ReviewController : Controller
    {
        private readonly EscapeRoomDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public ReviewController(
            EscapeRoomDbContext context,
            UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        /*

        // GET: /Review/List/5
        [AllowAnonymous]
        public async Task<IActionResult> List(int roomId)
        {
            var room = await _context.EscapeRooms.FindAsync(roomId);


            if (room == null)
            {
                return NotFound();
            }

            var reviews = await _context.Recenzije
                .Where(r => r.RoomID == roomId)
                .Include(r => r.Korisnik)
                .OrderByDescending(r => r.Datum)
                .ToListAsync();

            ViewBag.Room = room;
            ViewBag.RoomId = roomId;
            ViewBag.AverageRating = reviews.Any() ? reviews.Average(r => r.Ocjena) : 0;

            return View(reviews);
        }

        */
        // GET: /Review/List/5
        [AllowAnonymous]
        public async Task<IActionResult> List(int roomId)
        {
            var room = await _context.EscapeRooms.FindAsync(roomId);
            if (room == null)
            {
                return NotFound();
            }

            var reviews = await _context.Recenzije
                .Where(r => r.RoomID == roomId)
                .Include(r => r.Korisnik)
                .OrderByDescending(r => r.Datum)
                .ToListAsync();

            ViewBag.Room = room;
            ViewBag.RoomId = roomId;
            ViewBag.AverageRating = reviews.Any()
                ? reviews.Average(r => r.Ocjena)
                : 0;

            return View(reviews);
        }




        // GET: /Review/Create/5
        public async Task<IActionResult> Create(int roomId)
        {
            var room = await _context.EscapeRooms.FindAsync(roomId);
            if (room == null)
            {
                return NotFound();
            }

            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return RedirectToAction("Login", "Account");
            }

            // Provjera da li je korisnik već dao recenziju za ovu sobu
            var existingReview = await _context.Recenzije
                .FirstOrDefaultAsync(r => r.RoomID == roomId && r.KorisnikID == user.Id);

            if (existingReview != null)
            {
                TempData["Message"] = "Već ste dali recenziju za ovu sobu!";
                return RedirectToAction(nameof(List), new { roomId = roomId });
            }

            // Provjera da li je korisnik imao zavrsenu rezervaciju za ovu sobu
            var hasCompletedReservation = await _context.Rezervacije
                .Include(r => r.Termin)
                .AnyAsync(r => r.KorisnikID == user.Id && r.Termin.RoomID == roomId && r.Status == true && r.Termin.Datum < DateTime.UtcNow);

            if (!hasCompletedReservation)
            {
                TempData["Error"] = "Možete ostaviti recenziju samo ako ste imali završenu rezervaciju za ovu sobu.";
                return RedirectToAction(nameof(List), new { roomId = roomId });
            }

            ViewBag.Room = room;
            return View();
        }




        // POST: /Review/Create
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(int roomId, Recenzija model)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return RedirectToAction("Login", "Account");
            }

            var room = await _context.EscapeRooms.FindAsync(roomId);
            if (room == null)
            {
                return NotFound();
            }

            // Provjera da li je korisnik imao završenu rezervaciju za ovu sobu
            var hasCompletedReservation = await _context.Rezervacije
                .Include(r => r.Termin)
                .AnyAsync(r =>
                    r.KorisnikID == user.Id &&
                    r.Termin.RoomID == roomId &&
                    r.Status &&
                    r.Termin.Datum < DateTime.UtcNow);

            if (!hasCompletedReservation)
            {
                TempData["Error"] = "Možete ostaviti recenziju samo ako ste imali završenu rezervaciju za ovu sobu.";
                return RedirectToAction(nameof(List), new { roomId });
            }

            // Provjera duplikata
            var existingReview = await _context.Recenzije
                .FirstOrDefaultAsync(r => r.RoomID == roomId && r.KorisnikID == user.Id);

            if (existingReview != null)
            {
                TempData["Error"] = "Već ste ostavili recenziju za ovu sobu.";
                return RedirectToAction(nameof(List), new { roomId });
            }

            // Postavi polja koja forma ne šalje, PRIJE validacije
            model.KorisnikID = user.Id;
            model.RoomID = roomId;
            model.Datum = DateTime.UtcNow;

            // Ukloni validaciju za navigaciona polja koja se ne popunjavaju iz forme
            ModelState.Remove(nameof(Recenzija.Korisnik));
            ModelState.Remove(nameof(Recenzija.EscapeRoom));
            ModelState.Remove(nameof(Recenzija.KorisnikID));
            ModelState.Remove(nameof(Recenzija.Datum));
            ModelState.Remove(nameof(Recenzija.RoomID));

            if (ModelState.IsValid)
            {
                _context.Recenzije.Add(model);
                await _context.SaveChangesAsync();

                TempData["Success"] = "Recenzija je uspješno kreirana!";
                return RedirectToAction(nameof(List), new { roomId = roomId });
            }

            ViewBag.Room = room;
            return View(model);
        }

        /* OBRISATI
        // GET: /Review/Edit/5
        public async Task<IActionResult> Edit(int id)
        {
            var review = await _context.Recenzije
                .Include(r => r.EscapeRoom)
                .FirstOrDefaultAsync(r => r.RecenzijaID == id);

            if (review == null)
            {
                return NotFound();
            }

            var user = await _userManager.GetUserAsync(User);
            if (review.KorisnikID != user.Id && !User.IsInRole("Admin"))
            {
                return Forbid();
            }

            ViewBag.Room = review.EscapeRoom;
            return View(review);
        }
        */

        /* obrisati

        // POST: /Review/Edit/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, Recenzija model)
        {
            if (id != model.RecenzijaID)
            {
                return NotFound();
            }

            var review = await _context.Recenzije.FindAsync(id);
            if (review == null)
            {
                return NotFound();
            }

            var user = await _userManager.GetUserAsync(User);
            if (review.KorisnikID != user.Id && !User.IsInRole("Admin"))
            {
                return Forbid();
            }

            if (ModelState.IsValid)
            {
                review.Ocjena = model.Ocjena;
                review.Komentar = model.Komentar;
                review.Datum = DateTime.UtcNow;

                _context.Update(review);
                await _context.SaveChangesAsync();

                TempData["Success"] = "Recenzija je uspješno ažurirana!";
                return RedirectToAction(nameof(List), new { roomId = review.RoomID });
            }

            ViewBag.Room = await _context.EscapeRooms.FindAsync(review.RoomID);
            return View(review);
        }

        */

        /* OBRISATI
        // GET: /Review/Delete/5
        public async Task<IActionResult> Delete(int id)
        {
            var review = await _context.Recenzije
                .Include(r => r.EscapeRoom)
                .FirstOrDefaultAsync(r => r.RecenzijaID == id);

            if (review == null)
            {
                return NotFound();
            }

            var user = await _userManager.GetUserAsync(User);
            if (review.KorisnikID != user.Id && !User.IsInRole("Admin"))
            {
                return Forbid();
            }

            return View(review);
        }

        */


        // POST: /Review/Delete/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(int id)
        {
            var review = await _context.Recenzije.FindAsync(id);
            if (review == null)
            {
                return NotFound();
            }

            var user = await _userManager.GetUserAsync(User);
            if (review.KorisnikID != user.Id && !User.IsInRole("Admin"))
            {
                return Forbid();
            }

            var roomId = review.RoomID;
            _context.Recenzije.Remove(review);
            await _context.SaveChangesAsync();

            TempData["Success"] = "Recenzija je uspješno obrisana!";
            return RedirectToAction(nameof(List), new { roomId = roomId });
        }



        // GET: /Review/MyReviews
        public async Task<IActionResult> MyReviews()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return RedirectToAction("Login", "Account");
            }



            var reviews = await _context.Recenzije
                .Where(r => r.KorisnikID == user.Id)
                .Include(r => r.EscapeRoom)
                .OrderByDescending(r => r.Datum)
                .ToListAsync();

            return View(reviews);
        }



        
    }
}
