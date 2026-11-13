# Progress Log

Tracks completed work, remaining work, known issues and decisions made during implementation. Architectural decisions D1–D17 and product decisions Q1–Q5 are recorded in [ARCHITECTURE.md](ARCHITECTURE.md).

## Phase status

| Phase | Status |
|-------|--------|
| 1. Foundation | ✅ Complete (2026-11-09), Docker Compose stack verified |
| **Frontend migration: Vite → Next.js** | 🔄 In progress: Stage 2 of 7 done (see below) |
| 2. Auth & permissions | 🔄 2a (backend auth core) ✅ 2026-11-13 · 2b (frontend auth flows) ⏭ next · 2c (profiles, capability requests, admin) |
| 3a. Orgs, roster, groups, teams, memberships | Not started |
| 3b. Schedules, sessions, attendance | Not started |
| 3c. Fees & payments | Not started |
| 3d. Coaching development (programmes, assessments, progression) | Not started. **Added to MVP 2026-11-10** |
| 4. Player experience | Not started |
| 5a. Community (posts, events, notifications) | Not started |
| 5b. Competitions (league/knockout, fixtures, results, standings) | Not started. **Added to MVP 2026-11-10** |
| 6. Hardening & deploy prep | Not started |

---

## Phase 2a: backend authentication core (2026-11-13)

### Delivered
- **Models:**
  - `User`: capabilities default `['player']`, `passwordHash` never selected by default, `tokenVersion`, `status`, `emailVerifiedAt`
  - `PlayerProfile`: created with the user in one transaction
  - `RefreshToken`: SHA-256 hash, `familyId`, `replacedBy`, TTL index
  - `EmailToken`: verify/reset, single-use, TTL index
- **Endpoints** (`/api/v1/auth/*`): register, verify-email, resend-verification, login, refresh, logout, session (non-rotating), forgot-password, reset-password, plus `GET /me` (Bearer).
- **Security behaviour:**
  - argon2id password hashing; length-based policy (10–128 characters), shared with the frontend through `packages/shared/src/validation/auth.ts`
  - login requires a verified email (`EMAIL_NOT_VERIFIED`) and an active account (`ACCOUNT_SUSPENDED`)
  - same error for a wrong password and an unknown email, with a dummy hash compare to equalise timing
  - no account enumeration: register, resend and forgot-password answer identically, and an existing owner gets an "account exists" email instead of a second account
  - access JWT (HS256, 15 min, `iss`/`aud` checked; claims: `sub`, `tv`, `caps`) in the body only; refresh token only as cookie `fg_rt` (`HttpOnly; SameSite=Lax; Path=/`, `Secure` in production); auth responses carry `Cache-Control: no-store`
  - refresh rotation with an atomic claim and reuse detection (revokes the whole family); a 10 s grace period for concurrent tabs; dead cookies are cleared
  - refresh and logout require `X-Requested-With: fitgeng` and an allowed `Origin`
  - password reset revokes every refresh token and bumps `tokenVersion` (outstanding access tokens die), and verifies the address if needed
  - `authenticate` re-reads the user on every request, so suspension or revocation takes effect immediately; `requirePlatformAdmin` is ready for 2c
  - rate limiting on credential and email endpoints (`AUTH_RATE_LIMIT` per 15 min per IP), Redis-backed with an automatic in-memory fallback
- **Email:** provider abstraction (`log` for dev with links in the console, `memory` for tests, `sendgrid` for production); templates kept separate from logic and coloured from `theme.ts`; delivery failures never fail the request.
- **Config:**
  - new env vars `JWT_ACCESS_SECRET` (required, ≥ 32 characters), `JWT_ACCESS_TTL_SECONDS`, `REFRESH_TOKEN_TTL_DAYS`, `AUTH_RATE_LIMIT`, `EMAIL_PROVIDER`, `SENDGRID_API_KEY`, `EMAIL_FROM_*`
  - production refuses to start without SendGrid; production Compose refuses to start without `JWT_ACCESS_SECRET` and `SENDGRID_API_KEY`
  - a dev secret was generated into the local `.env`
- **Implementation note:** because `sanitizeFilter` is on, server-built operator queries wrap only the operator object in `mongoose.trusted()` (e.g. `expiresAt: notExpired()`). The first attempt wrapped the whole filter, which the sanitiser still neutralised; the tests caught it.

### Verification
- Backend: 71 tests passing (28 new for auth and rate limiting):
  - registration: transactional profile, normalised email, no enumeration
  - verification and resend: single-use links, older links invalidated
  - login: unverified, suspended, identical errors
  - cookie flags; JWT claims; Bearer auth with forged, expired and suspended tokens
  - refresh: rotation, CSRF and Origin checks, theft detection revoking the family, grace window, expiry clearing the cookie
  - session: non-rotating, no tokens
  - logout: per device
  - reset: signs out everywhere and kills old access tokens; reused links rejected; verifies the email
  - rate limit: 429 envelope with the in-memory store
- Typecheck (all workspaces) and ESLint: clean.
- **End-to-end without Docker** (real API on an in-memory MongoDB replica set, production Next.js server), all 14 steps passed:
  1. register → 202
  2. login before verifying → `EMAIL_NOT_VERIFIED`
  3. verification link printed by the log provider
  4. verify → 200
  5. login → access token and `fg_rt` cookie
  6. `/me` with Bearer → 200
  7. `/auth/session` → `memberships: []`
  8. **`/manage` rendered for a real signed-in user** through the server-side session check (no-organisation page for a player)
  9. `/player` → 200
  10. `/manage/ikoyi` → 404 (not a member)
  11. refresh → 200
  12. refresh without the CSRF header → 403
  13. logout → 204
  14. a stale cookie → redirected to login
- **Not yet run:** the new backend in the Docker dev stack (Docker crashed during the rebuild). After Docker is healthy: `docker compose up -d --build --renew-anon-volumes`, because the backend has a new native dependency (argon2).

### Next: 2b (frontend auth flows)
Login, register, verify-email, forgot/reset password pages (shared zod schemas, `safeNextPath`); `auth` slice with the access token in memory; RTK Query base query with Bearer header and a refresh-on-401 mutex; logout; session-aware navigation.

---

## Frontend migration: React + Vite → Next.js 16 (App Router)

Goal: server-rendered, indexable public pages; Express stays the only backend. The plan (audit, route map, risks) was reviewed on 2026-11-09.

| Stage | Status |
|-------|--------|
| 1. Audit & plan | ✅ |
| 2. Next.js foundation | ✅ 2026-11-10 |
| 3. Route migration + unified `/manage` application | ✅ 2026-11-10 |
| 4. SEO + read-only Sports catalogue | ✅ 2026-11-10 |
| 5. Backend integration | ✅ 2026-11-10 |
| 6. Docker production image + Nginx reverse proxy | ✅ 2026-11-13 (images built and run) |
| 7. Validation | ✅ 2026-11-13. **Migration complete** |

**Decisions (all confirmed):** single permission-driven `/manage` app; colours in `theme.ts`; Sports catalogue pulled forward; competition and coaching modules in the MVP (Phases 3d/5b); refresh cookie `fg_rt` with `Path=/; SameSite=Lax` plus non-rotating `GET /auth/session` (D12); Nginx in front of Next.js in production (D13).

### Stage 5 delivered: backend integration
- ARCHITECTURE revised for the confirmed design:
  - D1: Next.js frontend, no API routes or business logic in it
  - D12: `fg_rt` cookie (`HttpOnly; Secure; SameSite=Lax; Path=/`) plus non-rotating `/auth/session`
  - D13: Nginx routes `/api` to Express and the rest to Next.js; dev uses rewrites; server code uses `INTERNAL_API_URL`
  - also updated: §2 layout, §5 route map, §6.1 CSRF rules, §6.4 rendering and state, §6.6 Docker
- `safeNextPath()` (`lib/auth/redirect.ts`): guards the `next` parameter for post-login redirects. It blocks `//host`, absolute URLs, backslash tricks, raw control characters and `javascript:`. 14 tests.
- Already in place from earlier stages: server-side session check (Stage 3), server data client with ISR (Stage 4).

### Stage 6 delivered: production Docker configuration
- **`apps/frontend/Dockerfile`:**
  - `dev` stage unchanged
  - `build` stage takes `NEXT_PUBLIC_*` and `GOOGLE_SITE_VERIFICATION` as build args
  - `prod` stage: `node:22-alpine` running only the standalone server, static assets and `public/`; non-root owner (ISR cache is writable); health check on `/robots.txt`
- **`infrastructure/nginx/default.conf`:** reverse proxy (`/api/` to Express, `/_next/static/` with a one-year immutable cache, everything else to Next.js), forwarded headers and request ID, security headers, gzip, `/healthz`.
- **`docker-compose.prod.yml`** (project `fitgeng-prod`, separate from dev):
  - only `nginx` is published (`HTTP_PORT`, default 8080)
  - frontend gets `INTERNAL_API_URL=http://backend:4000/api/v1`
  - backend runs production with `TRUST_PROXY=1`
  - Mongo (replica set) and Redis are internal only
  - start order follows health checks
  - validated with `docker compose config`
- README: production section (domain before build, TLS in front, Search Console steps).

### Stage 7 validation
- **Tests:** backend 43 passing; frontend 177 passing (18 suites).
- **New hydration test** (`app/__tests__/hydration.test.tsx`):
  - server-renders the landing page (light and stored-dark theme), a sport page, the player layout and the management shell, then hydrates the HTML in jsdom the way a browser would
  - fails on any recoverable hydration error or console error
  - a control case confirms the harness does catch a real mismatch
- **Full monorepo production build** (`npm run build`) with the API deliberately unreachable: succeeds. `/sports/[slug]` is ISR; static generation took 6.7 s.
- `tsc` across all workspaces and ESLint: clean.
- **Earlier live checks** (Stages 3–4, dev Docker and the standalone server): SSR HTML and metadata, sitemap and robots, ISR MISS→HIT, route protection and the cross-container session check.
- **Production Compose run (2026-11-13), through Nginx on :8080:** all 5 services healthy, only Nginx published. 23/23 checks passed: `/healthz`; `/api` routed to Express (Mongo and Redis up); request-ID propagation; landing and `/sports/tennis` SSR content; canonical URL on the public origin; JSON-LD; ISR MISS→HIT; unknown sport 404; `/_next/static` cached 1 year immutable with gzip; no `X-Powered-By`, nginx version hidden, X-Frame-Options and nosniff; sitemap with 9 URLs, no private paths; robots.txt; `/manage` redirect without a cookie and with a forged cookie (API rejects); `/login` renders; per-sport OG image.
- **Fixed during that run:** the first run served a 2-URL sitemap. It had been prerendered during the image build with no API reachable, the Stage 4 known issue showing up for real. `sitemap.ts` is now rendered per request (`force-dynamic`, API data still cached 5 min). After rebuilding, the sitemap listed all 9 URLs immediately.
- **Still open:** a manual real-browser console check (the automated hydration test covers the same ground).

**Docker incidents:** during Stage 7, Docker Desktop's engine crashed ("Docker Desktop is unable to start"), and `wsl -l` hung. With the user's approval, Docker Desktop was stopped and `wsl --shutdown` attempted. It failed with `Wsl/CO_E_SERVER_EXEC_FAILURE`: the Windows `WslService` is stuck in **StopPending**. Recovering needs administrator rights (kill the stuck service and restart it) or a reboot. The production image build that ran just before the crash reported success, but its output couldn't be confirmed, so those images count as unverified. **Resolved 2026-11-13** after the user restarted Windows and WSL; the production stack was then built and verified (above). Docker Desktop crashed again later the same day ("unable to start" while extracting an image layer during a dev rebuild), and port 4000 stayed held by a half-dead `com.docker.backend` process. The Phase 2a end-to-end check was therefore run without Docker (below).

### Stage 4 delivered: Sports catalogue and SEO foundation
- **Backend `sports` module**, pulled forward from Phase 2 (read-only):
  - `Sport` model with an index for the active listing
  - idempotent startup seed of the 7 launch sports; it never overwrites admin edits or deactivation
  - `GET /api/v1/sports` and `GET /api/v1/sports/:slug` (404 for unknown or inactive sports, 400 for malformed slugs, public `Cache-Control`)
  - Redis cache-aside with namespace invalidation, falling back to MongoDB
  - admin create/update/deactivate arrives with auth (Phase 2) and must call `invalidateSportsCache()`
- **Server-side API client** (`lib/api/server.ts`, server-only): uses the internal URL, unwraps the envelope, returns `null` on 404 and throws a typed error otherwise; supports ISR `revalidate` and cache `tags`.
- **SEO toolkit:**
  - `pageMetadata()` builds the title, description, canonical URL, Open Graph and X/Twitter card
  - `JsonLd` escapes `<`, so API content can't close the script tag
  - builders for WebSite, Organization, BreadcrumbList and WebPage; only real data is included (no ratings or addresses)
  - visible `Breadcrumbs` component
- **Pages:**
  - `/sports`: ISR every 5 min, with empty and API-down states
  - `/sports/[slug]`: ISR, no pages built in advance (builds never need the API), unique metadata generated from the sport, breadcrumb and WebPage structured data, related-sports links; 404 for unknown sports
  - landing page: sports links come from the API, plus WebSite and Organization structured data
  - public header and footer link to `/sports`
- **Site-wide:**
  - `sitemap.xml`: home, `/sports` and each active sport with `lastModified`; never private, account or API paths
  - `robots.txt`: disallows `/manage/`, `/player/`, `/api/`; account pages stay crawlable so their `noindex` is seen
  - brand Open Graph images: site default plus a per-sport card
  - root Open Graph and Twitter defaults, Search Console verification via `GOOGLE_SITE_VERIFICATION`

### Stage 4 verification
- Backend: 43 tests (10 new: seed idempotency and admin-edit preservation, listing order, inactive hidden, no internal fields, 404/400, cache hit until invalidated, MongoDB-only path).
- Frontend: 156 tests (37 new: sports pages, unique metadata per sport, JSON-LD content and XSS escaping, related-link failure isolation, 404 and noindex, sitemap contents and exclusions, robots rules, API client).
- **Docker (live):**
  - the backend seeded the sports on restart
  - Redis holds `fg:sports:v0:active` and `fg:sports:v0:slug:tennis`
  - raw HTML of `/sports/tennis` contains the `<h1>`, a unique `<title>` and description, canonical URL, `og:url`, `og:image`, `twitter:card` and BreadcrumbList/WebPage JSON-LD
  - the share image is a valid 1200×630 PNG
  - `sitemap.xml` lists all 9 URLs; `robots.txt` serves the rules
- **Production build with the API deliberately unreachable:** succeeds, and static generation took 8 s.
- **Standalone production server:** `/sports/football` gives MISS then HIT (`x-nextjs-cache`), with `s-maxage=300`; `/sports/curling` returns 404.

### Known issues (Stage 4)
- **Pages prerendered during a build that can't reach the API** (`/`, `/sports`, `sitemap.xml`) serve their fallback (no sports list, or "temporarily unavailable") until their first background regeneration, at most 5 minutes after deploy. Stage 6 should let the image build reach the API, or trigger revalidation after deploy.
- Open Graph images use the renderer's default font (regular weight only). A bundled bold brand font can be added later.
- `/discover?sport=…` links point at the placeholder Discover page (noindex) until Phase 4.
- `NEXT_PUBLIC_SITE_URL` must be the production domain at build time. Otherwise canonical URLs, the sitemap and Open Graph URLs point at localhost.

### Stage 3 delivered: unified management application
- **Shared permission model** (`packages/shared/src/permissions.ts`): permissions grouped into `core`, `coaching` and `competition` families. Effective permissions are the org role's grants ∩ the families the user's capabilities unlock (see ARCHITECTURE §3.3).
- **Backend enforcement** (`apps/backend/src/middleware/authorize.ts`): `requireOrgPermission(permission)` answers 401 when signed out, 404 for non-members and 403 for missing permissions. It's ready for `authenticate` (Phase 2) and `loadOrgContext` (Phase 3a) to fill `req.access`.
- **Module registry** (`features/manage/modules.ts`): 18 modules in 7 sections. Groups, teams, training sessions, events and competitions are separate modules.
- **One shell for every manager:**
  - `ManageShell` renders section-grouped, permission-filtered navigation, the mobile drawer and the user name
  - `OrgSwitcher` keeps the current module when it's allowed in the target organisation
  - the last-used organisation is remembered in a non-sensitive cookie
- **Routes:**
  - `/manage`: the last-used org, else the only org, else a picker; with no orgs, guidance based on capabilities
  - `/manage/[org]`: membership checked on the server (404 for non-members)
  - `/manage/[org]` overview page: lists the modules this user can open
  - `/manage/[org]/[module]`: 404 for unknown modules, real HTTP 403 (`forbidden()`) for missing permissions
  - player area: `/player` and `/player/[section]`
  - auth shells (noindex): `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`
  - public `/discover` (noindex until it lists real data)
  - root `error.tsx`, `forbidden.tsx`, manage `loading.tsx`
- **Server-side session** (`lib/auth/session.ts`, `server-only`): validates the HttpOnly cookie with `GET /auth/session` on `INTERNAL_API_URL`, with one lookup per request via React `cache`. It never returns or renders tokens. An unreachable API is treated as signed out.
- **`proxy.ts`**: cookie-less requests to `/manage/*` and `/player/*` go to `/login?next=…`.
- Replaced the earlier `manageNav` capability filter (which didn't account for org roles) and the Redux `activeOrgId`. The organisation now comes from the URL, so it isn't duplicated in client state.

### Stage 3 verification
- Frontend tests: 119 passing. Covered: module registry, navigation per capability mix, org-coach restrictions, org switcher, drawer, session lookup (no cookie, forwarded cookie, 401, unreachable API), membership 404, module 404/403 by direct URL, `/manage` entry logic, proxy redirects.
- Backend tests: 33 passing, including 11 new permission-matrix and middleware tests (401/404/403/200).
- `next build`: public and auth pages are static, `/manage/*` and `/player/*` are dynamic, the proxy is registered. `tsc` and ESLint are clean.
- Live check (standalone server + real Express app):
  - `/manage`, `/manage/ikoyi/payments` and `/player/schedule` without a cookie: 307 to `/login?next=<path>`
  - with a forged cookie, the Next server called Express `GET /api/v1/auth/session` (cookie redacted in Express logs), got 404 and redirected to login
  - `/login` is served with `noindex`

### Known issues (Stage 3)
- **Management and player areas can't be opened in a browser until Phase 2** provides real sessions (`GET /auth/session`). Every path redirects to `/login`, as designed. The UI is covered by tests with real permission logic.
- The `next` login parameter must be validated as a same-site path when the login form is built (Phase 2), to prevent open redirects.
- Docker Desktop stopped during this stage. The Compose stack wasn't re-run (Compose now also passes `INTERNAL_API_URL` to the frontend).

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
- ~~`/login`, `/register`, `/discover`, `/player/*` and `/manage/*` return 404 until Stage 3.~~ Resolved in Stage 3.
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
