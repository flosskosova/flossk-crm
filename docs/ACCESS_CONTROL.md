# Door Access Control

Manages physical doors, the ESP32 controllers that drive their locks, and the
credentials that open them — plain **NFC cards** and **Aliro / Apple Home Key**
credentials — with an explicit **accept / decline** gate and a full audit log.

It extends the existing RFID card feature: every credential is still a
`UserRfidCard` row, now with a `CredentialType`, a lifecycle `Status`, Matter/Aliro
slot numbers (`UserNumber` = *SetUser*, `CredentialNumber` = *SetCredential*), and
per-door grants.

## Concepts

| Entity | Purpose |
|--------|---------|
| **AccessDoor** | A physical door. `IsActive=false` → nothing opens it. |
| **AccessDevice** | A registered ESP32. Holds its `IpAddress`, `Port`, a shared `Secret`, and `IsAllowed`. Used both to authenticate inbound webhook calls and as the target for outbound provisioning / "grab data". |
| **UserRfidCard** (credential) | `CredentialType` = `NfcCard` \| `HomeKey`. `Status` = `Pending` → `Active` → `Declined` / `Disabled` / `Revoked`. `AllDoors` or explicit `AccessDoorGrant` rows. |
| **Member code** | `ApplicationUser.MemberCode` — a stable random badge id like `FOSS-K7M2QX9P` (prefix + 8 chars, unambiguous alphabet). Assigned on creation by a SaveChanges interceptor (every creation path) and back-filled for existing members by `DbSeeder` on startup. Shown on Profile, the Users list (sortable column), and each credential row; also a `memberCode` JWT claim. The Matter/Aliro *SetUser* slot is a separate per-member integer allocated at first provisioning. |
| **AccessLog** | Every unlock, denial, credential change, provisioning push and device event. |

### Credential lifecycle

```
assign ─▶ Pending ──accept──▶ Active ──▶ door opens
              │  ▲   (HomeKey: must be provisioned first)
          decline │ disable/enable
              ▼  │
           Declined / Disabled / Revoked ─▶ door stays locked
```

- **NFC card**: assign with the card UUID → accept → done.
- **Home Key**: assign → **Provision Home Key** (pushes *SetUser* + *SetCredential*
  to the door's ESP32s) → accept. Access is refused until `HomeKeyProvisionedAt`
  is set **and** `Status = Active`.

## REST API

All management endpoints require the **Admin** role.

### Doors — `/api/AccessDoors`
`GET` · `GET /{id}` · `POST` · `PUT /{id}` · `DELETE /{id}`

### Devices — `/api/AccessDevices`
`GET [?doorId=]` · `GET /{id}` · `POST` · `PUT /{id}` · `DELETE /{id}`
`POST /{id}/sync` — pull state from the device (`GET http://{ip}:{port}/state`).

`POST` returns the generated `secret` **once**. `PUT { "rotateSecret": true }`
issues a new one (also returned once).

### Credentials — `/api/RfidCards`
Existing endpoints unchanged, plus:

| Method | Path | Effect |
|--------|------|--------|
| POST | `/credentials/assign` | Create a `Pending` credential for a member. |
| PATCH | `/{id}/accept` | → `Active`; pushes *SetUser* + *SetCredential*. |
| PATCH | `/{id}/decline` `{ reason? }` | → `Declined`; removes it from devices. |
| PATCH | `/{id}/disable` / `/{id}/enable` | Toggle without losing the assignment. |
| POST | `/{id}/provision-homekey` | Push the Home Key to the member's device. |
| PUT  | `/{id}/doors` `{ allDoors, doorIds[] }` | Set which doors it opens. |
| GET  | `/{id}/logs` | Access-log entries for that credential. |

### Access logs — `/api/AccessLogs`
`GET ?page=&pageSize=&doorId=&rfidCardId=&userId=&eventType=&granted=&dateFrom=&dateTo=`

## Webhook — what the ESP32 calls

Base: `POST /api/access/...` · Header: `X-Device-Key: <the device secret>`
Auth = the secret matches an `AccessDevice` row that is `IsAllowed`. If that device
has **`EnforceIpCheck`** enabled, the request's source IP must also equal its
`IpAddress` (IPv4-mapped IPv6 is normalised). Leave `EnforceIpCheck` off when the
API is behind a proxy/NAT that rewrites the client address.

### `POST /api/access/verify`
```json
{ "uuid": "04:A1:B2:C3:D4:E5:F6", "credentialType": "NfcCard", "metadata": "reader=1" }
```
→ `200`
```json
{ "granted": true, "reason": "granted", "userName": "Ada Byron", "doorId": "…" }
```
`granted:false` reasons: `unknown device`, `door disabled`, `unknown credential`,
`credential not assigned`, `awaiting acceptance`, `credential declined`,
`credential disabled`, `credential revoked`, `home key not provisioned`,
`no access to this door`. Every call writes an `AccessLog`.

### `POST /api/access/event`
```json
{ "eventType": "Unlock", "uuid": "…", "firmwareVersion": "1.4.2", "metadata": "…" }
```
`eventType` ∈ `Unlock`, `DoorForced`, `DoorHeldOpen`, `DeviceHeartbeat`, … Sending a
heartbeat every minute keeps the device shown as **online** in the UI.

## What the ESP32 firmware needs to implement

1. On card / phone tap → `POST /api/access/verify` with the UUID; open the strike
   only if `granted` is true.
2. `POST /api/access/event` for door-open / tamper / heartbeat.
3. A local `GET /state` returning JSON (any shape) for the "grab data" button.
4. Accept `POST /setUser`, `POST /setCredential`, `POST /removeCredential`
   (JSON body, `X-Device-Key` header) to keep an **offline allow-list** so the
   door still works if the network is down. Bodies:
   - `setUser`: `{ op, userNumber, userName, userStatus }`
   - `setCredential`: `{ op, userNumber, credentialNumber, credentialType, credentialData, userStatus }`
   - `removeCredential`: `{ op, userNumber, credentialNumber, credentialType, credentialData }`

## UI

**Dashboard → Access Control** (Admin only):
Credentials · Doors · ESP32 Devices · Access Logs.

## Notes / TODO

- Provisioning is best-effort: if a device is unreachable the credential still
  changes state and an `AccessLog` records the failure; re-run *accept* or *provision*
  once the device is back.
- The IP allow-list is skipped when the API sits behind a proxy that hides the
  client IP and no `X-Forwarded-For` is present — the secret is always required.
- `AccessProvisioningService` is the single seam for real lock integration; swap it
  for a Matter-controller or MQTT implementation without touching the rest.
