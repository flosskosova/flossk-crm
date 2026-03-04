using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlosskMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRepairTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RepairNotes",
                table: "InventoryItems",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RepairedAt",
                table: "InventoryItems",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RepairedByUserId",
                table: "InventoryItems",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_InventoryItems_RepairedByUserId",
                table: "InventoryItems",
                column: "RepairedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_InventoryItems_AspNetUsers_RepairedByUserId",
                table: "InventoryItems",
                column: "RepairedByUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InventoryItems_AspNetUsers_RepairedByUserId",
                table: "InventoryItems");

            migrationBuilder.DropIndex(
                name: "IX_InventoryItems_RepairedByUserId",
                table: "InventoryItems");

            migrationBuilder.DropColumn(
                name: "RepairNotes",
                table: "InventoryItems");

            migrationBuilder.DropColumn(
                name: "RepairedAt",
                table: "InventoryItems");

            migrationBuilder.DropColumn(
                name: "RepairedByUserId",
                table: "InventoryItems");
        }
    }
}
