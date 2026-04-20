# Flintmere

Shopify app that scores product catalogs for AI-agent readiness and fixes what's broken so ChatGPT, Gemini, and Microsoft Copilot can actually recommend them.

- `flintmere.com` — marketing
- `audit.flintmere.com` — public scanner (no install)
- `app.flintmere.com` — Shopify embedded app

## Repo layout

```
flintmere/
├── apps/
│   ├── scanner/            Next.js 15 · audit.flintmere.com · public scanner + marketing
│   └── shopify-app/        Remix · app.flintmere.com · embedded Shopify app
├── packages/
│   ├── llm/                Provider abstraction (Gemini / Azure fallback) — ADRs 0005 + 0006
│   └── scoring/            Pure six-pillar scoring engine, framework-free
├── memory/                 Claude behaviour rules (PROCESS / VOICE / OUTPUT / TOOLS / CONSTRAINTS + 7 depts)
├── projects/flintmere/     Product knowledge + ADRs
├── .claude/skills/         50+ skills wired to departments
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

Full operator checklist (domains, Shopify Partner app, Vertex AI, Stripe, Resend, Sentry, Coolify): `projects/flintmere/OPERATOR-TASKS.md`.

## Canonical docs

Start with `CLAUDE.md` (load map). Then:

- `projects/flintmere/PROJECT.md` — stack, commands, env vars
- `projects/flintmere/ARCHITECTURE.md` — routes, DB schema, integrations, data flow
- `projects/flintmere/DESIGN.md` — neutral-bold canon + the legibility bracket
- `projects/flintmere/BUSINESS.md` — pricing, tiers, positioning
- `projects/flintmere/STATUS.md` — what's shipped, what's next
- `projects/flintmere/SPEC.md` — original Product & GTM plan (v1.2; see supersede header for ADRs that override parts of it)
- `projects/flintmere/decisions/` — ADRs 0001–0006
- `SECURITY.md` — disclosure policy

## Stack (current)

TypeScript · Next.js 15 · Remix · Prisma · Postgres 16 · BullMQ/Redis · Tailwind v4 · Geist Sans + Mono · Google Vertex AI (Gemini 2.5 Flash + Pro, `europe-west1`) · Azure OpenAI (GPT-4o-mini fallback) · Resend · Stripe · Sentry · PostHog · Coolify on DigitalOcean.

## License

Private / not yet published.
