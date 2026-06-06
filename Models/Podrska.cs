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
        public string Email { get; set; } = null!;

        [Required]
        public DateTime Datum { get; set; }

        [Required]
        [StringLength(500)]
        public string Sadrzaj { get; set; } = null!;

        [Required]
        [StringLength(100)]
        public string NaslovPoruke { get; set; } = null!;

        public bool Odgovoreno { get; set; } = false;

        [StringLength(1000)]
        public string? Odgovor { get; set; }

        public DateTime? DatumOdgovora { get; set; }

        [ForeignKey(nameof(Korisnik))]
        public string KorisnikID { get; set; } = null!;

        public ApplicationUser Korisnik { get; set; } = null!;
    }
}