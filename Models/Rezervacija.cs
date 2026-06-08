using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Task6.Models
{
    public class Rezervacija
    {
        [Key]
        public int RezervacijaID { get; set; }

        [Required]
        public DateTime DatumKreiranja { get; set; }

        public bool Status { get; set; }

        [Range(1, 10)]
        public int BrojOsoba { get; set; }

        [ForeignKey(nameof(Korisnik))]
        public string KorisnikID { get; set; } = null!;

        public ApplicationUser Korisnik { get; set; } = null!;

        [ForeignKey("Termin")]
        public int TerminID { get; set; }

        public Termin Termin { get; set; } = null!;

        public Rezervacija() { }
    }
}