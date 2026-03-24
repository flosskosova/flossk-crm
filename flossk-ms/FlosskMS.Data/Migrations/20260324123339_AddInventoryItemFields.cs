using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlosskMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddInventoryItemFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ElectricSpecs",
                table: "InventoryItems",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Location",
                table: "InventoryItems",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Manufacturer",
                table: "InventoryItems",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SubCategory",
                table: "InventoryItems",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Unit",
                table: "InventoryItems",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ElectricSpecs",
                table: "InventoryItems");

            migrationBuilder.DropColumn(
                name: "Location",
                table: "InventoryItems");

            migrationBuilder.DropColumn(
                name: "Manufacturer",
                table: "InventoryItems");

            migrationBuilder.DropColumn(
                name: "SubCategory",
                table: "InventoryItems");

            migrationBuilder.DropColumn(
                name: "Unit",
                table: "InventoryItems");
        }
    }
}
