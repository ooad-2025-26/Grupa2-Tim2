using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Task6.Models
{
    public class EscapeRoom
    {
        [Key]
        public int RoomID { get; set; }

        [Required]
        [MaxLength(50)]
        public string Naziv { get; set; } = string.Empty;

        [Required]
        [MaxLength(300)]
        public string Opis { get; set; } = string.Empty;

        public Tezina Tezina { get; set; }

        public int Kapacitet { get; set; }

        public double Cijena { get; set; }

        // Navigation property for related reviews (recenzije)
        public virtual ICollection<Recenzija> Recenzije { get; set; } = new List<Recenzija>();

        // Navigation property for termini
        public virtual ICollection<Termin> Termini { get; set; } = new List<Termin>();
    }
}