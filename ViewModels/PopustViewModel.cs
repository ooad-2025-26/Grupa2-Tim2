using System.ComponentModel.DataAnnotations;
using Task6.Models;

namespace Task6.ViewModels
{
    public class PopustViewModel
    {
        [Required]
        [StringLength(100, ErrorMessage = "Naslov ne smije biti dulji od 100 znakova.")]
        public string Naslov { get; set; } = null!;

        [Required]
        [StringLength(500, ErrorMessage = "Sadržaj ne smije biti dulji od 500 znakova.")]
        public string Sadrzaj { get; set; } = null!;

        public TipObavijesti TipObavijesti { get; set; } = TipObavijesti.Popust;
    }
}
