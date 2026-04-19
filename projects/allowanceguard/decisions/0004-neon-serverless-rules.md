# 0004 — Neon serverless strict casting rules

**Status:** Accepted
**Date:** 2026-04-14 (ADR written during refactor; rules themselves predate it)
**Council:** #18 Database engineer / DBA, #15 Staff engineer / architect

## Context

The `pool` in `src/lib/db.ts` uses `@neondatabase/serverless`. The old `neon()` direct-call API was permissive and auto-inferred types. The `.query()` API used by the pool is strict — it does not auto-serialize objects, does not auto-cast text to enums, and requires explicit casts on array parameters.

Every few weeks a subtle bug shipped because someone assumed the old permissive behaviour. Symptoms were always the same: silent type coercion failure, queries returning empty results, or `invalid input syntax for enum job_status`.

## Decision

Make the rules explicit and load-bearing:

- Object parameters MUST be `JSON.stringify()`d before passing. E.g. `$1::jsonb` with `JSON.stringify(payload)`.
- PostgreSQL enum columns MUST have explicit `::enum_type` casts on string literals. E.g. `'pending'::job_status`, not `'pending'`.
- Array parameters for `ANY($1::type[])` may need explicit casting.
- When in doubt, cast explicitly.

Rules live in `projects/allowanceguard/ARCHITECTURE.md` under "Neon serverless `.query()` rules".

## Consequences

- Queries are more verbose — explicit casts everywhere.
- Regressions from auto-coercion assumptions become compile-time or obvious-runtime failures instead of silent data bugs.
- Code review must check for un-cast enum/jsonb parameters in new queries.

## Alternatives considered

- **Switch to a different driver** — rejected: Neon serverless is the right fit for Vercel deployment; the rules are the trade-off.
- **Wrap `.query()` in a helper that auto-casts** — rejected: too magic, hides the trade-off, would mask future driver changes.
