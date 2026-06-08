using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace Task6.Models
{
    public class ApplicationUser : IdentityUser
    {
        [Required]
        [StringLength(30)]
        public string Ime { get; set; } = null!;

        [Required]
        [StringLength(30)]
        public string Prezime { get; set; } = null!;

        [Required]
        public Uloga Uloga { get; set; }

        // Fields to support reset-via-code flow
        public string? ResetCode { get; set; }
        public DateTime? ResetCodeExpiry { get; set; }
    }
}