using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Task6.Models
{
    public class Recenzija
    {
        [Key]
        public int RecenzijaID { get; set; }

        [Range(1, 5)]
        public double Ocjena { get; set; }

        [StringLength(300)]
        public string Komentar { get; set; }

        [Required]
        public DateTime Datum { get; set; }

        [ForeignKey("Korisnik")]
        public int KorisnikID { get; set; }

        public Korisnik Korisnik { get; set; }

        [ForeignKey("EscapeRoom")]
        public int RoomID { get; set; }

        public EscapeRoom EscapeRoom { get; set; }

        public Recenzija() { }
    }
}