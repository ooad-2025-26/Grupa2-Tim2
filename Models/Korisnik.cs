using System.ComponentModel.DataAnnotations;
using Task6.Models;

public class Korisnik
{
    [Key]
    public int KorisnikID { get; set; }

    public string Username { get; set; }
    public string Ime { get; set; }
    public string Prezime { get; set; }
    public string Email { get; set; }
    public string Lozinka { get; set; }

    public Uloga Uloga { get; set; }

    public Korisnik() { }
}