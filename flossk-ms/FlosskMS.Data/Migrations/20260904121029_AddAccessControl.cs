using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlosskMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAccessControl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AllDoors",
                table: "UserRfidCards",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "CredentialNumber",
                table: "UserRfidCards",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CredentialType",
                table: "UserRfidCards",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "NfcCard");

            migrationBuilder.AddColumn<string>(
                name: "DeclineReason",
                table: "UserRfidCards",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "HomeKeyProvisionedAt",
                table: "UserRfidCards",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HomeKeyProvisionedByUserId",
                table: "UserRfidCards",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastUsedAt",
                table: "UserRfidCards",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "UserRfidCards",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Pending");

            // Any RFID card that already exists keeps working: it stays active and opens every door.
            migrationBuilder.Sql(
                "UPDATE \"UserRfidCards\" SET " +
                "\"Status\" = CASE WHEN \"IsActive\" THEN 'Active' ELSE 'Revoked' END, " +
                "\"CredentialType\" = 'NfcCard', \"AllDoors\" = true;");

            migrationBuilder.AddColumn<int>(
                name: "UserNumber",
                table: "UserRfidCards",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MemberCode",
                table: "AspNetUsers",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "AccessDoors",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Location = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccessDoors", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AccessDoors_AspNetUsers_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AccessDevices",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    DoorId = table.Column<Guid>(type: "uuid", nullable: false),
                    IpAddress = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Port = table.Column<int>(type: "integer", nullable: false),
                    Secret = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    IsAllowed = table.Column<bool>(type: "boolean", nullable: false),
                    EnforceIpCheck = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "text", nullable: false),
                    LastSeenAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastSyncAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FirmwareVersion = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccessDevices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AccessDevices_AccessDoors_DoorId",
                        column: x => x.DoorId,
                        principalTable: "AccessDoors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AccessDoorGrants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RfidCardId = table.Column<Guid>(type: "uuid", nullable: false),
                    DoorId = table.Column<Guid>(type: "uuid", nullable: false),
                    GrantedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    GrantedByUserId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccessDoorGrants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AccessDoorGrants_AccessDoors_DoorId",
                        column: x => x.DoorId,
                        principalTable: "AccessDoors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AccessDoorGrants_UserRfidCards_RfidCardId",
                        column: x => x.RfidCardId,
                        principalTable: "UserRfidCards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AccessLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EventType = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Granted = table.Column<bool>(type: "boolean", nullable: true),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DoorId = table.Column<Guid>(type: "uuid", nullable: true),
                    DoorName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    DeviceId = table.Column<Guid>(type: "uuid", nullable: true),
                    RfidCardId = table.Column<Guid>(type: "uuid", nullable: true),
                    CredentialType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    CredentialIdentifier = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UserId = table.Column<string>(type: "text", nullable: true),
                    ActorUserId = table.Column<string>(type: "text", nullable: true),
                    Metadata = table.Column<string>(type: "text", nullable: true),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccessLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AccessLogs_AccessDevices_DeviceId",
                        column: x => x.DeviceId,
                        principalTable: "AccessDevices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_AccessLogs_AccessDoors_DoorId",
                        column: x => x.DoorId,
                        principalTable: "AccessDoors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_AccessLogs_AspNetUsers_ActorUserId",
                        column: x => x.ActorUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_AccessLogs_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_AccessLogs_UserRfidCards_RfidCardId",
                        column: x => x.RfidCardId,
                        principalTable: "UserRfidCards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserRfidCards_CredentialType",
                table: "UserRfidCards",
                column: "CredentialType");

            migrationBuilder.CreateIndex(
                name: "IX_UserRfidCards_Status",
                table: "UserRfidCards",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_MemberCode",
                table: "AspNetUsers",
                column: "MemberCode",
                unique: true,
                filter: "\"MemberCode\" <> ''");

            migrationBuilder.CreateIndex(
                name: "IX_AccessDevices_DoorId",
                table: "AccessDevices",
                column: "DoorId");

            migrationBuilder.CreateIndex(
                name: "IX_AccessDevices_IpAddress",
                table: "AccessDevices",
                column: "IpAddress");

            migrationBuilder.CreateIndex(
                name: "IX_AccessDevices_IsAllowed",
                table: "AccessDevices",
                column: "IsAllowed");

            migrationBuilder.CreateIndex(
                name: "IX_AccessDoorGrants_DoorId",
                table: "AccessDoorGrants",
                column: "DoorId");

            migrationBuilder.CreateIndex(
                name: "IX_AccessDoorGrants_RfidCardId_DoorId",
                table: "AccessDoorGrants",
                columns: new[] { "RfidCardId", "DoorId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AccessDoors_CreatedByUserId",
                table: "AccessDoors",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AccessDoors_IsActive",
                table: "AccessDoors",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_AccessDoors_Name",
                table: "AccessDoors",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_AccessLogs_ActorUserId",
                table: "AccessLogs",
                column: "ActorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AccessLogs_DeviceId",
                table: "AccessLogs",
                column: "DeviceId");

            migrationBuilder.CreateIndex(
                name: "IX_AccessLogs_DoorId",
                table: "AccessLogs",
                column: "DoorId");

            migrationBuilder.CreateIndex(
                name: "IX_AccessLogs_EventType",
                table: "AccessLogs",
                column: "EventType");

            migrationBuilder.CreateIndex(
                name: "IX_AccessLogs_RfidCardId",
                table: "AccessLogs",
                column: "RfidCardId");

            migrationBuilder.CreateIndex(
                name: "IX_AccessLogs_Timestamp",
                table: "AccessLogs",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_AccessLogs_UserId",
                table: "AccessLogs",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AccessDoorGrants");

            migrationBuilder.DropTable(
                name: "AccessLogs");

            migrationBuilder.DropTable(
                name: "AccessDevices");

            migrationBuilder.DropTable(
                name: "AccessDoors");

            migrationBuilder.DropIndex(
                name: "IX_UserRfidCards_CredentialType",
                table: "UserRfidCards");

            migrationBuilder.DropIndex(
                name: "IX_UserRfidCards_Status",
                table: "UserRfidCards");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_MemberCode",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "AllDoors",
                table: "UserRfidCards");

            migrationBuilder.DropColumn(
                name: "CredentialNumber",
                table: "UserRfidCards");

            migrationBuilder.DropColumn(
                name: "CredentialType",
                table: "UserRfidCards");

            migrationBuilder.DropColumn(
                name: "DeclineReason",
                table: "UserRfidCards");

            migrationBuilder.DropColumn(
                name: "HomeKeyProvisionedAt",
                table: "UserRfidCards");

            migrationBuilder.DropColumn(
                name: "HomeKeyProvisionedByUserId",
                table: "UserRfidCards");

            migrationBuilder.DropColumn(
                name: "LastUsedAt",
                table: "UserRfidCards");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "UserRfidCards");

            migrationBuilder.DropColumn(
                name: "UserNumber",
                table: "UserRfidCards");

            migrationBuilder.DropColumn(
                name: "MemberCode",
                table: "AspNetUsers");
        }
    }
}
