# Jenkins Local Container

This folder provides a permanent Jenkins image for this repository with:

- `dotnet` SDK 10 preinstalled
- `sshpass` preinstalled
- `git` and `openssh-client` preinstalled
- ICU libraries preinstalled (`libicu-dev`)

## Start Jenkins

From the repository root (`flossk/`), choose one compose file and start Jenkins:

```bash
docker compose -p flossk-jenkins -f docker-compose.dev.yml up -d --build jenkins
```

Or with the production compose file:

```bash
docker compose -p flossk-jenkins -f docker-compose.prod.yml up -d --build jenkins
```

Open Jenkins at:

- http://localhost:8080

Get unlock password:

```bash
docker exec flossk-jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

## Verify Required Tools

```bash
docker exec -it flossk-jenkins sh -lc 'dotnet --info && sshpass -V && git --version && ssh -V'
```

## Use With This Repository

1. Create or update your Jenkins Pipeline job to read `Jenkinsfile` from Git.
2. Add server credential in Jenkins Credentials with ID:
   - `6e54816b-437d-476f-9a32-52bd07a3092a`
3. Run the pipeline.

## Stop Jenkins

```bash
docker compose -p flossk-jenkins -f docker-compose.dev.yml down
```

Or if you started it with production compose:

```bash
docker compose -p flossk-jenkins -f docker-compose.prod.yml down
```

## Reset Jenkins Data (Destructive)

```bash
docker compose -p flossk-jenkins -f docker-compose.dev.yml down -v
```

Or if you started it with production compose:

```bash
docker compose -p flossk-jenkins -f docker-compose.prod.yml down -v
```
