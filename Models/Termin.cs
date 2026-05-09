using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Termin
{
    [Key]
    public int TerminID { get; set; }

    public DateTime Datum { get; set; }
    public TimeSpan Vrijeme { get; set; }
    public bool Dostupnost { get; set; }

    [ForeignKey("EscapeRoom")]
    public int RoomID { get; set; }
    public EscapeRoom EscapeRoom { get; set; }

    public Termin() { }
}