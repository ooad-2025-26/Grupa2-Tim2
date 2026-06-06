using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Task6.Data;
using Task6.Models;

namespace Task6.Controllers
{
    public class RoomController : Controller
    {
        private readonly EscapeRoomDbContext _context;

        public RoomController(EscapeRoomDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index(
            string? searchTerm,
            string? filterTezina,
            int? brojIgraca,
            DateTime? zeljeniDatum)
        {
            var roomsQuery = _context.EscapeRooms
                .Include(r => r.Recenzije)
                .Include(r => r.Termini)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var search = searchTerm.ToLower();

                roomsQuery = roomsQuery.Where(r =>
                    r.Naziv.ToLower().Contains(search) ||
                    r.Opis.ToLower().Contains(search));
            }

            if (!string.IsNullOrWhiteSpace(filterTezina) &&
                Enum.TryParse<Tezina>(filterTezina, out var tezina))
            {
                roomsQuery = roomsQuery.Where(r => r.Tezina == tezina);
            }

            if (brojIgraca.HasValue && brojIgraca.Value > 0)
            {
                roomsQuery = roomsQuery.Where(r => r.Kapacitet >= brojIgraca.Value);
            }

            if (zeljeniDatum.HasValue)
            {
                var datum = DateTime.SpecifyKind(zeljeniDatum.Value.Date, DateTimeKind.Utc);
                var sljedeciDan = datum.AddDays(1);

                roomsQuery = roomsQuery.Where(r =>
                    r.Termini.Any(t =>
                        t.Dostupnost &&
                        t.Datum >= datum &&
                        t.Datum < sljedeciDan));
            }

            ViewBag.SearchTerm = searchTerm;
            ViewBag.FilterTezina = filterTezina;
            ViewBag.BrojIgraca = brojIgraca;
            ViewBag.ZeljeniDatum = zeljeniDatum?.ToString("yyyy-MM-dd");

            var rooms = await roomsQuery.ToListAsync();

            return View(rooms);
        }

        public async Task<IActionResult> Details(int id)
        {
            var room = await _context.EscapeRooms
                .Include(r => r.Recenzije)
                    .ThenInclude(rc => rc.Korisnik)
                .FirstOrDefaultAsync(r => r.RoomID == id);

            if (room == null)
                return NotFound();

            var termini = await _context.Termini
                .Where(t => t.RoomID == id && t.Dostupnost)
                .OrderBy(t => t.Datum)
                .ThenBy(t => t.Vrijeme)
                .ToListAsync();

            ViewBag.Termini = termini;

            ViewBag.AverageRating = room.Recenzije.Any()
                ? room.Recenzije.Average(x => x.Ocjena)
                : 0.0;

            ViewBag.ReviewCount = room.Recenzije.Count;

            return View(room);
        }
    }
}