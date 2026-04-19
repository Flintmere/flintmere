# architecture-rules.md

Architectural invariants for the Flintmere monorepo. Canonical source for file-level rules; `projects/flintmere/ARCHITECTURE.md` is the canonical source for system design (stack, deployment, data flow).

## Repo shape

Single repo, pnpm workspaces:

```
flintmere/
├── apps/
│   ├── scanner/     Next.js · audit.flintmere.com · public, no auth
│   └── shopify-app/ Remix · app.flintmere.com · OAuth, Polaris, App Bridge
├── packages/
│   └── scoring/     shared scoring engine, pure TS, no framework deps
├── memory/          behaviour rules (this file)
├── projects/flintmere/ project knowledge (ARCHITECTURE, DESIGN, etc.)
└── wireframes/      design reference
```

- `apps/*` are deployable units. Each has its own `package.json`, `tsconfig.json`, `Dockerfile`.
- `packages/scoring/` is the only shared code at launch. Both apps import it; it imports nothing from either app.
- Do not create `packages/*` speculatively. Extract when a second app needs the same code. Inline until then.

## Invariants — both apps

### Language and types

- TypeScript only. `strict: true`, `noUncheckedIndexedAccess: true`.
- `any` is a last-resort escape hatch and requires a comment naming what's unknown.
- Prefer `unknown` + narrowing over `any`. Zod parses untrusted data at boundaries.

### Data access

- **Prisma** is the ORM. One schema per app under `apps/<app>/prisma/schema.prisma`.
- Apps may share the same Postgres database but own separate schemas (`scanner_*` / `app_*`) so migrations don't collide.
- Query files live under `apps/<app>/src/lib/db/`. Never inline SQL in route / loader / action files.
- Transactions via `prisma.$transaction()`. No manual `BEGIN`/`COMMIT`.
- **#18 DBA** reviews every migration that transforms existing rows.

### Authentication

- Scanner: no auth. Public endpoint. Email collection only.
- Shopify app: Shopify OAuth via `@shopify/shopify-app-remix`. Session tokens via App Bridge. Never reimplement.
- Encrypted access tokens at rest (Postgres column-level, AES-256-GCM via `crypto` stdlib). Never plaintext.
- **#4 Security VETO** on any change under `apps/shopify-app/src/lib/auth/`, `apps/shopify-app/src/routes/auth.*`.

### Environment + secrets

- `.env.local` for development, gitignored. `.env.example` lists every required key with a placeholder.
- Production secrets via Coolify environment variables. Rotated per `SECURITY.md`.
- Never log secrets. Never send them to Sentry.

### Dependencies

- No new top-level dependency without explicit user approval. Justify: what it replaces, why a vendored copy won't work, bundle impact.
- Both apps use the same major versions of Prisma, TypeScript, ESLint. Drift = hazard.
- Never add a dependency solely to avoid writing 30 lines.

### File size

- 600-line limit (`memory/PROCESS.md:15-16`). Applies to `apps/*`, `packages/*`, `memory/`, `projects/`, `.claude/skills/`.
- Split by responsibility, not by line count. One 580-line file doing one thing beats three 200-line files doing thirds.

### Naming

- Files: `kebab-case.ts` for utilities; `PascalCase.tsx` for components; routes follow framework conventions (`[param].tsx` Remix, `page.tsx` Next.js).
- Exports: named over default. Default exports only where the framework requires them (Next.js App Router, Remix route modules).
- No ambiguous abbreviations. `auth`, `api`, `gtin` are fine; `mgr`, `usr`, `qty` are not.

## Invariants — Scanner (Next.js)

### Routes

- App Router only. API routes at `apps/scanner/src/app/api/<route>/route.ts`.
- Route handlers export named HTTP verbs. No default exports.
- Every mutation validates input via Zod before touching anything.
- Every route has a rate-limit decision (see `security-posture.md`).
- CSRF middleware on every state-changing same-origin route.

### Components

- Server Components by default. `"use client"` only where hooks / browser APIs are required.
- Co-locate component-specific files. Do not spread implementation across unrelated folders.

### Scanning flow

- URL input validated as a public Shopify store (`/products.json` reachable, 200 response).
- Fetch / parse operations have a hard 55-second timeout (public promise is 60s).
- Partial scores (identifiers, titles, consistency) are computed in-edge where possible. Heavy checks (attribute completeness, catalog mapping) are locked until install.
- Email capture gates the full report. Lead goes to Postgres `scanner_leads` table + Resend.

## Invariants — Shopify app (Remix)

### Routes

- Remix route conventions — `app/routes/`. No custom routing layer.
- Loaders for reads, actions for writes. Never mix.
- Every action validates via Zod before mutating. Every loader has a cache-control decision.
- `@shopify/shopify-app-remix` provides the session; read session via the canonical helper.

### Shopify API surface

- See `shopify-api-rules.md` for the full rule set: bulk operation handling, webhook HMAC verification, rate-limit math, API version pinning.

### Polaris + brand

- Polaris components for all chrome (Page, Card, Layout, Button, Banner, etc.).
- Flintmere brand elements (score ring, pillar cells with bracket tokens, Channel Health widget) render as **a Flintmere island inside a Polaris sea** — see `projects/flintmere/DESIGN.md`.
- Never restyle a Polaris primitive. If the design needs something Polaris doesn't ship, build a Flintmere component alongside, not over.

### Background jobs

- BullMQ queue at `apps/shopify-app/src/lib/queue/`. Redis provisioned by Coolify.
- Every job has: a typed payload (Zod schema), a retry policy, a dead-letter handler, an observability hook (structured log).
- Streaming JSONL processing for `bulkOperationRunQuery` results — never load the full file in memory. See `shopify-api-rules.md`.

### Payments

- Shopify Managed Pricing / AppSubscription API. No custom Stripe flow at launch.
- Stripe appears only for the £97 concierge audit landing page (separate surface, `apps/scanner` owns it).
- **#30 Payment systems + #4 Security convened** on every billing change.

## Hard bans

- No `bg-white`, `bg-slate-*`, `bg-gray-*` utilities. See `memory/design/tokens.md` — the canvas is `--paper`, not white.
- No gradient backgrounds except the `conic-gradient` that draws the score ring.
- No glassmorphism, no frosted surfaces, no blur on any surface.
- No WebGL, no Vanta, no heavy canvas on any surface (Thane veto).
- No `eval`, no `Function(...)`, no dynamic `require`.
- No `any` as a lazy escape hatch.
- No inline `<img>` in `src/app/**` — Next.js `<Image>` with explicit width/height. Remix routes use `<img>` with explicit dimensions and `loading="lazy"` below the fold.
- No third-party script on the payment page or OAuth callback.
- No allowanceguard-era tokens (`bg-oxblood`, `text-amber-deep`, `font-fraunces`, `.ledger-rule`, `.glass-*`). If encountered, migrate.

## When this file gets updated

- A new invariant emerges and **#15 Staff engineer** agrees it applies across both apps.
- An ADR lands under `projects/flintmere/decisions/` that changes a rule.
- A `CORRECTIONS.md` entry upgrades a lesson to a rule.
