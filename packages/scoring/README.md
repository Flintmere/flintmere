# @flintmere/scoring

Flintmere's six-pillar catalog readiness scoring engine. Pure TypeScript. No framework dependencies.

## Usage

```ts
import { scoreCatalog, type CatalogInput } from '@flintmere/scoring';

const catalog: CatalogInput = {
  shopDomain: 'meridian-coffee.myshopify.com',
  products: [...], // ProductInput[]
};

const result = scoreCatalog(catalog);
console.log(result.score, '/', 100);
console.log(result.grade);
console.log(result.issues);
```

## Pillars

The engine computes six pillars per the Flintmere canon (SPEC §4.1):

| Pillar | Weight | Public-scannable? |
|---|---|---|
| Identifier completeness | 20% | Yes — from `/products.json` |
| Attribute completeness | 25% | **Locked** — requires OAuth install |
| Title & description quality | 15% | Yes |
| Catalog mapping coverage | 15% | **Locked** — requires Admin API |
| Consistency & integrity | 15% | Yes |
| AI checkout eligibility | 10% | **Locked** — requires Admin API |

Scanner mode (default) returns `locked: true` on the three Admin-API pillars with a `lockedReason`. App mode (post-OAuth) unlocks all six.

## Design

- **Deterministic.** Given the same input, the same output. No network calls from the engine.
- **Framework-free.** No Next.js, no Remix, no React. Pure TS + Zod.
- **Tested first.** ≥90% line coverage target per `memory/product-engineering/test-strategy.md`.
- **Types over guesses.** `strict: true`, `noUncheckedIndexedAccess`. All inputs validated through Zod schemas at API boundary.

## Scripts

- `pnpm build` — compile to `dist/`
- `pnpm test` — run Vitest
- `pnpm test:watch` — TDD loop
- `pnpm typecheck` — tsc `--noEmit`
- `pnpm lint` — ESLint

## Cross-references

- `memory/product-engineering/architecture-rules.md` §Shared `packages/` — invariants for this package.
- `memory/product-engineering/test-strategy.md` — coverage + fixture rules.
- `projects/flintmere/SPEC.md` §4 — the scoring system intent.
- `projects/flintmere/decisions/0001-single-repo-monorepo.md` — why this is a workspace package.
