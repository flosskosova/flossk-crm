using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlosskMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveCurrentUserFromInventoryItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InventoryItems_AspNetUsers_CurrentUserId",
                table: "InventoryItems");

            migrationBuilder.DropIndex(
                name: "IX_InventoryItems_CurrentUserId",
                table: "InventoryItems");

            migrationBuilder.DropColumn(
                name: "CheckedOutAt",
                table: "InventoryItems");

            migrationBuilder.DropColumn(
                name: "CurrentUserId",
                table: "InventoryItems");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CheckedOutAt",
                table: "InventoryItems",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CurrentUserId",
                table: "InventoryItems",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_InventoryItems_CurrentUserId",
                table: "InventoryItems",
                column: "CurrentUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_InventoryItems_AspNetUsers_CurrentUserId",
                table: "InventoryItems",
                column: "CurrentUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
