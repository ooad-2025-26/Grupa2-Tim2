using System.ComponentModel.DataAnnotations;

namespace Task6.Models
{
    public class Obavijest
    {
        [Key]
        public int ObavijestID { get; set; }

        [Required]
        [StringLength(100)]
        public string Naslov { get; set; }

        [Required]
        [StringLength(500)]
        public string Sadrzaj { get; set; }

        [Required]
        public DateTime Datum { get; set; }

        [Required]
        public TipObavijesti TipObavijesti { get; set; }

        public Obavijest() { }
    }
}