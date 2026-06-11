using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Task6.Models;
using Task6.ViewModels;
using Task6.Services;

namespace Task6.Controllers
{
    [AllowAnonymous]
    public class AccountController : Controller
    {
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<AccountController> _logger;
        private readonly EmailService _emailService;

        private const string DbErrorMessage = "Došlo je do problema sa bazom podataka. Pokušajte ponovo kasnije.";

        public AccountController(
            SignInManager<ApplicationUser> signInManager,
            UserManager<ApplicationUser> userManager,
            ILogger<AccountController> logger,
            EmailService emailService)
        {
            _signInManager = signInManager;
            _userManager = userManager;
            _logger = logger;
            _emailService = emailService;
        }

        // GET: /Account/Register
        [HttpGet]
        public IActionResult Register()
        {
            if (User.Identity.IsAuthenticated)
                return RedirectToAction("Index", "Home");
            return View();
        }

        // POST: /Account/Register
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Register(RegisterViewModel model)
        {
            if (ModelState.IsValid)
            {
                var user = new ApplicationUser
                {
                    UserName = model.Email,
                    Email = model.Email,
                    Ime = model.Ime,
                    Prezime = model.Prezime,
                    Uloga = Uloga.Korisnik
                };

                IdentityResult result;
                try
                {
                    result = await _userManager.CreateAsync(user, model.Password);

                    if (result.Succeeded)
                    {
                        await _userManager.AddToRoleAsync(user, "Korisnik");
                        await _signInManager.SignInAsync(user, isPersistent: false);
                        return RedirectToAction("Index", "Home");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Greška u bazi podataka prilikom registracije korisnika {Email}", model.Email);
                    ModelState.AddModelError(string.Empty, DbErrorMessage);
                    return View(model);
                }

                foreach (var error in result.Errors)
                {
                    ModelState.AddModelError(string.Empty, error.Description);
                }
            }

            return View(model);
        }

        // GET: /Account/Login
        [HttpGet]
        public IActionResult Login(string returnUrl = null)
        {
            if (User.Identity.IsAuthenticated)
                return RedirectToAction("Index", "Home");

            ViewData["ReturnUrl"] = returnUrl;
            return View();
        }

        // POST: /Account/Login
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login(LoginViewModel model, string returnUrl = null)
        {
            ViewData["ReturnUrl"] = returnUrl;

            if (ModelState.IsValid)
            {
                ApplicationUser? user;
                Microsoft.AspNetCore.Identity.SignInResult result;
                try
                {
                    // Try to locate user by email and sign in using their username to avoid mismatch
                    user = await _userManager.FindByEmailAsync(model.Email);
                    if (user == null)
                    {
                        _logger.LogInformation("Login failed: no user found with email {Email}", model.Email);
                        ModelState.AddModelError(string.Empty, "Pogrešna kombinacija korisničkog imena i lozinke.");
                        return View(model);
                    }

                    result = await _signInManager.PasswordSignInAsync(user.UserName, model.Password, model.RememberMe, lockoutOnFailure: false);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Greška u bazi podataka prilikom prijave korisnika {Email}", model.Email);
                    ModelState.AddModelError(string.Empty, DbErrorMessage);
                    return View(model);
                }

                _logger.LogInformation("PasswordSignInAsync result for {Email}: Succeeded={Succeeded}, IsLockedOut={LockedOut}, RequiresTwoFactor={TwoFactor}", model.Email, result.Succeeded, result.IsLockedOut, result.RequiresTwoFactor);

                if (result.Succeeded)
                {
                    _logger.LogInformation("Login succeeded for {Email}. HttpContext.User.Identity.IsAuthenticated={IsAuth}", model.Email, User.Identity.IsAuthenticated);
                    _logger.LogDebug("HttpContext.User claims after sign-in: {Claims}", string.Join(",", HttpContext.User.Claims.Select(c => c.Type + ":" + c.Value)));
                    return RedirectToLocal(returnUrl);
                }

                if (result.IsLockedOut)
                {
                    ModelState.AddModelError(string.Empty, "Račun je zaključan.");
                }
                else if (result.RequiresTwoFactor)
                {
                    ModelState.AddModelError(string.Empty, "Za prijavu je potrebna dvostepena provjera.");
                }
                else
                {
                    ModelState.AddModelError(string.Empty, "Pogrešna kombinacija korisničkog imena i lozinke.");
                }
            }

            return View(model);
        }

        // POST: /Account/Logout
        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            await _signInManager.SignOutAsync();
            return RedirectToAction("Index", "Home");
        }

        private IActionResult RedirectToLocal(string returnUrl)
        {
            if (Url.IsLocalUrl(returnUrl))
            {
                return Redirect(returnUrl);
            }
            else
            {
                return RedirectToAction("Index", "Home");
            }
        }

        // GET: /Account/ForgotPassword
        [HttpGet]
        [ActionName("ForgotPassword")]
        public IActionResult ForgotPasswordGet(string? email = null)
        {
            ViewBag.Email = email;
            return View("ForgotPassword");
        }

        // POST: /Account/ForgotPassword
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ForgotPassword(string email)
        {
            ViewBag.Email = email;

            if (string.IsNullOrWhiteSpace(email))
            {
                ModelState.AddModelError(string.Empty, "Email je obavezan.");
                return View();
            }

            ApplicationUser? user;
            try
            {
                user = await _userManager.FindByEmailAsync(email);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Greška u bazi podataka prilikom pretrage korisnika sa emailom {Email}", email);
                ModelState.AddModelError(string.Empty, DbErrorMessage);
                return View();
            }

            if (user == null)
            {
                ModelState.AddModelError(string.Empty, "Korisnički račun sa ovim emailom ne postoji.");
                return View();
            }

            var rand = new Random();
            var code = rand.Next(100000, 999999).ToString();
            user.ResetCode = code;
            user.ResetCodeExpiry = DateTime.UtcNow.AddMinutes(15);

            try
            {
                await _userManager.UpdateAsync(user);

                // For now log the code to the debug output. In production send via email.
                await _emailService.SendEmailAsync(
        email,
        "The Last Key - Kod za promjenu lozinke",
        $@"
        <h2>The Last Key</h2>
        <p>Vaš kod za promjenu lozinke je:</p>
        <h1 style='color:#FE7F2D;'>{code}</h1>
        <p>Kod važi 15 minuta.</p>
        "
    );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Greška u bazi podataka prilikom slanja koda za promjenu lozinke za email {Email}", email);
                ModelState.AddModelError(string.Empty, DbErrorMessage);
                return View();
            }

            TempData["ResetEmail"] = email;
            return RedirectToAction(nameof(VerifyResetCode));
        }

        // GET: /Account/VerifyResetCode
        [HttpGet]
        public IActionResult VerifyResetCode()
        {
            ViewBag.Email = TempData.Peek("ResetEmail");
            return View();
        }

        // POST: /Account/VerifyResetCode
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> VerifyResetCode(string email, string code)
        {
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(code))
            {
                ModelState.AddModelError(string.Empty, "Email i kod su obavezni.");
                ViewBag.Email = email;
                return View();
            }

            ApplicationUser? user;
            try
            {
                user = await _userManager.FindByEmailAsync(email);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Greška u bazi podataka prilikom provjere koda za email {Email}", email);
                ModelState.AddModelError(string.Empty, DbErrorMessage);
                ViewBag.Email = email;
                return View();
            }

            if (user == null || user.ResetCode != code || user.ResetCodeExpiry == null || user.ResetCodeExpiry < DateTime.UtcNow)
            {
                ModelState.AddModelError(string.Empty, "Neispravan ili istekao kod.");
                ViewBag.Email = email;
                return View();
            }

            TempData["ResetEmail"] = email;
            TempData["ResetValidatedCode"] = code;
            return RedirectToAction(nameof(ResetNewPassword));
        }

        // GET: /Account/ResetNewPassword
        [HttpGet]
        public IActionResult ResetNewPassword()
        {
            if (TempData.Peek("ResetValidatedCode") == null)
                return RedirectToAction(nameof(ForgotPassword));

            return View();
        }

        // POST: /Account/ResetNewPassword
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ResetNewPassword(string newPassword, string confirmNewPassword)
        {
            var email = TempData["ResetEmail"] as string;
            var code = TempData["ResetValidatedCode"] as string;

            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(code))
                return RedirectToAction(nameof(ForgotPassword));

            if (newPassword != confirmNewPassword)
            {
                ModelState.AddModelError(string.Empty, "Lozinke se ne poklapaju.");
                return View();
            }

            ApplicationUser? user;
            IdentityResult result;
            try
            {
                user = await _userManager.FindByEmailAsync(email);
                if (user == null || user.ResetCode != code)
                    return RedirectToAction(nameof(ForgotPassword));

                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                result = await _userManager.ResetPasswordAsync(user, token, newPassword);

                if (result.Succeeded)
                {
                    user.ResetCode = null;
                    user.ResetCodeExpiry = null;
                    await _userManager.UpdateAsync(user);
                    return RedirectToAction(nameof(Login));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Greška u bazi podataka prilikom postavljanja nove lozinke za email {Email}", email);
                ModelState.AddModelError(string.Empty, DbErrorMessage);
                return View();
            }

            foreach (var err in result.Errors)
            {
                ModelState.AddModelError(string.Empty, err.Description);
            }

            return View();
        }
    }
}
