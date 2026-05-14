using Microsoft.AspNetCore.Mvc;
using Task6.Data;
using Task6.Models;

namespace Task6.Controllers
{
    public class TerminiController : Controller
    {
        private readonly EscapeRoomDbContext _context;

        public TerminiController(EscapeRoomDbContext context)
        {
            _context = context;
        }

        public IActionResult Index()
        {
            var termini = _context.Termini.ToList();

            return View(termini);
        }

        public IActionResult Create()
        {
            return View();
        }

        [HttpPost]
        public IActionResult Create(Termin termin)
        {
            if (ModelState.IsValid)
            {
                _context.Termini.Add(termin);

                _context.SaveChanges();

                return RedirectToAction(nameof(Index));
            }

            return View(termin);
        }
    }
}