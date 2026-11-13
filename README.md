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

After dependencies change (e.g. a pull that touches `package.json`), recreate the containers' `node_modules` volumes with `docker compose up -d --build --renew-anon-volumes`. Otherwise Compose reuses the old volume and you'll see errors like `next: not found` or `Cannot find module 'argon2'`.

**After editing `.env`, run `docker compose up -d`.** Containers read `.env` when they are created, so restarting them (or Docker Desktop restarting them) keeps the old values. If the API is unhealthy, check `docker compose logs backend`: it refuses to start with a clear message when a required variable such as `JWT_ACCESS_SECRET` is missing. The frontend then reports "The service is temporarily unavailable".

**Email in development:** with `EMAIL_PROVIDER=log` (the default), emails aren't sent. Instead:

- After registering, resending a verification link or using "Forgot password", the page shows a clickable **"Development only"** box with the link the email would contain.
- The links are also printed in the API log: `docker compose logs backend | grep -E "verify-email|reset-password"`

This only works in development. The API includes the link only when not in production and emails aren't really sent, and production frontend builds never render it. Set `EMAIL_PROVIDER=sendgrid` (with `SENDGRID_API_KEY`) to send real emails.

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

### Production (Docker)

```bash
# In .env (or the host environment): set the real public origin BEFORE building.
NEXT_PUBLIC_SITE_URL=https://your-domain.example
docker compose -f docker-compose.prod.yml up -d --build
```

- **Nginx** is the only published service (`HTTP_PORT`, default 8080). It routes `/api/*` to Express and everything else to the Next.js server, so the site and API share one origin. Put TLS in front of it (a load balancer, Caddy, or certbot on the host).
- **Frontend:** the Next.js standalone server runs as non-root. Public data pages are built on first request and regenerated in the background (ISR), so the image build doesn't need a running API. Pages prerendered during the build show their fallback (no sports list) until their first regeneration, at most 5 minutes after start.
- **Backend:** compiled JS, production dependencies only, non-root, `TRUST_PROXY=1`.
- **MongoDB and Redis** aren't published. Mongo authentication (keyfile and users) is part of MVP Phase 6, before going live.
- **SEO:** `sitemap.xml` and `robots.txt` are served by Next.js. Submit `https://your-domain/sitemap.xml` in Google Search Console after verifying with `GOOGLE_SITE_VERIFICATION` (HTML-tag method, set at build time).

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
