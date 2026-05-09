using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Placanje
{
    [Key]
    public int PlacanjeID { get; set; }

    public double Iznos { get; set; }
    public DateTime Datum { get; set; }
    public bool Status { get; set; }

    [ForeignKey("Rezervacija")]
    public int RezervacijaID { get; set; }
    public Rezervacija Rezervacija { get; set; }

    public Placanje() { }
}