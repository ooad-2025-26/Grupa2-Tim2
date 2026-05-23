using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Task6.Models;

namespace Task6.Controllers
{
    public class KorisniciController : Controller
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public KorisniciController(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
        }

        public IActionResult Index()
        {
            var korisnici = _userManager.Users.ToList();
            return View(korisnici);
        }

        public IActionResult Create()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Create(ApplicationUser korisnik, string lozinka)
        {
            if (ModelState.IsValid)
            {
                korisnik.UserName = korisnik.Email;

                var rezultat = await _userManager.CreateAsync(korisnik, lozinka);

                if (rezultat.Succeeded)
                    return RedirectToAction(nameof(Index));

                foreach (var greska in rezultat.Errors)
                    ModelState.AddModelError("", greska.Description);
            }

            return View(korisnik);
        }
    }
}