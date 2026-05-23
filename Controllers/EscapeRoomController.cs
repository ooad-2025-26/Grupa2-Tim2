using Microsoft.AspNetCore.Mvc;
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
    }
}