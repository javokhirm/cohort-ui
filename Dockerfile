# syntax=docker/dockerfile:1
#
# Builds ONE Vite SPA from this pnpm/turbo monorepo and serves its static
# `dist/` from a tiny Caddy container. Which app is chosen by the APP build-arg
# (internal | admin). Vite env vars are compile-time, so VITE_API_ORIGIN /
# VITE_APP_ENV are baked in here (per environment) via build-args.
#
#   docker build --build-arg APP=internal \
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
COPY packages/api-client/package.json  ./packages/api-client/
COPY packages/ui/package.json          ./packages/ui/
COPY packages/utils/package.json       ./packages/utils/
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

# ---------- runtime (static files served by Caddy) ----------
FROM caddy:2-alpine AS runtime
ARG APP
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/apps/${APP}/dist /srv
EXPOSE 80
