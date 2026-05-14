using Microsoft.AspNetCore.Mvc;
using Task6.Data;
using Task6.Models;

namespace Task6.Controllers
{
    public class RecenzijeController : Controller
    {
        private readonly EscapeRoomDbContext _context;

        public RecenzijeController(EscapeRoomDbContext context)
        {
            _context = context;
        }

        public IActionResult Index()
        {
            var recenzije = _context.Recenzije.ToList();

            return View(recenzije);
        }

        public IActionResult Create()
        {
            return View();
        }

        [HttpPost]
        public IActionResult Create(Recenzija recenzija)
        {
            if (ModelState.IsValid)
            {
                _context.Recenzije.Add(recenzija);

                _context.SaveChanges();

                return RedirectToAction(nameof(Index));
            }

            return View(recenzija);
        }
    }
}