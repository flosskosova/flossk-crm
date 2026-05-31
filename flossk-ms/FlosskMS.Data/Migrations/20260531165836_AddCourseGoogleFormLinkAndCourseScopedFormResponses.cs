using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlosskMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCourseGoogleFormLinkAndCourseScopedFormResponses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "FormTitle",
                table: "FormResponses",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<Guid>(
                name: "CourseId",
                table: "FormResponses",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "GoogleFormId",
                table: "FormResponses",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "GoogleFormId",
                table: "Courses",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GoogleFormTitle",
                table: "Courses",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GoogleFormUrl",
                table: "Courses",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_FormResponses_CourseId",
                table: "FormResponses",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_FormResponses_CourseId_SubmittedAt",
                table: "FormResponses",
                columns: new[] { "CourseId", "SubmittedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_FormResponses_GoogleFormId",
                table: "FormResponses",
                column: "GoogleFormId");

            migrationBuilder.CreateIndex(
                name: "IX_FormResponses_SubmittedAt",
                table: "FormResponses",
                column: "SubmittedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Courses_GoogleFormId",
                table: "Courses",
                column: "GoogleFormId",
                unique: true,
                filter: "\"GoogleFormId\" IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_FormResponses_Courses_CourseId",
                table: "FormResponses",
                column: "CourseId",
                principalTable: "Courses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FormResponses_Courses_CourseId",
                table: "FormResponses");

            migrationBuilder.DropIndex(
                name: "IX_FormResponses_CourseId",
                table: "FormResponses");

            migrationBuilder.DropIndex(
                name: "IX_FormResponses_CourseId_SubmittedAt",
                table: "FormResponses");

            migrationBuilder.DropIndex(
                name: "IX_FormResponses_GoogleFormId",
                table: "FormResponses");

            migrationBuilder.DropIndex(
                name: "IX_FormResponses_SubmittedAt",
                table: "FormResponses");

            migrationBuilder.DropIndex(
                name: "IX_Courses_GoogleFormId",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "CourseId",
                table: "FormResponses");

            migrationBuilder.DropColumn(
                name: "GoogleFormId",
                table: "FormResponses");

            migrationBuilder.DropColumn(
                name: "GoogleFormId",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "GoogleFormTitle",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "GoogleFormUrl",
                table: "Courses");

            migrationBuilder.AlterColumn<string>(
                name: "FormTitle",
                table: "FormResponses",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500);
        }
    }
}
