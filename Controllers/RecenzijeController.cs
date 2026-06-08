using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using Task6.Data;
using Task6.Models;
using Microsoft.AspNetCore.Identity;

namespace Task6.Controllers
{
    public class RecenzijeController : Controller
    {
        private readonly EscapeRoomDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public RecenzijeController(EscapeRoomDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        public IActionResult Index()
        {
            var recenzije = _context.Recenzije.ToList();

            return View(recenzije);
        }

        // GET: /Recenzije/Create
        public IActionResult Create()
        {
            return View();
        }

        // POST: /Recenzije/Create
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create(int roomId, double ocjena, string komentar)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            // Check if user has a completed reservation for this room
            var hasCompleted = await _context.Rezervacije
                .Include(r => r.Termin)
                .Where(r => r.KorisnikID == user.Id && r.Termin.RoomID == roomId && r.Status == true && r.Termin.Datum < System.DateTime.Now)
                .AnyAsync();

            if (!hasCompleted)
            {
                return BadRequest(new { message = "Samo korisnici koji su završili rezervaciju mogu ostaviti recenziju." });
            }

            var rec = new Recenzija { KorisnikID = user.Id, RoomID = roomId, Ocjena = ocjena, Komentar = komentar, Datum = System.DateTime.Now };
            _context.Recenzije.Add(rec);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Recenzija dodana." });
        }

        // POST: /Recenzije/Delete/5
        [HttpPost]
        [Authorize(Roles = "Admin,Zaposlenik")]
        public async Task<IActionResult> Delete(int id)
        {
            var rec = await _context.Recenzije.FindAsync(id);
            if (rec == null) return NotFound();
            _context.Recenzije.Remove(rec);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Recenzija obrisana." });
        }
    }
}