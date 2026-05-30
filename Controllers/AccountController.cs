using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Task6.Models;
using Task6.ViewModels;

namespace Task6.Controllers
{
    [AllowAnonymous]
    public class AccountController : Controller
    {
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<AccountController> _logger;

        public AccountController(
            SignInManager<ApplicationUser> signInManager,
            UserManager<ApplicationUser> userManager,
            ILogger<AccountController> logger)
        {
            _signInManager = signInManager;
            _userManager = userManager;
            _logger = logger;
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

                var result = await _userManager.CreateAsync(user, model.Password);

                if (result.Succeeded)
                {
                    await _userManager.AddToRoleAsync(user, "Korisnik");
                    await _signInManager.SignInAsync(user, isPersistent: false);
                    return RedirectToAction("Index", "Home");
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
                // Try to locate user by email and sign in using their username to avoid mismatch
                var user = await _userManager.FindByEmailAsync(model.Email);
                if (user == null)
                {
                    _logger.LogInformation("Login failed: no user found with email {Email}", model.Email);
                    ModelState.AddModelError(string.Empty, "Pogrešna kombinacija korisničkog imena i lozinke.");
                    return View(model);
                }

                var result = await _signInManager.PasswordSignInAsync(user.UserName, model.Password, model.RememberMe, lockoutOnFailure: false);
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
        public IActionResult ForgotPassword()
        {
            return View();
        }

        // POST: /Account/ForgotPassword
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ForgotPassword(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                ModelState.AddModelError(string.Empty, "Email je obavezan.");
                return View();
            }

            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                // Don't reveal that the user does not exist
                ModelState.AddModelError(string.Empty, "Ako korisnik postoji, poslan je kod na email.");
                return View();
            }

            var rand = new Random();
            var code = rand.Next(100000, 999999).ToString();
            user.ResetCode = code;
            user.ResetCodeExpiry = DateTime.UtcNow.AddMinutes(15);
            await _userManager.UpdateAsync(user);

            // For now log the code to the debug output. In production send via email.
            System.Diagnostics.Debug.WriteLine($"Password reset code for {email}: {code}");

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

            var user = await _userManager.FindByEmailAsync(email);
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

            var user = await _userManager.FindByEmailAsync(email);
            if (user == null || user.ResetCode != code)
                return RedirectToAction(nameof(ForgotPassword));

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, token, newPassword);

            if (result.Succeeded)
            {
                user.ResetCode = null;
                user.ResetCodeExpiry = null;
                await _userManager.UpdateAsync(user);
                return RedirectToAction(nameof(Login));
            }

            foreach (var err in result.Errors)
            {
                ModelState.AddModelError(string.Empty, err.Description);
            }

            return View();
        }
    }
}
