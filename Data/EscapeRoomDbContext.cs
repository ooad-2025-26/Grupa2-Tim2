using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Task6.Models;

namespace Task6.Data
{
    public class EscapeRoomDbContext : IdentityDbContext<ApplicationUser>
    {
        public EscapeRoomDbContext(DbContextOptions<EscapeRoomDbContext> options)
            : base(options)
        {
        }

        public DbSet<EscapeRoom> EscapeRooms { get; set; }
        public DbSet<Rezervacija> Rezervacije { get; set; }
        public DbSet<Termin> Termini { get; set; }
        public DbSet<Placanje> Placanja { get; set; }
        public DbSet<Recenzija> Recenzije { get; set; }
        public DbSet<Podrska> Podrske { get; set; }
        public DbSet<Obavijest> Obavijesti { get; set; }
    }
}