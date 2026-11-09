# syntax=docker/dockerfile:1
# Build context: repository root (needs the workspace lockfile and packages/shared).

FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/

# ---- dependencies (incl. dev) ----
FROM base AS deps
RUN npm ci --workspace @fitgeng/backend --workspace @fitgeng/shared --include-workspace-root

# ---- development: source is bind-mounted by docker-compose ----
FROM deps AS dev
ENV NODE_ENV=development
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/backend apps/backend
EXPOSE 4000
CMD ["npm", "run", "dev", "-w", "@fitgeng/backend"]

# ---- compile ----
FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/backend apps/backend
RUN npm run build -w @fitgeng/shared && npm run build -w @fitgeng/backend

# ---- production runtime: compiled JS + production deps only, non-root ----
FROM node:22-alpine AS prod
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
RUN npm ci --omit=dev --workspace @fitgeng/backend --workspace @fitgeng/shared && npm cache clean --force
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/apps/backend/dist apps/backend/dist
USER node
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/api/v1/health >/dev/null || exit 1
CMD ["node", "apps/backend/dist/server.js"]
