using Microsoft.AspNetCore.Mvc;
using Task6.Data;
using Task6.Models;

namespace Task6.Controllers
{
    public class ObavijestiController : Controller
    {
        private readonly EscapeRoomDbContext _context;

        public ObavijestiController(EscapeRoomDbContext context)
        {
            _context = context;
        }

        public IActionResult Index()
        {
            var obavijesti = _context.Obavijesti.ToList();

            return View(obavijesti);
        }

        public IActionResult Create()
        {
            return View();
        }

        [HttpPost]
        public IActionResult Create(Obavijest obavijest)
        {
            if (ModelState.IsValid)
            {
                _context.Obavijesti.Add(obavijest);

                _context.SaveChanges();

                return RedirectToAction(nameof(Index));
            }

            return View(obavijest);
        }
    }
}