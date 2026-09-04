using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using FlosskMS.Data;

#nullable disable

namespace FlosskMS.Data.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260716000000_UpdatePosSystem")]
    public partial class UpdatePosSystem : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PosCustomers_Phone",
                table: "PosCustomers");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "PosCustomers");

            migrationBuilder.DropColumn(
                name: "Phone",
                table: "PosCustomers");

            migrationBuilder.AddColumn<string>(
                name: "FirstName",
                table: "PosCustomers",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LastName",
                table: "PosCustomers",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FirstName",
                table: "PosCustomers");

            migrationBuilder.DropColumn(
                name: "LastName",
                table: "PosCustomers");

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "PosCustomers",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                table: "PosCustomers",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PosCustomers_Phone",
                table: "PosCustomers",
                column: "Phone",
                unique: true,
                filter: "\"Phone\" IS NOT NULL");
        }
    }
}
