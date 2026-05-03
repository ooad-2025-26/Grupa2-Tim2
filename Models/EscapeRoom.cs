using System.ComponentModel.DataAnnotations;
using Task6.Models;

public class EscapeRoom
{
    [Key]
    public int RoomID { get; set; }

    public string Naziv { get; set; }
    public string Opis { get; set; }
    public Tezina Tezina { get; set; }
    public int Kapacitet { get; set; }
    public double Cijena { get; set; }

    public EscapeRoom() { }
}