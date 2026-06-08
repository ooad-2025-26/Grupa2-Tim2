using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Task6.Migrations
{
    /// <inheritdoc />
    public partial class DodajOdgovorZaPodrsku : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DatumOdgovora",
                table: "Podrske",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Odgovor",
                table: "Podrske",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "Odgovoreno",
                table: "Podrske",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DatumOdgovora",
                table: "Podrske");

            migrationBuilder.DropColumn(
                name: "Odgovor",
                table: "Podrske");

            migrationBuilder.DropColumn(
                name: "Odgovoreno",
                table: "Podrske");
        }
    }
}
