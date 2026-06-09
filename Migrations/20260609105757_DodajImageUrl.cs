using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Task6.Migrations
{
    /// <inheritdoc />
    public partial class DodajImageUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "EscapeRooms",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "EscapeRooms");
        }
    }
}
