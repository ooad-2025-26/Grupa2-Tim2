using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Rezervacija
{
    [Key]
    public int RezervacijaID { get; set; }

    public DateTime DatumKreiranja { get; set; }
    public bool Status { get; set; }
    public int BrojOsoba { get; set; }

    [ForeignKey("Korisnik")]
    public int KorisnikID { get; set; }
    public Korisnik Korisnik { get; set; }

    [ForeignKey("Termin")]
    public int TerminID { get; set; }
    public Termin Termin { get; set; }

    public Rezervacija() { }
}