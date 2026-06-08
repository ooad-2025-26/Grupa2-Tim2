using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Task6.Data;
using Task6.Models;

namespace Task6.Controllers
{
    [Authorize]
    public class ProfilController : Controller
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly EscapeRoomDbContext _context;
        private readonly ILogger<ProfilController> _logger;

        public ProfilController(UserManager<ApplicationUser> userManager, EscapeRoomDbContext context, ILogger<ProfilController> logger)
        {
            _userManager = userManager;
            _context = context;
            _logger = logger;
        }

        public async Task<IActionResult> Index()
        {
            var user = await _userManager.GetUserAsync(User);
            _logger.LogInformation("Profil.Index invoked. HttpContext.User.Identity.IsAuthenticated={IsAuth}, Name={Name}", User.Identity.IsAuthenticated, User.Identity.Name);
            _logger.LogDebug("Profil.Index claims: {Claims}", string.Join(",", HttpContext.User.Claims.Select(c => c.Type + ":" + c.Value)));
            _logger.LogDebug("Request cookies: {Cookies}", string.Join(",", Request.Cookies.Select(c => c.Key + ":" + c.Value)));
            if (user == null) return RedirectToAction("Login", "Account");

            // Load all reservations for this user
            var rezervacije = await _context.Rezervacije
                .Include(r => r.Termin)
                    .ThenInclude(t => t.EscapeRoom)
                .Where(r => r.KorisnikID == user.Id)
                .OrderByDescending(r => r.DatumKreiranja)
                .ToListAsync();
            var placeneRezervacije = await _context.Placanja
    .Where(p => p.Status)
    .Select(p => p.RezervacijaID)
    .ToListAsync();

            ViewBag.PlaceneRezervacije = placeneRezervacije; 

            ViewBag.User = user;
            return View(rezervacije);
        }

        // GET: /Profil/Details/5
        public async Task<IActionResult> Details(int id)
        {
            var rez = await _context.Rezervacije
                .Include(r => r.Termin)
                    .ThenInclude(t => t.EscapeRoom)
                .FirstOrDefaultAsync(r => r.RezervacijaID == id);
            if (rez == null) return NotFound();

            var user = await _userManager.GetUserAsync(User);
            _logger.LogInformation("Profil.Details invoked for RezervacijaID={Id}. UserAuth={IsAuth}, UserName={Name}", id, User.Identity.IsAuthenticated, User.Identity.Name);
            if (user == null || rez.KorisnikID != user.Id) return Unauthorized();

            return View(rez);
        }

        // POST: /Profil/Cancel/5
        [HttpPost]
        public async Task<IActionResult> Cancel(int id)
        {
            var rez = await _context.Rezervacije.Include(r => r.Termin).FirstOrDefaultAsync(r => r.RezervacijaID == id);
            if (rez == null) return NotFound();

            var user = await _userManager.GetUserAsync(User);
            _logger.LogInformation("Profil.Cancel invoked for RezervacijaID={Id}. UserAuth={IsAuth}, UserName={Name}", id, User.Identity.IsAuthenticated, User.Identity.Name);
            if (user == null || rez.KorisnikID != user.Id) return Unauthorized();

            // Allow cancellation only if more than 24 hours remain
            if (rez.Termin != null && rez.Termin.Datum <= DateTime.Now.AddHours(24))
            {
                return BadRequest();
            }

            rez.Status = false;
            if (rez.Termin != null)
            {
                rez.Termin.Dostupnost = true;
            }

            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }
    }
}
