using FlosskMS.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlosskMS.Data.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260423130000_AddRedeemedByEmailsToVoucher")]
    public partial class AddRedeemedByEmailsToVoucher : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string[]>(
                name: "RedeemedByEmails",
                table: "CourseVouchers",
                type: "text[]",
                nullable: false,
                defaultValueSql: "'{}'");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RedeemedByEmails",
                table: "CourseVouchers");
        }
    }
}
