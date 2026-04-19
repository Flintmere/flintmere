# 0001 — Single-repo monorepo with `apps/` + `packages/`

- **Status:** Accepted
- **Date:** 2026-04-19

## Context

Flintmere has two deployable applications — a public scanner (`audit.flintmere.com`) and an embedded Shopify app (`app.flintmere.com`) — plus shared logic (the pillar scoring engine, the LLM provider abstraction). The scanner is public + stateless + lightweight. The Shopify app is authenticated + stateful + heavier on API integration. They share core business logic.

Options considered:

- **Two separate repos** — `flintmere-scanner` + `flintmere-shopify-app`, with a third `flintmere-shared` published as an internal package.
- **Single monorepo with `apps/` + `packages/`** — pnpm workspaces, shared code lives in `packages/`, both apps import directly.
- **Single app with routing** — one Next.js app serving both scanner and Shopify app routes.

## Decision

**Single monorepo, pnpm workspaces, `apps/` + `packages/`.**

```
flintmere/
├── apps/
│   ├── scanner/
│   └── shopify-app/
├── packages/
│   ├── llm/
│   └── scoring/
└── pnpm-workspace.yaml
```

Each app is independently deployable with its own `Dockerfile`. `packages/*` is consumed via workspace references (`"@flintmere/scoring": "workspace:*"`). No npm publishing.

## Rationale

### Council

- **#15 Staff engineer** — shared business logic (scoring, LLM) that drifts between two apps is a recurring bug source. Monorepo eliminates the drift.
- **#33 Backend engineer** — single `pnpm install`, single `pnpm build`, single CI pipeline. Less surface area.
- **#16 QA** — single repo means one place to run tests across both apps. Coverage visible in aggregate.
- **#11 Investor** — refactor cost is lower when both apps live together. At scale that becomes a real cost advantage.
- **#10 DevOps** — Coolify deploys each app independently by watching different `apps/*` paths. Monorepo doesn't force coupled deploys.

### Rejected options

- **Two repos**: historical rationale doesn't apply — we're one operator, not two teams. Two repos would add refactor overhead every time scoring changes.
- **Single app with routing**: Shopify embedded apps require specific auth + iframe posture that conflicts with a public stateless scanner. Polaris on public surfaces is wrong. Better kept separate.

## Consequences

- One `git clone` sets up the entire project.
- CI runs `pnpm -r build` + `pnpm -r test`. Build + test cost scales with repo size.
- Skills like `build-feature` and `refactor-component` operate across the whole repo — they need to know the `apps/` vs `packages/` split (codified in `memory/product-engineering/architecture-rules.md`).
- Versioning: both apps version together as a single product release. No semver on internal packages.
- `.gitignore` must handle both Next.js (`.next/`, `apps/scanner/.next/`) and Remix (`build/`, `public/build/`) output.

## Rollout

Immediate. The kit scaffold already has this shape (via `master-build-kit` conventions); we adopt it as-is.
