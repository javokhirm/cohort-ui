# syntax=docker/dockerfile:1
#
# Builds ONE Vite SPA from this pnpm/turbo monorepo and serves its static
# `dist/` from a tiny nginx container. Which app is chosen by the APP build-arg
# (admin | internal-platform). Vite env vars are compile-time, so
# VITE_API_ORIGIN / VITE_APP_ENV are baked in here (per environment) via
# build-args. TLS, compression and security headers live at the edge Caddy
# (cohort-be/deploy/Caddyfile) — this image only serves plain HTTP on :80
# inside the `edge` network.
#
#   docker build --build-arg APP=admin \
#                --build-arg VITE_API_ORIGIN=https://api.cohort.uz .

# ---------- base ----------
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

# ---------- deps (cached: busts only when a manifest or the lockfile changes) ----------
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/internal-platform/package.json           ./apps/internal-platform/
COPY apps/admin/package.json           ./apps/admin/
COPY apps/teacher/package.json           ./apps/teacher/
COPY apps/portal/package.json            ./apps/portal/
COPY packages/api-client/package.json  ./packages/api-client/
COPY packages/ui/package.json          ./packages/ui/
COPY packages/utils/package.json       ./packages/utils/
COPY packages/i18n/package.json        ./packages/i18n/
COPY packages/eslint-config/package.json      ./packages/eslint-config/
COPY packages/typescript-config/package.json  ./packages/typescript-config/
RUN pnpm install --frozen-lockfile

# ---------- builder ----------
FROM deps AS builder
ARG APP
ARG VITE_API_ORIGIN
ARG VITE_APP_ENV=production
ENV VITE_API_ORIGIN=$VITE_API_ORIGIN
ENV VITE_APP_ENV=$VITE_APP_ENV
COPY . .
# turbo builds the target app + its workspace deps (^build) only.
RUN pnpm turbo run build --filter=${APP}

# ---------- runtime (static files served by nginx) ----------
FROM nginx:1.28-alpine AS runtime
ARG APP
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/${APP}/dist /usr/share/nginx/html
EXPOSE 80
