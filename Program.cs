using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Task6.Data;
using Task6.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

builder.Services.AddDbContext<EscapeRoomDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<EscapeRoomDbContext>()
    .AddDefaultTokenProviders();

var app = builder.Build();

// Provjera konekcije sa bazom
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<EscapeRoomDbContext>();

    if (db.Database.CanConnect())
    {
        Console.WriteLine("Konekcija sa bazom uspjesna!");
    }
    else
    {
        Console.WriteLine("Neuspjesna konekcija sa bazom!");
    }
}

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapStaticAssets();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();

app.Run();