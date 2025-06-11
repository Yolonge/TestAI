using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CodeDuelPlatform.Migrations
{
    /// <inheritdoc />
    public partial class initContainer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Duels",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "FirstUserSubmitted",
                table: "DuelQuestions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "SecondUserSubmitted",
                table: "DuelQuestions",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Status",
                table: "Duels");

            migrationBuilder.DropColumn(
                name: "FirstUserSubmitted",
                table: "DuelQuestions");

            migrationBuilder.DropColumn(
                name: "SecondUserSubmitted",
                table: "DuelQuestions");
        }
    }
}
