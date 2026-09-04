# FLOSSK CRM

Membership and operations platform for [FLOSS Kosova](https://flossk.org) — members, projects,
events, inventory, elections, certificates, courses, a point of sale, purchase approvals and
door access control.

**Stack:** ASP.NET Core (.NET 10) + PostgreSQL backend, Angular 20 (PrimeNG) frontend,
ClamAV, Caddy, Docker Compose.

## Run it (Docker)

Create a `.env` in the repo root:

```dotenv
POSTGRES_PASSWORD=change-me
DOMAIN=localhost
JwtSettings__Secret=<random string, 32+ chars>
JwtSettings__Issuer=FlosskMS
JwtSettings__Audience=FlosskMSClient
```

Then:

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.local.yml \
  up -d --build postgres clamav api frontend caddy
```

- Frontend: http://localhost:8081
- API: http://localhost:8080
- Seeded admin: `daorsahyseni@gmail.com` / `P@ssword123`

> Don't run `up` without listing services — `docker-compose.prod.yml` also has a Jenkins
> container that binds port 8080.

## Run it (local dev)

```bash
docker compose up postgres clamav          # infra only

cd flossk-ms && dotnet run --project FlosskMS.API      # API  → :5267, Swagger at /swagger
cd flossk-webclient && npm install && npm start        # web  → :4200
```

## Layout

```
flossk-ms/            .NET solution
  FlosskMS.API/       controllers, SignalR hubs, Program.cs
  FlosskMS.Business/  services, DTOs, domain events
  FlosskMS.Data/      EF Core context, entities, migrations, seeder
  FlosskMS.Tests/     xUnit
flossk-webclient/     Angular 20 app
docs/                 feature docs
docker-compose.*.yml  dev / prod / local overrides
Jenkinsfile           CI: test + deploy to root.flossk.org
```

## Notes

- The API runs EF Core migrations and seeds roles + the admin user on every start.
- Add a migration: `dotnet ef migrations add <Name> --project FlosskMS.Data --startup-project FlosskMS.API`
- Tests: `dotnet test flossk-ms/FlosskMS.slnx`
- Config is all environment variables (`__` = nested key); `SmtpSettings__*` and
  `VapidSettings__*` are optional and those features no-op when unset.
- Door access control: see [`docs/ACCESS_CONTROL.md`](docs/ACCESS_CONTROL.md).
- `docker-compose.dev.yml` is infra-only; `docker-compose.prod.yml` is the full stack;
  `docker-compose.local.yml` just adds host port mappings for local use.
