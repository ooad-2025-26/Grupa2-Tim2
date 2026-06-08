using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Task6.Models
{
    public class Termin
    {
        [Key]
        public int TerminID { get; set; }

        [Required]
        public DateTime Datum { get; set; }

        [Required]
        public string Vrijeme { get; set; } = null!;

        public bool Dostupnost { get; set; }

        [ForeignKey("EscapeRoom")]
        public int RoomID { get; set; }

        public EscapeRoom EscapeRoom { get; set; } = null!;

        public Termin() { }
    }
}