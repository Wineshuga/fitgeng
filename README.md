# FitGeng

A sports community platform for the Nigerian market. Players discover and join sports groups. Coaches and organisers manage rosters, schedules, attendance, membership fees and events.

> Working name. Brand name, colours and logo can be configured. See [Branding](#branding).

- **Architecture and data model:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Progress, known issues and decisions log:** [docs/PROGRESS.md](docs/PROGRESS.md)

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Redux Toolkit + RTK Query |
| Backend | Node 22, Express 5, TypeScript, Mongoose 9 (MongoDB 8 replica set), ioredis |
| Shared | `@fitgeng/shared`: zod schemas, constants, API types |
| Testing | Jest, React Testing Library, Supertest, mongodb-memory-server |
| Infra | Docker, Docker Compose, Nginx |

## Repository layout

```text
apps/backend       Express API (modular monolith: src/modules/<feature>)
apps/frontend      Next.js app (server-rendered public site, player app, management dashboard)
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
| Frontend (Next.js) | http://localhost:3000 |
| API | http://localhost:4000/api/v1/health |
| MongoDB | `mongodb://localhost:27017/?directConnection=true` |
| Redis | `redis://localhost:6379` |

If a port is already in use on your machine (e.g. `ports are not available ... 6379` because Redis is running in WSL), set `MONGO_HOST_PORT`, `REDIS_HOST_PORT`, `BACKEND_HOST_PORT` or `FRONTEND_HOST_PORT` in `.env`. Containers talk to each other over Docker's internal network, so only host-side tools see the change.

Source folders are bind-mounted, so edits hot-reload. In the container, the Next.js dev server uses webpack with polling, because Turbopack misses file changes on Windows/macOS bind mounts.

After dependencies change (e.g. a pull that touches `package.json`), recreate the containers' `node_modules` volumes with `docker compose up -d --build --renew-anon-volumes`. Otherwise Compose reuses the old volume and you'll see errors like `next: not found`.

MongoDB runs as a single-node replica set (required for transactions). Its health check initialises the set on first start.

### Option B: run the apps locally, data stores in Docker

Requirements: Node ≥ 22.12, npm ≥ 10.

```bash
npm install
cp .env.example .env
docker compose up -d mongo redis
npm run dev:backend      # http://localhost:4000
npm run dev:frontend     # http://localhost:3000 (proxies /api to :4000)
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

Never commit `.env`. Variables prefixed `NEXT_PUBLIC_` are inlined into browser code at build time, so they must never contain secrets. Server-only settings (e.g. `API_PROXY_TARGET`) have no prefix and never reach the browser.

## Branding

- **Identity** (name, tagline, description, contact, logo): [packages/shared/src/brand.ts](packages/shared/src/brand.ts). Override per deployment with `NEXT_PUBLIC_BRAND_*` (frontend) and `BRAND_*` (backend emails).
- **Colours, one file:** [packages/shared/src/theme.ts](packages/shared/src/theme.ts) defines the brand, accent, status and neutral colours, plus the light/dark surface roles. The root layout writes them as CSS variables. Tailwind exposes them as semantic classes (`bg-surface`, `text-fg-muted`, `border-line`, `brand-600`, `text-danger`, …), and the favicon and browser theme colour read the same file. Change a colour there and it changes everywhere. A test fails if a component uses a raw hex value or a built-in Tailwind palette class (`slate-*`, `red-*`, …).

## API conventions

- Base path `/api/v1`
- Success: `{ "data": ..., "meta"?: { page, limit, total, totalPages } }`
- Error: `{ "error": { "code", "message", "details"?, "requestId" } }`
- Every response carries an `X-Request-Id` header for tracing.
