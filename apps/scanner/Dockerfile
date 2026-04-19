# Flintmere scanner — Next.js production image for Coolify
# Multi-stage build: deps → build → runtime
# Runs pnpm at build time, standalone Next.js output at runtime.

# ---- deps ----
FROM node:22-alpine AS deps
RUN corepack enable
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/scanner/package.json apps/scanner/package.json
COPY packages/scoring/package.json packages/scoring/package.json
COPY packages/llm/package.json packages/llm/package.json
RUN pnpm install --frozen-lockfile

# ---- build ----
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/scanner/node_modules ./apps/scanner/node_modules
COPY --from=deps /repo/packages ./packages
COPY . .
RUN pnpm -F scanner prisma generate
RUN pnpm -F scanner build

# ---- runtime ----
FROM node:22-alpine AS runtime
RUN addgroup -S flintmere && adduser -S flintmere -G flintmere
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Next.js standalone output ships its own minimal node_modules
COPY --from=build /repo/apps/scanner/.next/standalone ./
COPY --from=build /repo/apps/scanner/.next/static ./apps/scanner/.next/static
COPY --from=build /repo/apps/scanner/public ./apps/scanner/public
COPY --from=build /repo/apps/scanner/prisma ./apps/scanner/prisma

USER flintmere
EXPOSE 3000

# Migrations at container start, not build time (build container can't reach DB)
CMD ["sh", "-c", "cd apps/scanner && npx prisma migrate deploy && node server.js"]
