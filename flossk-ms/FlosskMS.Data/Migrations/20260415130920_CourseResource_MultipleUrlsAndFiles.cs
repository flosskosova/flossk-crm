using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlosskMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class CourseResource_MultipleUrlsAndFiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Url",
                table: "CourseResources");

            migrationBuilder.AddColumn<string>(
                name: "Urls",
                table: "CourseResources",
                type: "jsonb",
                nullable: false,
                defaultValueSql: "'[]'::jsonb");

            migrationBuilder.CreateTable(
                name: "CourseResourceFiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CourseResourceId = table.Column<Guid>(type: "uuid", nullable: false),
                    FileId = table.Column<Guid>(type: "uuid", nullable: false),
                    AddedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseResourceFiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CourseResourceFiles_CourseResources_CourseResourceId",
                        column: x => x.CourseResourceId,
                        principalTable: "CourseResources",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CourseResourceFiles_UploadedFiles_FileId",
                        column: x => x.FileId,
                        principalTable: "UploadedFiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CourseResourceFiles_CourseResourceId",
                table: "CourseResourceFiles",
                column: "CourseResourceId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseResourceFiles_CourseResourceId_FileId",
                table: "CourseResourceFiles",
                columns: new[] { "CourseResourceId", "FileId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CourseResourceFiles_FileId",
                table: "CourseResourceFiles",
                column: "FileId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CourseResourceFiles");

            migrationBuilder.DropColumn(
                name: "Urls",
                table: "CourseResources");

            migrationBuilder.AddColumn<string>(
                name: "Url",
                table: "CourseResources",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: false,
                defaultValue: "");
        }
    }
}
