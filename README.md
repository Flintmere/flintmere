# Flintmere

Vertical-specialist commerce-data platform for UK food merchants. Multimodal ingestion — supplier PDFs, back-of-pack photos, spreadsheets — mapped against a proprietary food regulatory taxonomy, merchant-confirmed in 30 seconds, written to Shopify metafields under OAuth. The public scanner is the acquisition surface; the published food standard is the citable moat.

- `flintmere.com` — marketing
- `catalog.flintmere.com` — public scanner (no install). The former
  `audit.flintmere.com` permanently 301s here.
- `app.flintmere.com` — Shopify embedded app
- `standards.flintmere.com` — food catalog standard (planned, ADR 0018)

## Repo layout

```
flintmere/
├── apps/
│   ├── scanner/            Next.js 15 · catalog.flintmere.com + flintmere.com · public scanner + marketing
│   └── shopify-app/        Remix · app.flintmere.com · embedded Shopify app
├── packages/
│   ├── llm/                Provider abstraction (Gemini primary, OpenAI Platform fallback) — ADRs 0005 / 0006 / 0010
│   ├── scoring/            Pure pillar scoring engine, framework-free
│   └── ui/                 Shared UI primitives
├── memory/                 Claude behaviour rules (PROCESS / VOICE / OUTPUT / TOOLS / CONSTRAINTS + 7 depts)
├── projects/flintmere/     Product knowledge + ADRs (0001–0023)
├── .claude/skills/         Department-aligned skills
├── wireframes/             Design reference
└── CLAUDE.md               Load-map entry point for Claude Code
```

## Quick start

```bash
pnpm install                                # all workspaces
docker-compose up -d                        # local Postgres + Redis
cp apps/scanner/.env.example apps/scanner/.env.local
cp apps/shopify-app/.env.example apps/shopify-app/.env.local
pnpm -F scanner prisma migrate dev --name init_scanner
pnpm -F shopify-app prisma migrate dev --name init_app
pnpm -F scanner dev                         # http://localhost:3001
```

Full operator checklist (domains, Shopify Partner app, Vertex/Gemini, Stripe, Resend, Sentry, Coolify): `projects/flintmere/OPERATOR-TASKS.md`.

## Canonical docs

Start with `CLAUDE.md` (load map). Then:

- `projects/flintmere/PROJECT.md` — stack, commands, env vars
- `projects/flintmere/ARCHITECTURE.md` — routes, DB schema, integrations, data flow
- `projects/flintmere/DESIGN.md` — neutral-bold canon + the legibility bracket
- `projects/flintmere/BUSINESS.md` — pricing, tiers, positioning
- `projects/flintmere/STATUS.md` — what's shipped, what's next
- `projects/flintmere/SPEC.md` — original Product & GTM plan (v1.2; ADRs supersede parts)
- `projects/flintmere/strategy/` — long-form strategy + 12-month proof gates
- `projects/flintmere/decisions/` — ADRs 0001–0025
- `SECURITY.md` — disclosure policy

## Stack (current)

TypeScript · Next.js 15 · Remix · Prisma · Postgres 16 · BullMQ/Redis · Tailwind v4 · Geist Sans + Mono · Gemini Enterprise Agent Platform — formerly Vertex AI — (Gemini 2.5 Flash + Pro, `europe-west1`) · OpenAI Platform (GPT-4o-mini fallback, ADR 0010) · Resend · Stripe · Sentry · PostHog Cloud EU (ADR 0025) · Coolify on DigitalOcean.

## License

Private / not yet published.
