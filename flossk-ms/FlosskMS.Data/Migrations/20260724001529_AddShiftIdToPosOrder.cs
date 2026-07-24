using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlosskMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddShiftIdToPosOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ShiftId",
                table: "PosOrders",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PosOrders_ShiftId",
                table: "PosOrders",
                column: "ShiftId");

            migrationBuilder.AddForeignKey(
                name: "FK_PosOrders_PosShifts_ShiftId",
                table: "PosOrders",
                column: "ShiftId",
                principalTable: "PosShifts",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PosOrders_PosShifts_ShiftId",
                table: "PosOrders");

            migrationBuilder.DropIndex(
                name: "IX_PosOrders_ShiftId",
                table: "PosOrders");

            migrationBuilder.DropColumn(
                name: "ShiftId",
                table: "PosOrders");
        }
    }
}
