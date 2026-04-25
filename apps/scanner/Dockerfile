# Flintmere scanner — Next.js production image for Coolify
# Multi-stage build: deps → build → runtime
# Runs pnpm at build time, standalone Next.js output at runtime.

# ---- deps ----
FROM node:22-alpine AS deps
# OpenSSL required for Prisma engine binary detection on Alpine. Without this,
# prisma postinstall warns "failed to detect libssl version, defaulting to
# openssl-1.1.x" and downloads the wrong query engine binary.
RUN apk add --no-cache openssl
RUN corepack enable
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/scanner/package.json apps/scanner/package.json
COPY packages/scoring/package.json packages/scoring/package.json
COPY packages/llm/package.json packages/llm/package.json
RUN pnpm install --frozen-lockfile

# ---- build ----
FROM node:22-alpine AS build
RUN apk add --no-cache openssl
RUN corepack enable
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/scanner/node_modules ./apps/scanner/node_modules
COPY --from=deps /repo/packages ./packages
COPY . .
# Build workspace packages first — both @flintmere/scoring and @flintmere/llm
# resolve via their package.json `exports` map to ./dist/index.js, which only
# exists after their tsc build runs.
RUN pnpm -r --filter "@flintmere/*" build
# pnpm v9 requires `exec` to invoke a binary; bare `pnpm prisma generate`
# is parsed as "run a script named prisma" and silently no-ops.
RUN pnpm -F scanner exec prisma generate
RUN pnpm -F scanner build

# ---- runtime ----
FROM node:22-alpine AS runtime
# openssl for Prisma engine; curl for Coolify healthcheck (alpine ships
# neither by default). Bundling both in one apk add to keep layers minimal.
RUN apk add --no-cache openssl curl
RUN addgroup -S flintmere && adduser -S flintmere -G flintmere
# Install Prisma CLI globally so `prisma migrate deploy` runs without an npx
# network fetch at boot. Version pinned to match @prisma/client in lockfile.
RUN npm install -g prisma@5.22.0
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# Bind Next.js standalone server to all interfaces, not the container hostname.
# Docker auto-sets HOSTNAME to the container ID; without this override Next.js
# reads that and binds to a single interface, leaving localhost unreachable
# (Coolify's in-container healthcheck `wget localhost:port` then gets ECONNREFUSED).
ENV HOSTNAME=0.0.0.0

# Next.js standalone output ships its own minimal node_modules. With
# outputFileTracingRoot=repo root in next.config.ts, server.js lands at
# /app/apps/scanner/server.js and traces the @flintmere/scoring dist tree
# + the @prisma/client engine binaries into .next/standalone/.
COPY --from=build /repo/apps/scanner/.next/standalone ./
COPY --from=build /repo/apps/scanner/.next/static ./apps/scanner/.next/static
# No apps/scanner/public/ dir — favicon/og-image/icon are handled by file-based
# routing in src/app/ (icon.svg, apple-icon, opengraph-image, score/[shop]/opengraph-image).
COPY --from=build /repo/apps/scanner/prisma ./apps/scanner/prisma

USER flintmere
EXPOSE 3000

# Migrations at container start, not build time (build container can't reach DB)
CMD ["sh", "-c", "cd apps/scanner && prisma migrate deploy && node server.js"]
