using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlosskMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCertificateTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "TemplateId",
                table: "Certificates",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CertificateTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    OriginalFileName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    FilePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CertificateTemplates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CertificateTemplates_AspNetUsers_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Certificates_TemplateId",
                table: "Certificates",
                column: "TemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_CertificateTemplates_CreatedByUserId",
                table: "CertificateTemplates",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CertificateTemplates_UploadedAt",
                table: "CertificateTemplates",
                column: "UploadedAt");

            migrationBuilder.AddForeignKey(
                name: "FK_Certificates_CertificateTemplates_TemplateId",
                table: "Certificates",
                column: "TemplateId",
                principalTable: "CertificateTemplates",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Certificates_CertificateTemplates_TemplateId",
                table: "Certificates");

            migrationBuilder.DropTable(
                name: "CertificateTemplates");

            migrationBuilder.DropIndex(
                name: "IX_Certificates_TemplateId",
                table: "Certificates");

            migrationBuilder.DropColumn(
                name: "TemplateId",
                table: "Certificates");
        }
    }
}
