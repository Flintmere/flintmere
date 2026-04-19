# architecture-rules.md

Architectural invariants for `src/`. Canonical source for file-level rules; `projects/allowanceguard/ARCHITECTURE.md` is the canonical source for system design.

## Invariants

### Routes

- App Router only. API routes live at `src/app/api/<route>/route.ts`.
- Route handlers export named HTTP verbs (`GET`, `POST`, etc.). No default exports.
- Every route that mutates state validates input (Zod or equivalent) before touching anything.
- Every route has a rate-limit decision: which ratelimit, which key. If none applies, comment why.
- CSRF: state-changing routes under the same origin check the `ag_csrf` cookie via middleware. Do not reimplement per-route.

### Components

- Server Components by default. Client Components (`"use client"`) only where hooks or browser APIs are required.
- Co-locate component-specific files under the component directory. Do not spread implementation across unrelated folders.
- Single-export files for components. Named exports for utilities and hooks.

### Data access

- All database access through Drizzle. Never raw `pg` or `postgres.js` in route handlers.
- Query files live under `src/lib/db/` or `src/lib/<domain>/queries.ts`. Not inside routes.
- Transactions via `db.transaction(...)`. No manual `BEGIN`/`COMMIT`.

### Authentication

- Auth logic in `src/lib/auth/`. Never reimplemented in routes or components.
- Session reads via the canonical helper. Do not read session cookies directly.
- #4 Security VETO on any change under `src/lib/auth/`, `src/app/api/auth/**`.

### Payments

- Stripe code confined to `src/lib/stripe/` and `src/app/api/stripe/**`.
- Webhook handlers verify the signature before any side effect. No exceptions.
- #30 Payment systems + #31 Crypto payments + #4 Security convened on every payment change.

### Dependencies

- No new top-level dependency without explicit user approval. Justify with: what it replaces, why a vendored copy won't work, bundle impact.
- Prefer standard library / existing dependencies.
- Never add a dependency solely to avoid writing 30 lines of code.

### File size

- 600-line limit (`memory/PROCESS.md:15-16`). Applies to `src/`, `memory/`, `projects/`, and `.claude/skills/`.
- Split by responsibility, not by line count. A 580-line file doing one thing beats three 200-line files doing thirds of it.

### Naming

- Files: `kebab-case.ts` for utilities; `PascalCase.tsx` for components.
- Exports: named over default. Default exports only for Next.js route files that require them.
- No abbreviations that aren't industry-standard (`auth`, `api` OK; `usr`, `mgr` not OK).

## Hard bans

- No `bg-white`, `bg-slate-*`, or glassmorphism utilities on marketing surfaces (Ledger canon only). See `projects/allowanceguard/DESIGN.md`.
- No Vanta, no WebGL on marketing pages (Thane bundle-budget veto).
- No fetch from untrusted input without validation + rate-limit + error handling.
- No `eval`, no `Function(...)`, no dynamic `require`.
- No `any` as a lazy escape hatch. Use `unknown` + narrow.

## When this file gets updated

- A new invariant emerges and `#15 Staff engineer` agrees it applies project-wide.
- An ADR lands under `projects/allowanceguard/decisions/` that changes a rule.
- A CORRECTIONS.md entry upgrades a lesson to a rule.
