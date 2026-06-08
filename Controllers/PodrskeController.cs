using Microsoft.AspNetCore.Mvc;
using Task6.Data;
using Task6.Models;

namespace Task6.Controllers
{
    public class PodrskeController : Controller
    {
        private readonly EscapeRoomDbContext _context;

        public PodrskeController(EscapeRoomDbContext context)
        {
            _context = context;
        }

        public IActionResult Index()
        {
            var podrske = _context.Podrske.ToList();

            return View(podrske);
        }

        public IActionResult Create()
        {
            return View();
        }

        [HttpPost]
        public IActionResult Create(Podrska podrska)
        {
            if (ModelState.IsValid)
            {
                _context.Podrske.Add(podrska);

                _context.SaveChanges();

                return RedirectToAction(nameof(Index));
            }

            return View(podrska);
        }
    }
}