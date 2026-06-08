using System.ComponentModel.DataAnnotations;

namespace Task6.ViewModels
{
    public class RegisterViewModel
    {
        [Required(ErrorMessage = "Email je obavezan")]
        [EmailAddress(ErrorMessage = "Email nije validan")]
        [Display(Name = "Email")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Ime je obavezno")]
        [StringLength(30)]
        [Display(Name = "Ime")]
        public string Ime { get; set; }

        [Required(ErrorMessage = "Prezime je obavezno")]
        [StringLength(30)]
        [Display(Name = "Prezime")]
        public string Prezime { get; set; }

        [Required(ErrorMessage = "Lozinka je obavezna")]
        [StringLength(100, ErrorMessage = "Lozinka mora imati najmanje {2} karaktera", MinimumLength = 6)]
        [DataType(DataType.Password)]
        [Display(Name = "Lozinka")]
        public string Password { get; set; }

        [DataType(DataType.Password)]
        [Display(Name = "Potvrdite lozinku")]
        [Compare("Password", ErrorMessage = "Lozinke se ne poklapaju")]
        public string ConfirmPassword { get; set; }
    }
}
