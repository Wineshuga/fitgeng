# syntax=docker/dockerfile:1
# Build context: repository root (needs the workspace lockfile and packages/shared).

FROM node:22-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/

FROM base AS deps
RUN npm ci --workspace @fitgeng/frontend --workspace @fitgeng/shared --include-workspace-root

# ---- development: Next.js dev server, source bind-mounted by docker-compose ----
FROM deps AS dev
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/frontend apps/frontend
EXPOSE 3000
CMD ["npm", "run", "dev", "-w", "@fitgeng/frontend"]

# ---- production build (Next.js standalone output) ----
FROM deps AS build
# Public, build-time values: inlined into browser code, so never pass secrets here.
# NEXT_PUBLIC_SITE_URL must be the real public origin (canonical URLs, sitemap, Open Graph).
ARG NEXT_PUBLIC_SITE_URL=http://localhost:8080
ARG NEXT_PUBLIC_API_BASE_URL=/api/v1
ARG NEXT_PUBLIC_BRAND_NAME
ARG NEXT_PUBLIC_BRAND_TAGLINE
ARG NEXT_PUBLIC_BRAND_DESCRIPTION
ARG NEXT_PUBLIC_BRAND_SUPPORT_EMAIL
ARG NEXT_PUBLIC_BRAND_PRIMARY_COLOR
ARG NEXT_PUBLIC_BRAND_ACCENT_COLOR
ARG NEXT_PUBLIC_BRAND_LOGO_URL
# Search Console token rendered as a <meta> tag (public by design).
ARG GOOGLE_SITE_VERIFICATION
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_BRAND_NAME=$NEXT_PUBLIC_BRAND_NAME \
    NEXT_PUBLIC_BRAND_TAGLINE=$NEXT_PUBLIC_BRAND_TAGLINE \
    NEXT_PUBLIC_BRAND_DESCRIPTION=$NEXT_PUBLIC_BRAND_DESCRIPTION \
    NEXT_PUBLIC_BRAND_SUPPORT_EMAIL=$NEXT_PUBLIC_BRAND_SUPPORT_EMAIL \
    NEXT_PUBLIC_BRAND_PRIMARY_COLOR=$NEXT_PUBLIC_BRAND_PRIMARY_COLOR \
    NEXT_PUBLIC_BRAND_ACCENT_COLOR=$NEXT_PUBLIC_BRAND_ACCENT_COLOR \
    NEXT_PUBLIC_BRAND_LOGO_URL=$NEXT_PUBLIC_BRAND_LOGO_URL \
    GOOGLE_SITE_VERIFICATION=$GOOGLE_SITE_VERIFICATION
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/frontend apps/frontend
# No API is reachable during an image build. Data pages are built on first request (ISR),
# and pages prerendered here fall back gracefully until their first regeneration.
RUN npm run build -w @fitgeng/frontend

# ---- production runtime: standalone server only (no full node_modules), non-root ----
FROM node:22-alpine AS prod
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app
# The ISR cache is written under .next at runtime, so the app user must own it.
COPY --from=build --chown=node:node /app/apps/frontend/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=build --chown=node:node /app/apps/frontend/public ./apps/frontend/public
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/robots.txt >/dev/null || exit 1
CMD ["node", "apps/frontend/server.js"]
