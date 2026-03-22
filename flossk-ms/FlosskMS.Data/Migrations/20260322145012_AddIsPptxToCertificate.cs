using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlosskMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddIsPptxToCertificate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPptx",
                table: "Certificates",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsPptx",
                table: "Certificates");
        }
    }
}
