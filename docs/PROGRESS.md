# Progress Log

Tracks completed work, remaining work, known issues and decisions made during implementation. Architectural decisions D1–D17 and product decisions Q1–Q5 are recorded in [ARCHITECTURE.md](ARCHITECTURE.md).

## Phase status

| Phase | Status |
|-------|--------|
| 1. Foundation | ✅ Complete (2026-11-09), Docker Compose stack verified |
| 2. Auth & permissions | ⏭ Next |
| 3a. Orgs, roster, groups, teams, memberships | Not started |
| 3b. Schedules, sessions, attendance | Not started |
| 3c. Fees & payments | Not started |
| 4. Player experience | Not started |
| 5. Community | Not started |
| 6. Hardening & deploy prep | Not started |

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
