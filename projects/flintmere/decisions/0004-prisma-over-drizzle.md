# 0004 — ORM: Prisma over Drizzle

- **Status:** Accepted
- **Date:** 2026-04-19

## Context

Flintmere's two apps both need Postgres access. The kit's inherited `memory/product-engineering/` files referenced Drizzle (from the allowanceguard template). SPEC.md §6.1 named Prisma as the choice.

Options:

- **Prisma** — mature, code-generation based, excellent type safety, widely used in Shopify app ecosystem.
- **Drizzle** — newer, lighter, SQL-first, better for edge runtimes.
- **Raw `postgres.js` / `pg`** — no ORM, hand-written queries.
- **Kysely** — query builder without full ORM, type-safe.

## Decision

**Prisma across both apps.** One `schema.prisma` file per app (`apps/scanner/prisma/` + `apps/shopify-app/prisma/`) sharing a single Postgres instance via two schemas (`scanner_*` / `app_*`).

## Rationale

### Council

- **#15 Staff engineer** — Prisma's generated types catch schema-drift bugs at compile time. Shopify bulk operation payloads are dense and evolving; strong types matter more than lightweight SQL.
- **#18 DBA** — Prisma's migration file format is more auditable than Drizzle's dialect. `prisma migrate resolve` + rollback tooling is mature.
- **#33 Backend engineer** — the Shopify app ecosystem (templates, tutorials, community packages) defaults to Prisma. Less friction for future hires.
- **#16 QA** — Prisma's dev DB reset (`prisma migrate reset`) makes integration tests deterministic and fast.
- **#34 Debugging** — Prisma Studio is useful for local debugging against a seeded dev DB.
- **#17 Performance** — Prisma's N+1 detection + batching is better-documented than Drizzle's. Concerns about Prisma's query-engine overhead exist but don't meaningfully apply at Flintmere's scale.

### Rejected options

- **Drizzle**: excellent on edge runtimes, but Flintmere's runtime is always a long-running Node process on Coolify — the edge advantage doesn't apply. The allowanceguard team chose Drizzle for EVM-adjacent reasons that don't transfer.
- **Raw `pg` / `postgres.js`**: too much hand-rolled query code for a small team. Type safety suffers.
- **Kysely**: solid query builder, but no migration tooling or schema-as-code. Would need to pair with something else.

### Tradeoffs accepted

- **Prisma query engine binary**: adds ~20MB to the container image. Not a real problem on Coolify.
- **Prisma's abstraction overhead**: small runtime cost per query. Bulk operations go through raw SQL where the overhead would matter (`prisma.$queryRaw`).
- **Migration lock file**: Prisma generates migration SQL we commit. Reviewers (#18 DBA) read the SQL, not the Prisma schema diff, for production migrations.

## Consequences

- `memory/product-engineering/architecture-rules.md` names Prisma as the ORM. (Already updated in the rewrite of 2026-04-19.)
- Each app has its own Prisma schema; they share a Postgres instance but own separate schemas to prevent migration collisions.
- Transactions use `prisma.$transaction()`. No manual `BEGIN`/`COMMIT`.
- Seed scripts (`prisma/seed.ts`) per app for dev bootstrapping.
- Migration naming: `prisma migrate dev --name <slug>` with kebab-case descriptive names.
- Production migrations run on container start (not build-time) via `prisma migrate deploy` — Coolify build containers cannot reach the DB.

## Rollout

Immediate upon first `apps/*/` scaffold. Initial schema drafted during week 3 of MVP build per SPEC §9.

## Re-open conditions

- Prisma query-engine cost becomes measurable in p95 latency (unlikely at our scale).
- Edge deployment becomes necessary (would force a re-evaluation; Drizzle or Neon Serverless Driver in play).
- A Shopify app ecosystem shift to a different ORM (unlikely short-term).
