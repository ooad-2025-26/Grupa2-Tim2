using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;
using Task6.Data;
using Task6.Models;

namespace Task6.Controllers
{
    public class HomeController : Controller
    {
        private readonly EscapeRoomDbContext _context;

        public HomeController(EscapeRoomDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            var sobe = await _context.EscapeRooms
                .AsNoTracking()
                .Take(5)
                .ToListAsync();

            return View(sobe);
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel
            {
                RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier
            });
        }
    }
}