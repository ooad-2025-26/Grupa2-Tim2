using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Task6.Models
{
    public class Recenzija
    {
        [Key]
        public int RecenzijaID { get; set; }

        public DateTime Datum { get; set; }

        [Required]
        [MaxLength(300)]
        public string Komentar { get; set; } = string.Empty;

        [Required]
        public string KorisnikID { get; set; } = string.Empty;

        [ForeignKey(nameof(KorisnikID))]
        public virtual ApplicationUser Korisnik { get; set; } = null!;

        public double Ocjena { get; set; }

        public int RoomID { get; set; }

        [ForeignKey(nameof(RoomID))]
        public virtual EscapeRoom EscapeRoom { get; set; } = null!;
    }
}