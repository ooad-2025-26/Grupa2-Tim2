using System;
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

        [Range(0, double.MaxValue, ErrorMessage = "Cijena ne smije biti negativna.")]
        public double Cijena { get; set; }

        // Discount fields
        public int DiscountPercent { get; set; } = 0;

        public DateTime? DiscountStart { get; set; }

        public DateTime? DiscountEnd { get; set; }

        public bool IsDiscountActive()
        {
            if (DiscountPercent <= 0) return false;
            if (!DiscountStart.HasValue || !DiscountEnd.HasValue) return false;
            var now = DateTime.UtcNow;
            return now >= DiscountStart.Value && now <= DiscountEnd.Value;
        }

        public double CurrentPrice => IsDiscountActive()
            ? Math.Round(Cijena * (1 - DiscountPercent / 100.0), 2)
            : Cijena;

        [MaxLength(500)]
        public string? ImageUrl { get; set; }

        // Navigation property for related reviews (recenzije)
        public virtual ICollection<Recenzija> Recenzije { get; set; } = new List<Recenzija>();

        // Navigation property for termini
        public virtual ICollection<Termin> Termini { get; set; } = new List<Termin>();
    }
}