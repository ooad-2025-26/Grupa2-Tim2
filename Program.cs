using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Task6.Data;
using Task6.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System;
using Npgsql.EntityFrameworkCore.PostgreSQL;
using Task6.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<SupabaseStorageService>();

builder.Services.AddDbContext<EscapeRoomDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequiredLength = 6;
    options.Password.RequireDigit = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;
})
    .AddEntityFrameworkStores<EscapeRoomDbContext>()
    .AddDefaultTokenProviders();

// Konfiguracija autentifikacije
builder.Services.ConfigureApplicationCookie(options =>
{
    options.LoginPath = "/Account/Login";
    options.LogoutPath = "/Account/Logout";
    options.AccessDeniedPath = "/Account/AccessDenied";
    options.ExpireTimeSpan = TimeSpan.FromDays(14);
    options.SlidingExpiration = true;
});

var app = builder.Build();

// Initialize database
await DbInitializer.InitializeAsync(app);

// Provjera konekcije sa bazom
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<EscapeRoomDbContext>();

    if (db.Database.CanConnect())
    {
        Console.WriteLine("✓ Konekcija sa bazom uspjesna!");
    }
    else
    {
        Console.WriteLine("✗ Neuspjesna konekcija sa bazom!");
    }
}

// Log connection string and DB name at startup
using (var scope = app.Services.CreateScope())
{
    var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    var conn = configuration.GetConnectionString("DefaultConnection");
    logger.LogInformation("Using connection string: {Conn}", conn);
    try
    {
        // attempt to parse database name for quick visibility
        var dbNameToken = "Database=";
        var idx = conn?.IndexOf(dbNameToken, StringComparison.OrdinalIgnoreCase) ?? -1;
        if (idx >= 0)
        {
            var rest = conn.Substring(idx + dbNameToken.Length);
            var endIdx = rest.IndexOf(';');
            var dbName = endIdx >= 0 ? rest.Substring(0, endIdx) : rest;
            logger.LogInformation("Target database name: {DbName}", dbName);
        }
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Failed to parse connection string");
    }
}

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapStaticAssets();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();

app.Run();
