using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Podrska
{
    [Key]
    public int PorukaID { get; set; }

    public string Email { get; set; }
    public DateTime Datum { get; set; }
    public string Sadrzaj { get; set; }
    public string NaslovPoruke { get; set; }

    [ForeignKey("Korisnik")]
    public int KorisnikID { get; set; }
    public Korisnik Korisnik { get; set; }

    public Podrska() { }
}