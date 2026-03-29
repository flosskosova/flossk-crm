using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlosskMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectModerators : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Projects_AspNetUsers_ModeratorUserId",
                table: "Projects");

            migrationBuilder.DropIndex(
                name: "IX_Projects_ModeratorUserId",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "ModeratorUserId",
                table: "Projects");

            migrationBuilder.CreateTable(
                name: "ProjectModerators",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectModerators", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectModerators_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProjectModerators_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectModerators_ProjectId_UserId",
                table: "ProjectModerators",
                columns: new[] { "ProjectId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProjectModerators_UserId",
                table: "ProjectModerators",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProjectModerators");

            migrationBuilder.AddColumn<string>(
                name: "ModeratorUserId",
                table: "Projects",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Projects_ModeratorUserId",
                table: "Projects",
                column: "ModeratorUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Projects_AspNetUsers_ModeratorUserId",
                table: "Projects",
                column: "ModeratorUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
