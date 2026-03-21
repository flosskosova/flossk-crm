using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlosskMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCertificateProjectId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ProjectId",
                table: "Certificates",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Certificates_ProjectId",
                table: "Certificates",
                column: "ProjectId");

            migrationBuilder.AddForeignKey(
                name: "FK_Certificates_Projects_ProjectId",
                table: "Certificates",
                column: "ProjectId",
                principalTable: "Projects",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Certificates_Projects_ProjectId",
                table: "Certificates");

            migrationBuilder.DropIndex(
                name: "IX_Certificates_ProjectId",
                table: "Certificates");

            migrationBuilder.DropColumn(
                name: "ProjectId",
                table: "Certificates");
        }
    }
}
