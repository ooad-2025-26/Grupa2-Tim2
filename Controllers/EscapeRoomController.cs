using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using Task6.Data;
using Task6.Models;

namespace Task6.Controllers
{
    public class EscapeRoomsController : Controller
    {
        private readonly EscapeRoomDbContext _context;

        public EscapeRoomsController(EscapeRoomDbContext context)
        {
            _context = context;
        }

        public IActionResult Index()
        {
            var sobe = _context.EscapeRooms.ToList();

            return View(sobe);
        }

        public IActionResult Create()
        {
            return View();
        }

        [HttpPost]
        public IActionResult Create(EscapeRoom room)
        {
            if (ModelState.IsValid)
            {
                _context.EscapeRooms.Add(room);

                _context.SaveChanges();

                return RedirectToAction(nameof(Index));
            }

            return View(room);
        }

        // GET: /EscapeRoom/Details/5
        public async Task<IActionResult> Details(int id)
        {
            var room = await _context.EscapeRooms
                .Include(r => r.Recenzije)
                .ThenInclude(rc => rc.Korisnik)
                .FirstOrDefaultAsync(r => r.RoomID == id);

            if (room == null) return NotFound();

            var termini = await _context.Termini
                .Where(t => t.RoomID == id && t.Dostupnost)
                .OrderBy(t => t.Datum)
                .ToListAsync();

            ViewBag.Termini = termini;

            var avg = 0.0;
            var count = 0;

            if (room.Recenzije != null && room.Recenzije.Any())
            {
                count = room.Recenzije.Count;
                avg = room.Recenzije.Average(x => x.Ocjena);
            }

            ViewBag.AverageRating = avg;
            ViewBag.ReviewCount = count;

            return View(room);
        }
    }
}