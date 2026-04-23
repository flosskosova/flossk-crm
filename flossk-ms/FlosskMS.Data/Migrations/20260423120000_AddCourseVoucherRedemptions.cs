using System;
using FlosskMS.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlosskMS.Data.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260423120000_AddCourseVoucherRedemptions")]
    public partial class AddCourseVoucherRedemptions : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CourseVoucherRedemptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CourseVoucherId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    RedeemedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseVoucherRedemptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CourseVoucherRedemptions_CourseVouchers_CourseVoucherId",
                        column: x => x.CourseVoucherId,
                        principalTable: "CourseVouchers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CourseVoucherRedemptions_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CourseVoucherRedemptions_CourseVoucherId",
                table: "CourseVoucherRedemptions",
                column: "CourseVoucherId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseVoucherRedemptions_UserId",
                table: "CourseVoucherRedemptions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseVoucherRedemptions_RedeemedAt",
                table: "CourseVoucherRedemptions",
                column: "RedeemedAt");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CourseVoucherRedemptions");
        }
    }
}
