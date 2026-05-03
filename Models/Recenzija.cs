using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Recenzija
{
    [Key]
    public int RecenzijaID { get; set; }

    public double Ocjena { get; set; }
    public string Komentar { get; set; }
    public DateTime Datum { get; set; }

    [ForeignKey("Korisnik")]
    public int KorisnikID { get; set; }
    public Korisnik Korisnik { get; set; }

    [ForeignKey("EscapeRoom")]
    public int RoomID { get; set; }
    public EscapeRoom EscapeRoom { get; set; }

    public Recenzija() { }
}