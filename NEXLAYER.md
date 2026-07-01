# Nexlayer — Library-managemet

<!-- nexlayer:meta version=1 analyzed=2026-06-30T16:46:43Z repo=https://github.com/Itsamk-ship-it/Library-managemet branch=main -->

> **For AI agents (Claude Code, Cursor, Gemini CLI, Copilot):**
> This file is the **project context** for this Nexlayer deployment — tech stack, env vars, secrets, live URL.
> For full platform detail (nexlayer.yaml schema, Dockerfile rules, CI/CD, task recipes) read **`nexlayer.skills`** in this repo.
>
> **Critical rules (full detail in `nexlayer.skills`):**
> - Inter-pod refs: `${podName:port}` only — never `localhost` or bare hostnames
> - Docker Hub images: prefix with `mirror.gcr.io/library/` — bare tags fail on the cluster
> - Secrets: set in the Nexlayer dashboard — never commit to `nexlayer.yaml` or Dockerfile
>
> **This file:** `agent-managed` sections update automatically. `user-editable` sections (Local Development Setup, Nexlayer Deployment Plan, Build Notes) are yours — preserved across re-analysis.

## Project Summary
<!-- nexlayer:section agent-managed=project_summary -->
Bookworm is a full-stack library management system allowing users to browse catalogs, borrow/return books, and track reading history, with an admin dashboard for collection management.
<!-- nexlayer:end -->

## Technology Stack
<!-- nexlayer:section agent-managed=tech_stack -->
| Name | Kind | Version | Detected From |
|------|------|---------|---------------|
| React | framework | 18 | README.md |
| Node.js | language | 20 | Dockerfile |
| Express | framework | Not specified | README.md |
| PostgreSQL | database | 16 | docker-compose.yml |
| Redis | database | 7 | docker-compose.yml |
| Prisma | tool | Not specified | README.md |
| Nginx | infra | alpine | Dockerfile |
| TypeScript | language | Not specified | README.md |
<!-- nexlayer:end -->

## Repository Structure
<!-- nexlayer:section agent-managed=structure_map -->
- frontend/ — React SPA source and Vite config
- backend/ — Node.js Express API and business logic
- backend/prisma/ — Database schema and migrations
<!-- nexlayer:end -->

## External Services Required
<!-- nexlayer:section agent-managed=external_deps -->
_No external services detected._
<!-- nexlayer:end -->

## Local Development Setup
<!-- nexlayer:section user-editable=local_setup -->
### Prerequisites

- Node.js >= 18
- Docker
- Docker Compose

### Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
DATABASE_URL=postgresql://library:library@localhost:5432/library
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-key
```

### Steps

1. `docker compose up --build` — Start all services including DB and Cache
2. `docker compose exec backend npx prisma db push` — Initialize database schema
3. `docker compose exec backend npm run seed` — Seed demo data

<!-- nexlayer:end -->

## Nexlayer Setup
<!-- nexlayer:section agent-managed=nexlayer_setup -->
### Pod Environment Variables

| Pod | Variable | Value | Kind |
|-----|----------|-------|------|
| `DATABASE_URL` | `value` | `postgresql://library:${POSTGRES_PASSWORD}@postgres.pod:5432/library?schema=public` | inter-pod |
| `REDIS_URL` | `value` | `redis://redis.pod:6379` | plain |
| `NODE_ENV` | `value` | `production` | plain |
| `POSTGRES_USER` | `value` | `library` | plain |
| `POSTGRES_PASSWORD` | `value` | `library` | plain |
| `POSTGRES_DB` | `value` | `library` | plain |

### nexlayer.yaml

```yaml
application:
  name: library-management
  pods:
    - name: frontend
      servicePorts:
        - 80
      image: "registry.nexlayer.io/user_01kdnss9re3ack631zmxgpra36/library-managemet:9f197d8-fix2"
      path: /
    - name: backend
      servicePorts:
        - 4000
      image: "registry.nexlayer.io/user_01kdnss9re3ack631zmxgpra36/library-managemet:9f197d8-fix2"
      path: /api
      env:
        - name: DATABASE_URL
          value: postgresql://library:${POSTGRES_PASSWORD}@postgres.pod:5432/library?schema=public
        - name: REDIS_URL
          value: redis://redis.pod:6379
        - name: NODE_ENV
          value: production
    - name: postgres
      servicePorts:
        - 5432
      image: mirror.gcr.io/library/postgres:16-alpine
      path: /postgres
      env:
        - name: POSTGRES_USER
          value: library
        - name: POSTGRES_PASSWORD
          value: library
        - name: POSTGRES_DB
          value: library
    - name: redis
      servicePorts:
        - 6379
      image: mirror.gcr.io/library/redis:7-alpine
      path: /redis
```
<!-- nexlayer:end -->

## Nexlayer Deployment Plan
<!-- nexlayer:section user-editable=deployment_plan -->
### Pod Topology

| Pod | Image | Port | Role |
|-----|-------|------|------|
| postgres | mirror.gcr.io/library/postgres:16-alpine | 5432 | database |
| redis | mirror.gcr.io/library/redis:7-alpine | 6379 | cache |
| backend | mirror.gcr.io/library/node:22-alpine | 4000 | web |
| frontend | mirror.gcr.io/library/nginx:alpine | 80 | web |

### Deployment notes

- The backend pod communicates with the database using postgres.pod:5432.
- The backend pod communicates with the cache using redis.pod:6379.
- The frontend pod communicates with the API using backend.pod:4000.
- Official Docker Hub images are mirrored via mirror.gcr.io as per Nexlayer requirements.

<!-- nexlayer:end -->

## Build Notes
<!-- nexlayer:section user-editable=build_notes -->
<!-- Add notes for future builds here — preserved across re-analysis -->
<!-- nexlayer:end -->

## Nexlayer Configuration
<!-- nexlayer:section agent-managed=nexlayer_config -->
**Last deployed:** 2026-07-01T12:24:05Z  
**Live URL:** https://vibrant-wasp-library-management.cloud.nexlayer.ai  
**Runtime:**  · **Port:** auto-detected  
**Deploy branch:** nexlayer  

```yaml
application:
  name: library-management
  pods:
    - name: frontend
      servicePorts:
        - 80
      image: "registry.nexlayer.io/user_01kdnss9re3ack631zmxgpra36/library-managemet:9f197d8-fix2"
      path: /
    - name: backend
      servicePorts:
        - 4000
      image: "registry.nexlayer.io/user_01kdnss9re3ack631zmxgpra36/library-managemet:9f197d8-fix2"
      path: /api
      env:
        - name: DATABASE_URL
          value: postgresql://library:${POSTGRES_PASSWORD}@postgres.pod:5432/library?schema=public
        - name: REDIS_URL
          value: redis://redis.pod:6379
        - name: NODE_ENV
          value: production
    - name: postgres
      servicePorts:
        - 5432
      image: mirror.gcr.io/library/postgres:16-alpine
      path: /postgres
      env:
        - name: POSTGRES_USER
          value: library
        - name: POSTGRES_PASSWORD
          value: library
        - name: POSTGRES_DB
          value: library
    - name: redis
      servicePorts:
        - 6379
      image: mirror.gcr.io/library/redis:7-alpine
      path: /redis
```
<!-- nexlayer:end -->

## Build History
<!-- nexlayer:section agent-managed=build_history -->
| Date | Status | Notes |
|------|--------|-------|
| 2026-07-01T12:18:04Z | analyzed | initial repo analysis |
| 2026-07-01T12:24:05Z | success | deployed https://vibrant-wasp-library-management.cloud.nexlayer.ai |
<!-- nexlayer:end -->




