# OUTPUT

How Flintmere code is written. Conventions, scope discipline, file naming, scope limits. Pairs with `memory/product-engineering/architecture-rules.md` (file-level invariants) and `memory/product-engineering/shopify-api-rules.md` (Shopify-specific rules).

## TL;DR

- **TypeScript strict.** `strict: true`, `noUncheckedIndexedAccess: true`. No `any` except at documented boundaries.
- **Mobile-first.** WCAG AA on every UI. Test at 375 / 768 / 1024 / 1440.
- **File naming.** `PascalCase.tsx` for components, `kebab-case.ts` for utilities, Next.js + Remix route conventions for routes.
- **Tokens only.** No ad-hoc hex, no ad-hoc spacing. Propose new tokens via `design-token`.
- **Scope discipline.** Don't refactor adjacent code, don't add features not asked for, don't add error handling for impossible cases.
- **No comments on code you didn't touch.** Comment only where the *why* is non-obvious.

## TypeScript

- `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitReturns: true`, `noFallthroughCasesInSwitch: true`.
- `any` is a last-resort escape hatch and requires a comment naming what's unknown.
- Prefer `unknown` + narrowing via type guards / Zod schemas.
- Zod parses every network-boundary input (route params, bodies, Shopify webhook payloads, LLM responses).
- Never use non-null assertion (`!`) to silence the compiler. Narrow the type instead.
- Exhaustive `switch` using `satisfies never` or `assertUnreachable(...)` on the default branch for union-type dispatch.

## File naming

| Kind | Convention | Example |
|---|---|---|
| React components | `PascalCase.tsx` | `ScoreRing.tsx` |
| Utilities / hooks | `kebab-case.ts` for utilities, `use-kebab-case.ts` for hooks | `verify-hmac.ts`, `use-shop-session.ts` |
| Next.js routes | `page.tsx` / `route.ts` | `app/api/scan/route.ts` |
| Remix routes | Remix conventions (`_index.tsx`, `[param].tsx`, nested) | `routes/_index.tsx`, `routes/api.webhooks.products-update.tsx` |
| DB / Prisma | `schema.prisma`, migration names kebab-case | `20260419123000_add_shops_table/migration.sql` |
| Test files | Mirror the source, `.test.ts` suffix | `score.test.ts` alongside `score.ts` |

## Component code

- Tailwind classes first. CSS custom properties for theme tokens. Ad-hoc CSS via `@layer` only when Tailwind can't express it.
- Use `cn()` from `@flintmere/ui` for conditional class merging (or inline `clsx` until `packages/ui` exists).
- Use CVA (class-variance-authority) for component variants with >2 states.
- No `bg-white`, `bg-slate-*`, `bg-gray-*`, `bg-neutral-*`, `dark:*`, `rounded-*` (except on truly-circular shapes). See `memory/design/tokens.md`.
- Every interactive component has a keyboard path. Every form input has a label. See `memory/design/accessibility.md`.
- **Shopify app components**: Polaris primitives stay untouched (never re-style `<Button>`, `<Banner>`, `<IndexTable>`). Flintmere-island components render in Flintmere canon inside Polaris `<Card>` wrappers. See `projects/flintmere/DESIGN.md` §island rule.

## The legibility bracket in code

The `Bracket` component from `memory/design/components.md` is the signature primitive. Rules:

- A Bracket child is **one token** — a noun, number, identifier. Build-time lint: `Bracket` children must not contain whitespace.
- For interactive elements (bracketed words inside CTAs), use `<Bracket interactive>` which handles `aria-hidden` wrapping + parent `aria-label`.
- Every page has at least one `Bracket`. Two per page maximum — more and the signature becomes decoration.

## Data access

- **Prisma** is the ORM (ADR 0004). Schema per app at `apps/<app>/prisma/schema.prisma`.
- Query files live under `apps/<app>/src/lib/db/` or `apps/<app>/src/<domain>/queries.ts`.
- Transactions via `prisma.$transaction()`. No manual `BEGIN`/`COMMIT`.
- Never raw SQL in route / loader / action files. If raw SQL is needed (bulk updates, analytical queries), isolate in `prisma/raw/*.ts` with a documented reason.

## Scope discipline

- Don't add features, refactor, or introduce abstractions beyond what the task requires.
- A bug fix doesn't need surrounding cleanup. A one-shot operation doesn't need a helper.
- Don't design for hypothetical future requirements.
- Three similar lines is better than a premature abstraction.
- Don't add error handling, fallbacks, or validation for scenarios that can't happen. Trust internal code and framework guarantees. Only validate at system boundaries (user input, external APIs, Shopify webhooks).
- Don't use feature flags or backwards-compatibility shims when you can just change the code.
- No half-finished implementations. If a function takes a param it doesn't use yet, remove the param.

## Comments and annotations

- Default to no comments. Well-named identifiers and small functions carry the meaning.
- Add a comment **only** when the *why* is non-obvious: a hidden constraint, a subtle invariant, a workaround for a specific bug, behaviour that would surprise a reader.
- Don't explain *what* the code does. Don't reference the current task, fix, or caller ("used by X", "added for Y flow", "fixes issue #123"). Those belong in the PR description, not the code — they rot as the codebase evolves.
- No docstrings on code you didn't touch. Don't leave `// TODO` or `// removed X` breadcrumbs unless they're actionable and tracked.

## Error handling

- Log the what, not the secret. Redact Shopify access tokens, Stripe keys, customer PII in error messages.
- User-visible errors name the action, not the internal fault. "We couldn't reach your store — check the URL." not "ECONNREFUSED on fetch".
- Shopify API errors: respect `Retry-After` on 429s; back off exponentially; surface cost-limit hits to `#34 Debugging` for review.
- Background job errors: BullMQ retries with backoff; after max retries, route to dead-letter queue; alert.
- Never silently swallow. If we catch, we act (log, surface, retry, fail). No empty `catch {}`.

## Testing

- Test pyramid: mostly unit (`packages/scoring/`, utility functions), some integration (route handlers with real Prisma + mocked external APIs), minimal E2E.
- Every new route handler: at least one happy-path integration test per HTTP verb.
- Every bug fix: a regression test written before or alongside the fix.
- Every webhook handler: HMAC verification test + idempotency test + malformed-payload rejection.
- Coverage is a floor, not a goal. 80% line coverage on `packages/*/src/`. No coverage minimum on components with no logic.
- See `memory/product-engineering/test-strategy.md` for detail.

## Commit messages

- Present-tense imperative. "Add score-ring primitive" not "Added" or "Adds".
- First line ≤72 chars. Body explains *why*, not *what*.
- Scope prefix optional but consistent when used: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`.
- Reference relevant ADR when the commit implements an ADR decision: `(ADR 0005)` in body.

## Dependencies

- No new top-level dependency without explicit user approval. Justify with: what it replaces, why a vendored copy won't work, bundle impact.
- Both apps use the same major versions of Prisma, TypeScript, ESLint, Zod. Drift = hazard.
- Never add a dependency to avoid writing 30 lines.
- New packages go through `design-token`-style proposal: what, why, alternatives, bundle impact, Thane's veto on marketing-surface bundle bloat.

## Migrations

- `prisma migrate dev --name <kebab-case-slug>` in development.
- Production migrations: `prisma migrate deploy` runs on container start, never at build time (Coolify build container cannot reach DB).
- Forward-only. Down-migrations via a new forward migration, not by reverting.
- **#18 DBA** reviews every migration that transforms existing rows or adds indexes on large tables.

## Environment variables

- `.env.local` per app, gitignored. `.env.example` per app lists every required key with a placeholder.
- Production secrets in Coolify environment configuration.
- Never log secrets. Never send to Sentry. Secret-shaped values (`_KEY`, `_SECRET`, `_TOKEN`) redacted in structured logs automatically.

## Shopify-app-specific output rules

- All API writes respect the tier-appropriate rate limit (see `shopify-api-rules.md`).
- Bulk operations: streaming JSONL parser, never `.json()` or `.text()` on the full file.
- Webhook handlers: HMAC verify → enqueue → 200 within 5s. Heavy work in the worker.
- OAuth token encryption at rest (AES-256-GCM). Never plaintext.
- Polaris components for chrome. Flintmere island for brand moments. No hybrid styling.

## Scanner-specific output rules

- Public endpoints rate-limited per IP and per submitted email domain.
- `fetch()` to merchant storefronts has a hard 55s timeout (public promise is 60s).
- No LLM calls in the public scanner — partial score is deterministic (pillars 1/3/5). LLM-backed pillars (2/4/6) are gated behind install.

## Changelog

- 2026-04-19: Rewritten for Flintmere. Added bracket signature rule, Shopify-specific output rules, Polaris island rule, Prisma-specific migration posture. Replaced Drizzle references, dropped `src/` assumption (monorepo now), added scope for both apps.
