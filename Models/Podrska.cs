using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Task6.Models
{
    public class Podrska
    {
        [Key]
        public int PorukaID { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public DateTime Datum { get; set; }

        [Required]
        [StringLength(500)]
        public string Sadrzaj { get; set; } = null!;

        [Required]
        [StringLength(100)]
        public string NaslovPoruke { get; set; } = null!;

        [ForeignKey(nameof(Korisnik))]
        public string KorisnikID { get; set; } = null!;

        public ApplicationUser Korisnik { get; set; } = null!;

        public Podrska() { }
    }
}