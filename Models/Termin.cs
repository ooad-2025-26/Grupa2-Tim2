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
        [RegularExpression(@"^([01]\d|2[0-3]):[0-5]\d$", ErrorMessage = "Vrijeme mora biti u formatu HH:mm (npr. 14:30).")]
        public string Vrijeme { get; set; } = null!;

        public bool Dostupnost { get; set; }

        [ForeignKey("EscapeRoom")]
        public int RoomID { get; set; }

        public EscapeRoom EscapeRoom { get; set; } = null!;

        public Termin() { }
    }
}