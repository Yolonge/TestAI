using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CodeDuelPlatform.Migrations
{
    /// <inheritdoc />
    public partial class AddQuestionTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BlanksData",
                table: "Questions",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Questions",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Options",
                table: "Questions",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "QuestionType",
                table: "Questions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Questions_BlanksData_GIN",
                table: "Questions",
                column: "BlanksData")
                .Annotation("Npgsql:IndexMethod", "GIN");

            migrationBuilder.CreateIndex(
                name: "IX_Questions_FillBlanks",
                table: "Questions",
                column: "Id",
                filter: "\"QuestionType\" = 3");

            migrationBuilder.CreateIndex(
                name: "IX_Questions_Options_GIN",
                table: "Questions",
                column: "Options")
                .Annotation("Npgsql:IndexMethod", "GIN");

            migrationBuilder.CreateIndex(
                name: "IX_Questions_QuestionType",
                table: "Questions",
                column: "QuestionType");

            migrationBuilder.CreateIndex(
                name: "IX_Questions_QuestionType_Category",
                table: "Questions",
                columns: new[] { "QuestionType", "Category" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Questions_BlanksData_GIN",
                table: "Questions");

            migrationBuilder.DropIndex(
                name: "IX_Questions_FillBlanks",
                table: "Questions");

            migrationBuilder.DropIndex(
                name: "IX_Questions_Options_GIN",
                table: "Questions");

            migrationBuilder.DropIndex(
                name: "IX_Questions_QuestionType",
                table: "Questions");

            migrationBuilder.DropIndex(
                name: "IX_Questions_QuestionType_Category",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "BlanksData",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "Options",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "QuestionType",
                table: "Questions");
        }
    }
}
