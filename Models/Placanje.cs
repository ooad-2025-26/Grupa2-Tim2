using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Task6.Models
{
    public class Placanje
    {
        [Key]
        public int PlacanjeID { get; set; }

        [Range(0, 10000)]
        public double Iznos { get; set; }

        [Required]
        public DateTime Datum { get; set; }

        public bool Status { get; set; }

        [ForeignKey("Rezervacija")]
        public int RezervacijaID { get; set; }

        public Rezervacija Rezervacija { get; set; }

        public Placanje() { }
    }
}