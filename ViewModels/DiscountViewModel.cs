using System;
using System.Collections.Generic;

namespace Task6.ViewModels
{
    public class DiscountViewModel
    {
        public List<int> SelectedRoomIds { get; set; } = new List<int>();

        public int DiscountPercent { get; set; }

        public DateTime? StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        public List<(int Id, string Naziv)> Rooms { get; set; } = new List<(int, string)>();
    }
}
