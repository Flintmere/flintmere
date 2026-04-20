# Flintmere — Project Map

Entry-point doc. Every skill reads this on tasks that need repo layout, stack, env vars, or commands.

## TL;DR

**Flintmere is a Shopify app that scores product catalogs for AI-agent readiness and fixes what's broken.** Built for Shopify merchants (£500K–£20M revenue, 100–5,000 SKUs) and the agencies that serve them. Free public scanner at `audit.flintmere.com`, paid app from £49/month. Full business case in `BUSINESS.md` and `SPEC.md`.

## Stack

- **Scanner (audit.flintmere.com):** Next.js 15 (App Router), TypeScript, Tailwind
- **Shopify app (app.flintmere.com):** Remix + `@shopify/shopify-app-remix`, TypeScript, Polaris + App Bridge
- **Shared:** `packages/llm/` (provider abstraction), `packages/scoring/` (pillar engine)
- **Database:** Postgres 16 (single instance, two schemas: `scanner_*` / `app_*`)
- **ORM:** Prisma (per-app schema under `apps/<app>/prisma/`)
- **Queue:** BullMQ on Redis
- **LLM:** Gemini 2.5 Flash (primary bulk) + Gemini 2.5 Pro (hard cases) via Vertex AI EU; GPT-4o-mini on Azure OpenAI EU as fallback. See `decisions/0005-llm-provider-strategy.md` + `0006-hardcase-llm-lock-gemini-pro.md`.
- **Hosting:** Coolify on DigitalOcean droplet. See `decisions/0002-coolify-on-do.md`.
- **Payments:** Shopify Managed Pricing for Growth + Scale tiers; Stripe direct for Agency + Enterprise + £97 concierge audit.
- **Auth (app only):** Shopify OAuth via the official Remix helper. Access tokens encrypted at rest.
- **Email:** Resend (scanner full-report delivery, app alerts).
- **Error tracking:** Sentry.
- **Analytics:** PostHog (self-hosted on droplet) for product; GA4 on marketing site for acquisition funnel.

## Repo layout

```
flintmere/
├── apps/
│   ├── scanner/            Next.js · audit.flintmere.com · public scanner
│   └── shopify-app/        Remix · app.flintmere.com · embedded Shopify app
├── packages/
│   ├── llm/                LLM provider abstraction (Gemini / Azure / fallback)
│   └── scoring/            Pure scoring engine (six pillars), framework-free
├── memory/                 Claude behaviour rules (PROCESS, VOICE, OUTPUT, TOOLS, CONSTRAINTS + depts)
├── projects/flintmere/     This directory — project knowledge + ADRs
├── wireframes/             Design reference (React wireframe viewer)
├── .claude/skills/         Per-department skills
├── package.json            pnpm workspace root
├── pnpm-workspace.yaml     workspaces declaration
└── CLAUDE.md               load-map entry point
```

## Domains

- `flintmere.com` — marketing site (can be static; lives in `apps/scanner/` initially or a separate mini-app later)
- `audit.flintmere.com` — public scanner (Next.js)
- `app.flintmere.com` — Shopify embedded app (Remix)

Subdomain routing handled by Coolify / Traefik reverse proxy on the single droplet. Let's Encrypt SSL per subdomain.

## Commands

Canonical (authoritative) commands:

```
pnpm install                 # install all workspace deps
pnpm -F scanner dev          # scanner dev server (localhost:3001)
pnpm -F shopify-app dev      # Shopify app dev server + Shopify CLI tunnel
pnpm -F @flintmere/llm test  # package tests
pnpm -r build                # build all apps + packages
pnpm -r test                 # all tests (unit + integration)
pnpm -r lint                 # eslint + prettier check
pnpm -F scanner prisma migrate dev --name <slug>
pnpm -F shopify-app prisma migrate dev --name <slug>
```

Workspace commands use `-F <name>` or `--filter <name>`. Root package has convenience scripts for common multi-app tasks.

## Env vars

See each app's `.env.example`. Canonical keys:

- **Shared:** `DATABASE_URL`, `REDIS_URL`, `SENTRY_DSN`, `POSTHOG_KEY`
- **LLM:** `LLM_PRIMARY_PROVIDER=vertex`, `LLM_PRIMARY_MODEL=gemini-2.5-flash`, `LLM_HARDCASE_MODEL=gemini-2.5-pro`, `LLM_FALLBACK_PROVIDER=azure-openai`, `LLM_REGION=europe-west1`, `GOOGLE_APPLICATION_CREDENTIALS` (service account JSON path), `AZURE_OPENAI_*`
- **Scanner:** `RESEND_API_KEY`, `STRIPE_SECRET_KEY` (concierge audit only)
- **Shopify app:** `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_SCOPES`, `SHOPIFY_TOKEN_ENCRYPTION_KEY` (32 bytes base64), `SHOPIFY_APP_URL`

Production values in Coolify environment configuration. Rotation schedule documented in `memory/product-engineering/security-posture.md`.

## Deployment

- **Pattern:** git push → Coolify pulls → rebuild → rolling restart. One app per container, Traefik handles routing.
- **Environments:** `main` branch → production. Feature branches → Coolify preview environments (per-branch subdomain, e.g. `pr-42.staging.flintmere.com`).
- **Migrations:** `prisma migrate deploy` runs on container start, not during build. Coolify build container cannot reach the DB.
- **Rollback:** Coolify's redeploy-previous-commit button. Prisma migrations are forward-only; down-migrations via a new commit, not by reverting.

## Related

- `ARCHITECTURE.md` — routes, DB schema, integrations, data flow
- `DESIGN.md` — visual canon pointers + three-surface rules
- `BUSINESS.md` — pricing, tiers, positioning
- `STATUS.md` — current phase, what's shipped, what's next
- `SPEC.md` — the original Product & GTM plan (v1.2), canonical for intent
- `decisions/` — ADRs 0001–0006 (growing)
- `../../memory/` — Claude behaviour rules + department kits
