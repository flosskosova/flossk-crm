# FlosskMS Docker Setup

This guide explains how to run the entire FlosskMS application stack using Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (version 20.10 or later)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0 or later)

## Services

The application consists of the following services:

| Service | Description | Port |
|---------|-------------|------|
| **frontend** | Angular 20 application served via Nginx | 4200 |
| **api** | ASP.NET Core 10 REST API | 5267 |
| **postgres** | PostgreSQL 16 database | 5432 |
| **clamav** | ClamAV antivirus scanner | 3310 |

## Quick Start

### 1. Build and Run All Services

From the root `flossk` directory, run:

```bash
docker-compose up --build
```

This will:
- Build the Angular frontend
- Build the ASP.NET Core API
- Start PostgreSQL database
- Start ClamAV antivirus scanner
- Run database migrations and seed data automatically

### 2. Access the Application

Once all services are running:

- **Frontend**: http://localhost:4200
- **API Swagger**: http://localhost:5267/swagger
- **API Direct**: http://localhost:5267/api

### 3. Stop All Services

```bash
docker-compose down
```

To also remove volumes (database data):

```bash
docker-compose down -v
```

## Development Mode

### Run Only Infrastructure (Database + ClamAV)

If you want to develop locally but use Docker for database and ClamAV:

```bash
docker-compose up postgres clamav
```

Then run the API and frontend locally:

```bash
# In flossk-ms directory
cd flossk-ms
dotnet run --project FlosskMS.API

# In flossk-webclient directory (another terminal)
cd flossk-webclient
npm install
npm start
```

## Configuration

### Environment Variables

The API uses `appsettings.Docker.json` for Docker environment configuration. Key settings:

- **Database**: Connects to `postgres` service
- **ClamAV**: Connects to `clamav` service
- **JWT Secret**: Change this in production!

### Customizing Ports

Edit `docker-compose.yml` to change exposed ports:

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # Change 8080 to your desired port
  api:
    ports:
      - "5000:8080"  # Change 5000 to your desired port
```

### Database Credentials

Default credentials (change for production):

```yaml
POSTGRES_USER: postgres
POSTGRES_PASSWORD: postgres_password
POSTGRES_DB: FLOSSK
```

## Troubleshooting

### ClamAV Takes Long to Start

ClamAV needs to download virus definitions on first start. This can take 2-5 minutes. The API will wait for ClamAV to be healthy before starting.

### Database Connection Issues

Ensure PostgreSQL is healthy before the API starts:

```bash
docker-compose logs postgres
```

### Rebuild After Code Changes

```bash
docker-compose up --build
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f frontend
```

### Reset Everything

```bash
docker-compose down -v
docker system prune -f
docker-compose up --build
```

## Production Considerations

Before deploying to production:

1. **Change JWT Secret**: Update `JwtSettings.Secret` in `appsettings.Docker.json`
2. **Change Database Password**: Update `POSTGRES_PASSWORD` in `docker-compose.yml` and connection string
3. **Enable HTTPS**: Add SSL certificates and update Nginx configuration
4. **Set Resource Limits**: Add memory and CPU limits to services
5. **Use External Database**: Consider using managed PostgreSQL service
6. **Add Backup Strategy**: Configure PostgreSQL backups

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Docker Network                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐ │
│  │   Frontend   │────▶     API       ────▶  PostgreSQL   │ |
│  │   (Nginx)    │     │ (ASP.NET)    │     │              │ │
│  │   :4200      │     │   :5267      │     │   :5432      │ │
│  └──────────────┘     └──────────────┘     └──────────────┘ │
│                              │                              │
│                              ▼                              │
│                       ┌──────────────┐                      │
│                       │   ClamAV     │                      │
│                       │   :3310      │                      │
│                       └──────────────┘                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```
