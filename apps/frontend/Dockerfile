# syntax=docker/dockerfile:1
# Build context: repository root (needs the workspace lockfile and packages/shared).

FROM node:22-alpine AS base
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

# ---- build static assets ----
FROM deps AS build
# Public, build-time values only. Never pass secrets as VITE_* variables.
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_BRAND_NAME
ARG VITE_BRAND_TAGLINE
ARG VITE_BRAND_SUPPORT_EMAIL
ARG VITE_BRAND_PRIMARY_COLOR
ARG VITE_BRAND_ACCENT_COLOR
ARG VITE_BRAND_LOGO_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_BRAND_NAME=$VITE_BRAND_NAME \
    VITE_BRAND_TAGLINE=$VITE_BRAND_TAGLINE \
    VITE_BRAND_SUPPORT_EMAIL=$VITE_BRAND_SUPPORT_EMAIL \
    VITE_BRAND_PRIMARY_COLOR=$VITE_BRAND_PRIMARY_COLOR \
    VITE_BRAND_ACCENT_COLOR=$VITE_BRAND_ACCENT_COLOR \
    VITE_BRAND_LOGO_URL=$VITE_BRAND_LOGO_URL
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/frontend apps/frontend
RUN npm run build -w @fitgeng/frontend

# ---- production: Nginx serves the SPA and proxies /api to the backend ----
FROM nginx:1.27-alpine AS prod
COPY infrastructure/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1
