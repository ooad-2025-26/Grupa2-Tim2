using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Task6.Data;
using Task6.Models;

namespace Task6.Controllers
{
    [Authorize]
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

        // GET: /Support/Contact
        [AllowAnonymous]
        public IActionResult Contact()
        {
            return View();
        }

        // POST: /Support/Contact
        [HttpPost]
        [ValidateAntiForgeryToken]
        [AllowAnonymous]
        public async Task<IActionResult> Contact(Podrska model)
        {
            if (ModelState.IsValid)
            {
                var user = await _userManager.GetUserAsync(User);

                var support = new Podrska
                {
                    NaslovPoruke = model.NaslovPoruke,
                    Sadrzaj = model.Sadrzaj,
                    Email = model.Email,
                    Datum = DateTime.Now,
                    KorisnikID = user?.Id
                };

                _context.Podrske.Add(support);
                await _context.SaveChangesAsync();

                TempData["Success"] = "Vaša poruka je uspješno poslana! Uskoro ćemo vam odgovoriti.";
                return RedirectToAction("Index", "Home");
            }

            return View(model);
        }
    }
}
