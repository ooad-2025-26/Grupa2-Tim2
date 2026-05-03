using Microsoft.EntityFrameworkCore;

public class EscapeRoomDbContext : DbContext
{
    public EscapeRoomDbContext(DbContextOptions<EscapeRoomDbContext> options)
        : base(options)
    {
    }

    public DbSet<Korisnik> Korisnici { get; set; }
}