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

        // GET: /EscapeRoom/Details/5
        public async Task<IActionResult> Details(int id)
        {
            var room = await _context.EscapeRooms
                .Include(r => r.Recenzije)
                .ThenInclude(rc => rc.Korisnik)
                .FirstOrDefaultAsync(r => r.RoomID == id);

            if (room == null) return NotFound();

            var sada = DateTime.UtcNow;
            var danas = sada.Date;
            var trenutnoVrijeme = sada.ToString("HH:mm");

            var termini = await _context.Termini
                .Where(t => t.RoomID == id
                    && t.Dostupnost
                    && (
                        t.Datum.Date > danas ||
                        (t.Datum.Date == danas && string.Compare(t.Vrijeme, trenutnoVrijeme) > 0)
                    ))
                .OrderBy(t => t.Datum)
                .ThenBy(t => t.Vrijeme)
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