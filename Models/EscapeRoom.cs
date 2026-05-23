using System.ComponentModel.DataAnnotations;

namespace Task6.Models
{
    public class EscapeRoom
    {
        [Key]
        public int RoomID { get; set; }

        [Required]
        [StringLength(50, MinimumLength = 3)]
        public string Naziv { get; set; }

        [Required]
        [StringLength(300)]
        public string Opis { get; set; }

        [Required]
        public Tezina Tezina { get; set; }

        [Range(1, 20)]
        public int Kapacitet { get; set; }

        [Range(0, 1000)]
        public double Cijena { get; set; }

        public EscapeRoom() { }
    }
}