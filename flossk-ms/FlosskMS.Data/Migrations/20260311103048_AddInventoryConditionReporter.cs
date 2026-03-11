using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlosskMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddInventoryConditionReporter : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ConditionReportedByUserId",
                table: "InventoryItems",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_InventoryItems_ConditionReportedByUserId",
                table: "InventoryItems",
                column: "ConditionReportedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_InventoryItems_AspNetUsers_ConditionReportedByUserId",
                table: "InventoryItems",
                column: "ConditionReportedByUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InventoryItems_AspNetUsers_ConditionReportedByUserId",
                table: "InventoryItems");

            migrationBuilder.DropIndex(
                name: "IX_InventoryItems_ConditionReportedByUserId",
                table: "InventoryItems");

            migrationBuilder.DropColumn(
                name: "ConditionReportedByUserId",
                table: "InventoryItems");
        }
    }
}
