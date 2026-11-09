# FitGeng

A sports community platform for the Nigerian market. Players discover and join sports groups. Coaches and organisers manage rosters, schedules, attendance, membership fees and events.

> Working name. Brand name, colours and logo can be configured. See [Branding](#branding).

- **Architecture and data model:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Progress, known issues and decisions log:** [docs/PROGRESS.md](docs/PROGRESS.md)

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS 4, Redux Toolkit + RTK Query, React Router 7 |
| Backend | Node 22, Express 5, TypeScript, Mongoose 9 (MongoDB 8 replica set), ioredis |
| Shared | `@fitgeng/shared`: zod schemas, constants, API types |
| Testing | Jest, React Testing Library, Supertest, mongodb-memory-server |
| Infra | Docker, Docker Compose, Nginx |

## Repository layout

```text
apps/backend       Express API (modular monolith: src/modules/<feature>)
apps/frontend      React SPA (public site, player app, management dashboard)
packages/shared    Code shared by both apps
infrastructure/    Nginx config and Docker helpers
docs/              Architecture and progress records
```

## Getting started

### Option A: everything in Docker (recommended)

Requirements: Docker Desktop.

```bash
cp .env.example .env          # optional for Phase 1; Compose provides defaults
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend (Vite) | http://localhost:5173 |
| API | http://localhost:4000/api/v1/health |
| MongoDB | `mongodb://localhost:27017/?directConnection=true` |
| Redis | `redis://localhost:6379` |

If a port is already in use on your machine (e.g. `ports are not available ... 6379` because Redis is running in WSL), set `MONGO_HOST_PORT`, `REDIS_HOST_PORT`, `BACKEND_HOST_PORT` or `FRONTEND_HOST_PORT` in `.env`. Containers talk to each other over Docker's internal network, so only host-side tools see the change.

Source folders are bind-mounted, so edits hot-reload. MongoDB runs as a single-node replica set (required for transactions). Its health check initialises the set on first start.

### Option B: run the apps locally, data stores in Docker

Requirements: Node ≥ 22.12, npm ≥ 10.

```bash
npm install
cp .env.example .env
docker compose up -d mongo redis
npm run dev:backend      # http://localhost:4000
npm run dev:frontend     # http://localhost:5173 (proxies /api to :4000)
```

When connecting from the host, keep `directConnection=true` in `MONGO_URI`. The replica-set member advertises the Docker hostname `mongo`, which the host can't resolve.

## Scripts (repo root)

| Command | Purpose |
|---------|---------|
| `npm test` | Run all test suites (backend + frontend) |
| `npm run typecheck` | Type-check every workspace |
| `npm run lint` | ESLint across the repo |
| `npm run build` | Build shared, backend and frontend |

The first backend test run downloads a MongoDB binary (about 80 MB, cached afterwards).

## Configuration

All configuration comes from environment variables. [.env.example](.env.example) lists every variable and the phase that uses it. The backend validates its environment at startup and exits with a clear message if something is missing or invalid.

Never commit `.env`. Variables prefixed `VITE_` are bundled into the browser code, so they must never contain secrets.

## Branding

Defaults live in [packages/shared/src/brand.ts](packages/shared/src/brand.ts). Override them per deployment with `VITE_BRAND_*` (frontend) and `BRAND_*` (backend emails). Colours become CSS variables, and Tailwind generates the `brand-*` and `accent-*` scales from them, so no component hardcodes a brand colour.

## API conventions

- Base path `/api/v1`
- Success: `{ "data": ..., "meta"?: { page, limit, total, totalPages } }`
- Error: `{ "error": { "code", "message", "details"?, "requestId" } }`
- Every response carries an `X-Request-Id` header for tracing.
