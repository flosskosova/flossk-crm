using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlosskMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddResourceUrls : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Url",
                table: "Resources");

            migrationBuilder.AddColumn<List<string>>(
                name: "Urls",
                table: "Resources",
                type: "text[]",
                nullable: false,
                defaultValueSql: "'{}'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Urls",
                table: "Resources");

            migrationBuilder.AddColumn<string>(
                name: "Url",
                table: "Resources",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);
        }
    }
}
