using System.ComponentModel.DataAnnotations;
using Task6.Models;

public class Obavijest
{
    [Key]
    public int ObavijestID { get; set; }

    public string Naslov { get; set; }
    public string Sadrzaj { get; set; }
    public DateTime Datum { get; set; }
    public TipObavijesti TipObavijesti { get; set; }

    public Obavijest() { }
}