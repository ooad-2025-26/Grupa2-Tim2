using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Task6.Migrations
{
    public partial class AddDiscountFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DiscountPercent",
                table: "EscapeRooms",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "DiscountStart",
                table: "EscapeRooms",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DiscountEnd",
                table: "EscapeRooms",
                type: "timestamp with time zone",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DiscountEnd",
                table: "EscapeRooms");

            migrationBuilder.DropColumn(
                name: "DiscountStart",
                table: "EscapeRooms");

            migrationBuilder.DropColumn(
                name: "DiscountPercent",
                table: "EscapeRooms");
        }
    }
}
