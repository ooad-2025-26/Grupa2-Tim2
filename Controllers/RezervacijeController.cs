using Microsoft.AspNetCore.Mvc;
using Task6.Data;
using Task6.Models;

namespace Task6.Controllers
{
    public class RezervacijeController : Controller
    {
        private readonly EscapeRoomDbContext _context;

        public RezervacijeController(EscapeRoomDbContext context)
        {
            _context = context;
        }

        public IActionResult Index()
        {
            var rezervacije = _context.Rezervacije.ToList();

            return View(rezervacije);
        }

        public IActionResult Create()
        {
            return View();
        }

        [HttpPost]
        public IActionResult Create(Rezervacija rezervacija)
        {
            if (ModelState.IsValid)
            {
                _context.Rezervacije.Add(rezervacija);

                _context.SaveChanges();

                return RedirectToAction(nameof(Index));
            }

            return View(rezervacija);
        }
    }
}