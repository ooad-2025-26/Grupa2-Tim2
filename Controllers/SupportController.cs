using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Task6.Data;
using Task6.Models;

namespace Task6.Controllers
{
    public class SupportController : Controller
    {
        private readonly EscapeRoomDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public SupportController(
            EscapeRoomDbContext context,
            UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> Contact(string source)
        {
            ViewBag.Source = source;

            var user = await _userManager.GetUserAsync(User);

            if (user == null)
                return RedirectToAction("Login", "Account");

            ViewBag.Email = user.Email;

            return View();
        }

        [HttpPost]
        [Authorize]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Contact(Podrska model)
        {
            var user = await _userManager.GetUserAsync(User);

            if (user == null)
                return RedirectToAction("Login", "Account");

            ModelState.Remove("Korisnik");
            ModelState.Remove("KorisnikID");
            ModelState.Remove("Email");

            if (ModelState.IsValid)
            {
                var support = new Podrska
                {
                    NaslovPoruke = model.NaslovPoruke,
                    Sadrzaj = model.Sadrzaj,
                    Email = user.Email ?? "",
                    Datum = DateTime.UtcNow,
                    KorisnikID = user.Id,
                    Odgovoreno = false,
                    Odgovor = null,
                    DatumOdgovora = null
                };

                _context.Podrske.Add(support);
                await _context.SaveChangesAsync();

                TempData["SupportSuccess"] = "Vaša poruka je uspješno poslana! Odgovor ćete dobiti putem emaila.";

                return RedirectToAction("Index", "Profil");
            }

            ViewBag.Email = user.Email;
            return View(model);
        }
    }
}