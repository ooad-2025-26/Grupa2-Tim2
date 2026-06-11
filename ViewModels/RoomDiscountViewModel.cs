using System;
using System.ComponentModel.DataAnnotations;

namespace Task6.ViewModels
{
    public class RoomDiscountViewModel
    {
        [Required]
        public int EscapeRoomId { get; set; }

        public string EscapeRoomName { get; set; } = string.Empty;

        [Range(1, 100, ErrorMessage = "Popust mora biti između 1 i 100.")]
        public int DiscountPercent { get; set; }

        [Required(ErrorMessage = "Datum početka je obavezan.")]
        [DataType(DataType.Date)]
        public DateTime? StartDate { get; set; }

        [Required(ErrorMessage = "Datum završetka je obavezan.")]
        [DataType(DataType.Date)]
        public DateTime? EndDate { get; set; }
    }
}
