# Flintmere Shopify app — Remix production image for Coolify
# Multi-stage build: deps → build → runtime

# ---- deps ----
FROM node:22-alpine AS deps
RUN corepack enable
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/shopify-app/package.json apps/shopify-app/package.json
COPY packages/scoring/package.json packages/scoring/package.json
COPY packages/llm/package.json packages/llm/package.json
RUN pnpm install --frozen-lockfile

# ---- build ----
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/shopify-app/node_modules ./apps/shopify-app/node_modules
COPY --from=deps /repo/packages ./packages
COPY . .
RUN pnpm -F shopify-app prisma generate
RUN pnpm -F shopify-app build

# ---- runtime ----
FROM node:22-alpine AS runtime
RUN addgroup -S flintmere && adduser -S flintmere -G flintmere
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/shopify-app/node_modules ./apps/shopify-app/node_modules
COPY --from=build /repo/apps/shopify-app/build ./apps/shopify-app/build
COPY --from=build /repo/apps/shopify-app/public ./apps/shopify-app/public
COPY --from=build /repo/apps/shopify-app/package.json ./apps/shopify-app/package.json
COPY --from=build /repo/apps/shopify-app/prisma ./apps/shopify-app/prisma
COPY --from=build /repo/packages ./packages

USER flintmere
EXPOSE 3000

# Migrations + Shopify app start
CMD ["sh", "-c", "cd apps/shopify-app && npx prisma migrate deploy && npm run start"]
