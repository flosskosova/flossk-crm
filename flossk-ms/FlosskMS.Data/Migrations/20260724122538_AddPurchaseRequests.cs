using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlosskMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPurchaseRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PurchaseRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ItemName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Reason = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Link = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Price = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    NeededByDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "text", nullable: false),
                    ReviewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReviewedByUserId = table.Column<string>(type: "text", nullable: true),
                    RejectionReason = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PurchaseRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PurchaseRequests_AspNetUsers_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PurchaseRequests_AspNetUsers_ReviewedByUserId",
                        column: x => x.ReviewedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseRequests_CreatedAt",
                table: "PurchaseRequests",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseRequests_CreatedByUserId",
                table: "PurchaseRequests",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseRequests_ReviewedByUserId",
                table: "PurchaseRequests",
                column: "ReviewedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseRequests_Status",
                table: "PurchaseRequests",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PurchaseRequests");
        }
    }
}
