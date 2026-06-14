using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using FlosskMS.Data;

#nullable disable

namespace FlosskMS.Data.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260614123000_AddPushSubscriptionApprovalFlag")]
    public partial class AddPushSubscriptionApprovalFlag : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsApproved",
                table: "PushSubscriptions",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.CreateIndex(
                name: "IX_PushSubscriptions_UserId_IsApproved",
                table: "PushSubscriptions",
                columns: new[] { "UserId", "IsApproved" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PushSubscriptions_UserId_IsApproved",
                table: "PushSubscriptions");

            migrationBuilder.DropColumn(
                name: "IsApproved",
                table: "PushSubscriptions");
        }
    }
}