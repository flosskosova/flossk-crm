using FlosskMS.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlosskMS.Data.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260420120000_RemoveCourseLevelAndStatus")]
    public partial class RemoveCourseLevelAndStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Courses_Level",
                table: "Courses");

            migrationBuilder.DropIndex(
                name: "IX_Courses_Status",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "Level",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Courses");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Level",
                table: "Courses",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Beginner");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Courses",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Draft");

            migrationBuilder.CreateIndex(
                name: "IX_Courses_Level",
                table: "Courses",
                column: "Level");

            migrationBuilder.CreateIndex(
                name: "IX_Courses_Status",
                table: "Courses",
                column: "Status");
        }
    }
}