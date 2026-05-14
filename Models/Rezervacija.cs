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

        [ForeignKey("Korisnik")]
        public int KorisnikID { get; set; }

        public Korisnik Korisnik { get; set; }

        [ForeignKey("Termin")]
        public int TerminID { get; set; }

        public Termin Termin { get; set; }

        public Rezervacija() { }
    }
}