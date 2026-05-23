using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace Task6.Models
{
    public class ApplicationUser : IdentityUser
    {
        [Required]
        [StringLength(30)]
        public string Ime { get; set; }

        [Required]
        [StringLength(30)]
        public string Prezime { get; set; }

        [Required]
        public Uloga Uloga { get; set; }
    }
}