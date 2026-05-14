using Microsoft.AspNetCore.Mvc;
using Task6.Data;
using Task6.Models;

namespace Task6.Controllers
{
    public class KorisniciController : Controller
    {
        private readonly EscapeRoomDbContext _context;

        public KorisniciController(EscapeRoomDbContext context)
        {
            _context = context;
        }

        // PRIKAZ SVIH KORISNIKA
        public IActionResult Index()
        {
            var korisnici = _context.Korisnici.ToList();

            return View(korisnici);
        }

        // OTVARA FORMU
        public IActionResult Create()
        {
            return View();
        }

        // SPASAVA PODATKE
        [HttpPost]
        public IActionResult Create(Korisnik korisnik)
        {
            if (ModelState.IsValid)
            {
                _context.Korisnici.Add(korisnik);

                _context.SaveChanges();

                return RedirectToAction(nameof(Index));
            }

            return View(korisnik);
        }
    }
}