using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Task6.Models;

namespace Task6.Data
{
    public static class DbInitializer
    {
        public static async Task InitializeAsync(IApplicationBuilder app)
        {
            using (var scope = app.ApplicationServices.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<EscapeRoomDbContext>();
                var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
                var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

                // Primijeni migracije
                await context.Database.MigrateAsync();

                // Dodaj role
                var roles = new[] { "Admin", "Korisnik", "Zaposlenik" };
                foreach (var roleName in roles)
                {
                    if (!await roleManager.RoleExistsAsync(roleName))
                    {
                        await roleManager.CreateAsync(new IdentityRole(roleName));
                    }
                }

                // Dodaj korisnike samo ako ne postoje
                if (!context.Users.Any())
                {
                    var users = new List<ApplicationUser>
                    {
                        new ApplicationUser { UserName = "admin@theLastKey.com", Email = "admin@theLastKey.com", Ime = "Admin", Prezime = "TheLastKey", Uloga = Uloga.Admin },
                        new ApplicationUser { UserName = "korisnik1@thelastkey.com", Email = "korisnik1@thelastkey.com", Ime = "Amir", Prezime = "Hodzic", Uloga = Uloga.Korisnik },
                        new ApplicationUser { UserName = "korisnik2@thelastkey.com", Email = "korisnik2@thelastkey.com", Ime = "Lejla", Prezime = "Smajic", Uloga = Uloga.Korisnik },
                        new ApplicationUser { UserName = "zaposlenik1@thelastkey.com", Email = "zaposlenik1@thelastkey.com", Ime = "Adnan", Prezime = "Ibrahimovic", Uloga = Uloga.Zaposlenik }
                    };

                    foreach (var u in users)
                    {
                        var pw = "Test@123"; // podrazumijevana lozinka za testiranje, promijenite kasnije
                        var result = await userManager.CreateAsync(u, pw);
                        if (result.Succeeded)
                        {
                            if (u.Uloga == Uloga.Admin)
                                await userManager.AddToRoleAsync(u, "Admin");
                            else if (u.Uloga == Uloga.Zaposlenik)
                                await userManager.AddToRoleAsync(u, "Zaposlenik");
                            else
                                await userManager.AddToRoleAsync(u, "Korisnik");
                        }
                    }
                }

                // Dodaj sobe
                if (!context.EscapeRooms.Any())
                {
                    var rooms = new List<EscapeRoom>
                    {
                        new EscapeRoom { Naziv = "Tajni Laboratorij", Opis = "Pronađite tajnu formulu", Tezina = Tezina.Srednja, Kapacitet = 4, Cijena = 150 },
                        new EscapeRoom { Naziv = "Faraonska Prikupljanja", Opis = "Drevna egipatska grobnica", Tezina = Tezina.Teska, Kapacitet = 6, Cijena = 200 },
                        new EscapeRoom { Naziv = "Vampirski Zamak", Opis = "Strašan zamak pun vampira", Tezina = Tezina.Lagana, Kapacitet = 3, Cijena = 100 }
                    };
                    context.EscapeRooms.AddRange(rooms);
                    await context.SaveChangesAsync();
                }

                // Dodaj termine za sljedećih 14 dana
                if (!context.Termini.Any())
                {
                    var escapeRooms = await context.EscapeRooms.ToListAsync();
                    var termini = new List<Termin>();
                    foreach (var room in escapeRooms)
                    {
                        for (int day = 0; day < 14; day++)
                        {
                            var date = DateTime.Now.AddDays(day).Date;
                            if (date.DayOfWeek != DayOfWeek.Sunday)
                            {
                                for (int hour = 10; hour < 22; hour += 2)
                                {
                                    termini.Add(new Termin { RoomID = room.RoomID, Datum = date.AddHours(hour), Vrijeme = $"{hour:D2}:00", Dostupnost = true });
                                }
                            }
                        }
                    }

                    context.Termini.AddRange(termini);
                    await context.SaveChangesAsync();
                }

                // Dodaj primjere rezervacija i recenzija
                if (!context.Rezervacije.Any())
                {
                    var user = await userManager.FindByEmailAsync("korisnik1@thelastkey.com");
                    var termin = await context.Termini.FirstOrDefaultAsync();
                    if (user != null && termin != null)
                    {
                        var rez = new Rezervacija { KorisnikID = user.Id, TerminID = termin.TerminID, BrojOsoba = 4, DatumKreiranja = DateTime.Now, Status = true };
                        context.Rezervacije.Add(rez);
                        await context.SaveChangesAsync();

                        // Dodaj recenziju za završenu rezervaciju
                        var review = new Recenzija { KorisnikID = user.Id, RoomID = termin.RoomID, Ocjena = 4.5, Komentar = "Odlično iskustvo!", Datum = DateTime.Now };
                        context.Recenzije.Add(review);
                        await context.SaveChangesAsync();
                    }
                }
            }
        }
    }
}
