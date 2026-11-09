# Progress Log

Tracks completed work, remaining work, known issues and decisions made during implementation. Architectural decisions D1–D17 and product decisions Q1–Q5 are recorded in [ARCHITECTURE.md](ARCHITECTURE.md).

## Phase status

| Phase | Status |
|-------|--------|
| 1. Foundation | ✅ Complete (2026-11-09), Docker Compose stack verified |
| **Frontend migration: Vite → Next.js** | 🔄 In progress: Stage 2 of 7 done (see below) |
| 2. Auth & permissions | ⏭ After the migration |
| 3a. Orgs, roster, groups, teams, memberships | Not started |
| 3b. Schedules, sessions, attendance | Not started |
| 3c. Fees & payments | Not started |
| 4. Player experience | Not started |
| 5. Community | Not started |
| 6. Hardening & deploy prep | Not started |

---

## Frontend migration: React + Vite → Next.js 16 (App Router)

Goal: server-rendered, indexable public pages; Express stays the only backend. The plan (audit, route map, risks) was reviewed on 2026-11-09.

| Stage | Status |
|-------|--------|
| 1. Audit & plan | ✅ |
| 2. Next.js foundation | ✅ 2026-11-10 |
| 3. Route migration (`/player`, `/manage`, auth shells, error/loading) | ⏭ Next |
| 4. SEO (metadata, JSON-LD, sitemap, robots, Sports pages) | Pending |
| 5. Backend integration (server fetch layer, session check) | Pending |
| 6. Docker production image + Nginx reverse proxy | Pending |
| 7. Validation | Pending |

**Decisions awaiting confirmation** (needed from Stage 3 on): single `/manage` dashboard vs `/coach` + `/organiser`; refresh cookie `Path=/; SameSite=Lax` + `GET /auth/session`; pulling the read-only Sports catalogue forward; Nginx in front of Next.js in production. Decision 5 (colours in `theme.ts`) has been implemented.

### Stage 2 delivered
- **Toolchain:**
  - Next.js 16.4.6 pinned (Turbopack builds), Tailwind 4 via `@tailwindcss/postcss`, `next/jest` (SWC)
  - Vite, React Router, ts-jest (frontend) and identity-obj-proxy removed
  - `@next/eslint-plugin-next` rules (recommended + core web vitals) added to the flat config
- **Config:**
  - `next.config.ts`: standalone output traced from the repo root, repo-root `.env` loaded, `/api` rewrite in dev only (via `API_PROXY_TARGET`), Cloudinary image host
- **Colours in one file:** `packages/shared/src/theme.ts`
  - holds the palette and light/dark surface roles; the root layout renders it as CSS variables
  - `globals.css` maps the variables to semantic Tailwind classes; the favicon (`app/icon.tsx`) and `viewport.themeColor` read the same file
  - brand colours were removed from `brand.ts`
  - all components moved off `slate-*`/`red-*`/… onto semantic tokens with identical rendered values
  - a design-token guard test fails on any raw hex value or palette class in `src`
- **Hydration safety:**
  - a blocking `themeInitScript` sets the `dark` class before paint
  - ThemeContext and uiSlice no longer read `localStorage` during render
  - ThemeToggle picks its icon with CSS, so server and client output match
  - `StoreProvider` creates one store per instance and restores and persists the active organisation after mount
- **Rendering split:**
  - root layout, public layout, landing page, 404 and player shell are Server Components
  - `ThemeToggle`, `ApiStatus`, `NavItemLink` (active state), `ManageLayout` (drawer) and providers are the only Client Components
- **Fonts:** `next/font` self-hosts Inter, so the Google Fonts request is gone.
- **Paths:** player routes move from `/app/*` to `/player/*`, and Discover becomes public `/discover` (routes themselves come in Stage 3).
- **Env and Docker:**
  - `VITE_*` renamed to `NEXT_PUBLIC_*`, new `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_BRAND_DESCRIPTION`
  - frontend dev port moved from 5173 to 3000 (Compose, `APP_URL`, backend CORS default)
  - dev container keeps `.next` in a container volume and runs `next dev --webpack` with polling

### Stage 2 verification
- Frontend tests: 61 passing (was 24). Every previous assertion is kept. New tests cover server-render storage access, per-instance stores, active nav state, capability-filtered drawer, theme serialisation and override validation, and the token guard.
- Backend tests: 22 passing, unchanged.
- `tsc` (all workspaces), ESLint: clean. `next build`: succeeds; `/` is prerendered with hourly revalidation.
- Standalone server (`.next/standalone/apps/frontend/server.js`): HTML contains the landing `<h1>`, `<title>`, theme CSS variables and the theme script; `/nope` returns 404; `/icon` returns a PNG; no `X-Powered-By` header; Inter is self-hosted.
- Docker dev: frontend container serves `/` (200) and proxies `/api/v1/health` to Express (`mongo: up, redis: up`). Hot reload from a host edit took about 10 s.

### Known issues (migration)
- **Production frontend image is broken until Stage 6.** The Dockerfile's `build`/`prod` stages still target Vite and static Nginx. The dev stage works.
- `/login`, `/register`, `/discover`, `/player/*` and `/manage/*` return 404 until Stage 3. The layouts exist and are tested.
- Turbopack doesn't detect bind-mount changes in Docker on Windows, so the container uses webpack (`dev:docker`). Local `npm run dev` still uses Turbopack.
- Next warns about a slow filesystem for `.next/dev` inside the container on Windows. It works, but first compiles take a few seconds.

---

## Phase 1: Foundation

### Delivered
- **Monorepo:** npm workspaces (`apps/backend`, `apps/frontend`, `packages/shared`), shared `tsconfig.base.json`, ESLint (flat config) and Prettier, EditorConfig, LF line endings enforced through `.gitattributes`.
- **Shared package:** brand config with env overrides, capability and role constants, error codes, Nigerian states and Lagos areas, pagination zod schema, API envelope and health types.
- **Backend:**
  - env validation (zod; fails fast with readable errors)
  - pino logging with secret redaction and request IDs
  - helmet, CORS allow-list, 100 kb JSON limit, simple query parser
  - central error handler that maps ApiError, Zod, Mongoose cast/validation, duplicate-key and body-parser errors, and never leaks internals on 500
  - `validate()` middleware that passes only parsed input to controllers
  - response helpers and pagination/sort helpers with an allow-list
  - MongoDB connection with `sanitizeFilter` (blocks operator injection) and `strictQuery`
  - optional Redis client (no offline queue, backoff reconnect)
  - cache-aside service that falls back on any Redis failure, with namespace-version invalidation
  - `GET /api/v1/health` (Mongo down → `down`/503; Redis down → `degraded`)
  - graceful shutdown
- **Frontend:**
  - Vite 8 + React 19 + Tailwind 4, with brand colours as CSS variables feeding the `brand-*`/`accent-*` scales
  - Redux store with RTK Query `baseApi` and `ui` slice (active org persisted)
  - ThemeContext (light/dark/system, safe storage)
  - Public, Player (mobile bottom tabs) and Manage (sidebar plus mobile drawer) layouts
  - landing page, 404 page, live API status indicator
  - shared `QueryState` component for loading/error/empty/success
  - capability-filtered navigation config
- **Docker:**
  - multi-stage Dockerfiles (`dev`/`build`/`prod`) for both apps; the prod backend runs as a non-root user with production dependencies only, and the prod frontend is served by Nginx
  - dev `docker-compose.yml` with Mongo replica set (auto-initiated by its health check), Redis, health checks, `depends_on` readiness, bind mounts with container-only `node_modules`
  - production Nginx config (SPA fallback, `/api` proxy, security headers, caching)

### Tests (all passing)
- Backend, 22 tests: health (ok / down), error envelope paths (validation, mass assignment, 403, hidden 500, 409 duplicate, 413, 404, malformed JSON, security headers), transaction rollback on the replica set, cache fallback and invalidation, pagination and sort allow-list.
- Frontend, 24 tests: Button, QueryState (all four states), ThemeContext (toggle, persistence, blocked storage), ui slice persistence, capability-based nav filtering, routes and layouts (landing with live/failed API status, 404, player tabs, management drawer).

### Implementation decisions
| Decision | Why |
|----------|-----|
| TypeScript pinned to **6.0** at the root | npm `latest` is TS 7 (native compiler), which ts-jest doesn't support yet (`typescript <7`). Move to 7 once ts-jest supports it. |
| Backend and shared compile to **CommonJS** (`module: NodeNext`, no `"type": "module"`) | Jest + ts-jest work without experimental ESM flags. The frontend stays ESM through Vite. |
| Shared package consumed **from source** in dev and tests, **from `dist`** in the production backend | Shared edits hot-reload with no build step. The prod image runs plain compiled JS. |
| Jest `globalSetup` starts **one** in-memory replica set; each suite uses its own database | Fast, isolated tests (about 6 s) that exercise real transactions. |
| Test helper passes `runtimeAdapters: { os }` to the MongoDB driver | Driver 7.x loads `os` with a dynamic `import()`, which Jest's VM sandbox rejects. Without this, the handshake goes out without client metadata. Tests only; production is unaffected. |
| Custom Jest environment `apps/frontend/jest.environment.cjs` | jsdom lacks the Fetch API (`Request`/`Response`), which React Router and RTK Query need. This exposes Node's built-in versions. |
| Frontend tests import `@/config/env` through a stub | `import.meta.env` doesn't exist under Jest. `src/config/env.ts` is the only module that reads it. |
| **No BrandingContext** (the architecture doc mentioned one) | Brand config is static, so a plain module import is simpler. Context is used only for the theme. |
| HTTP client is RTK Query's `fetchBaseQuery`, not Axios | Allowed by the spec ("or equivalent"). One less dependency, and it's built into RTK Query's caching. |
| Global rate limiting moved to Phase 2 | It's most useful on auth endpoints, and it needs the Redis store wired with an in-memory fallback. |
| `docker-compose.prod.yml` deferred to Phase 6 | Matches the phase plan. The prod Dockerfile stages and Nginx config already exist. |

### Known issues and notes
- **Docker Compose verified:** all four services healthy. `/api/v1/health` returns `ok` with `mongo: up, redis: up`, both directly on :4000 and through the Vite proxy on :5173.
- **Host port clashes:** published ports are configurable (`MONGO_HOST_PORT`, `REDIS_HOST_PORT`, `BACKEND_HOST_PORT`, `FRONTEND_HOST_PORT`). On the dev machine, a Redis in WSL holds 6379, so the local `.env` publishes the container's Redis on 6380.
- Placeholder pages (`UpcomingFeaturePage`) fill the player and management routes until their phases. They show no fake data.
- Links to `/login`, `/register` and `/discover` lead to the 404 page until Phases 2 and 4.
- Dev Compose binds Mongo and Redis to `127.0.0.1` only and runs them without auth (local dev). The production compose (Phase 6) adds Mongo auth with a keyfile and no published ports.
- The frontend bundle is about 490 kB (153 kB gzipped). Route-level code splitting will be added as feature pages land.

---

## Next: Phase 2 (Auth & permissions)
User and profile models, refresh-token rotation, email verification and password reset (log provider in dev, SendGrid in prod), capability requests with platform-admin approval, auth and capability middleware, policy helpers, Sports catalogue + seed (including the admin user), rate limiting, frontend auth pages, re-auth base query, route guards.
