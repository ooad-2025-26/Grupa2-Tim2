using System.ComponentModel.DataAnnotations;

namespace Task6.Models
{
    public class Korisnik
    {
        [Key]
        public int KorisnikID { get; set; }

        [Required]
        [StringLength(30, MinimumLength = 3)]
        public string Username { get; set; }

        [Required]
        [StringLength(30)]
        public string Ime { get; set; }

        [Required]
        [StringLength(30)]
        public string Prezime { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [StringLength(20, MinimumLength = 6)]
        public string Lozinka { get; set; }

        [Required]
        public Uloga Uloga { get; set; }
    }
}