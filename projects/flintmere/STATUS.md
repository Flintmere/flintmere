# Flintmere — Status

Current phase, what's shipped, what's next. Update as state changes so Claude's advice stays grounded in the real timeline.

## Phase

**Pre-launch build — code scaffolding complete across both apps and both packages. Operator-gated for launch.** Scanner + Shopify app + packages all shipped in code. Validation week (SPEC §2) not yet started — blocked on operator account setup (Stage 2 of `OPERATOR-TASKS.md`) and Coolify deploy (Stage 3).

## Shipped (2026-04-20)

### Kit + foundations (2026-04-19)

- Repo cloned from `claude-master-build-kit`, renamed `Flintmere/flintmere` on GitHub.
- Wireframes installed at `wireframes/`.
- `SPEC.md` preserved into `projects/flintmere/` (v1.2 — Product & GTM plan; supersede header added 2026-04-20).
- Root baseline: `pnpm-workspace.yaml`, `package.json`, `.gitignore`, `.nvmrc`, `apps/*/Dockerfile`, `.dockerignore`, `docker-compose.yml`, `SECURITY.md`, Flintmere-specific `README.md`, `CLAUDE.md`.
- `.claude/settings.json` refactored to tier-by-blast-radius permissions.
- All seven memory departments rewritten for Flintmere (design, product-engineering, marketing, compliance-risk, growth, data-intelligence, admin-ops).
- 50+ skills audited — legacy allowanceguard skills deleted, seven Flintmere-specific skills created.

### Foundational ADRs (0001–0006)

- **0001** — single-repo monorepo (`apps/` + `packages/`).
- **0002** — Coolify on existing DO droplet (sunk cost + EU data residency).
- **0003** — visual canon: neutral-bold hybrid + legibility bracket + Geist.
- **0004** — Prisma over Drizzle.
- **0005** — LLM provider strategy (Gemini 2.5 Flash primary + GPT-4o-mini fallback; DeepSeek + Qwen rejected by Legal Council).
- **0006** — Gemini 2.5 Pro locked as hard-case model (benchmark deferred to month 3 / 50 concierge audits).

### Project anchor docs (`projects/flintmere/`)

`PROJECT.md`, `ARCHITECTURE.md`, `DESIGN.md`, `BUSINESS.md`, `STATUS.md` (this file), `GLOSSARY.md`, `OPERATOR-TASKS.md`, `decisions/0001–0006`.

### `packages/scoring/`

Six-pillar scoring engine. Scanner-mode pillars live (identifiers, titles, consistency). Attributes, mapping, checkout-eligibility scaffolded but locked to app-mode data. Unit tests cover GTIN checksum, title fluff detection, consistency rules.

### `packages/llm/`

Provider abstraction per ADRs 0005 + 0006. Shipped:
- `LLMProvider` interface + `LLMRouter` (primary → fallback on circuit break)
- `VertexProvider` (Gemini 2.5 Flash + Pro, `europe-west1`)
- `AzureOpenAIProvider` (GPT-4o-mini)
- `MockProvider` for tests
- `CircuitBreaker` with per-provider error thresholds + cooldown

### `apps/scanner/` (Next.js 15, audit.flintmere.com + marketing)

- App Router layout, Tailwind v4 with `@theme` directive, Geist fonts self-hosted
- Marketing home (`/`) with hero + six pillars + before/after + three-chapter narrative + testimonials + pricing grid + manifesto + footer (324 lines)
- `/pricing` — five tiers + FAQ + GTIN disclaimer
- `/research` — State of AI Readiness reports (stub)
- `/audit` + `/audit/success` — £97 concierge landing with Stripe checkout form + Calendly fallback
- `/scan` — public scanner UI
- `/unsubscribe` — PECR/GDPR one-click unsubscribe page
- API routes: `POST /api/scan`, `GET /api/scan/:id`, `POST /api/lead` (Resend full-report delivery), `POST /api/unsubscribe`, `POST /api/concierge/checkout` (Stripe Checkout Session, 303-redirect), `POST /api/webhooks/stripe` (signature-verified, idempotent on payment intent), `GET /api/healthz`
- `lib/stripe.ts` — Stripe SDK singleton pinned to API `2024-10-28.acacia`, returns null gracefully when `STRIPE_SECRET_KEY` unset (routes 503 instead of crashing)
- `lib/email.ts` — Resend wrapper with RFC 8058 one-click unsubscribe headers + HMAC-SHA256 unsubscribe tokens + `timingSafeEqual` verification
- Prisma schema: `scanner_scans`, `scanner_leads`, `scanner_reports`, `scanner_concierge_audits`

### `apps/shopify-app/` (Remix, app.flintmere.com)

- `@shopify/shopify-app-remix` with OAuth, Polaris + App Bridge chrome
- AES-256-GCM access-token encryption (`lib/encryption.server.ts`, 32-byte key validation)
- Mandatory GDPR webhooks: `customers-data-request`, `customers-redact`, `shop-redact`, `app-uninstalled` (all HMAC-verified, idempotent via `webhook_events` table)
- Product webhooks: `products/create|update|delete` enqueue drift re-score
- `GET /healthz` — liveness endpoint
- `POST /api/rescan` — manual rescan trigger
- `POST /api/enrichment/preview` — Tier 2 LLM enrichment dry-run (5-sample preview before bulk apply)
- BullMQ queues (`queues.server.ts`): `scan`, `sync`, `score`, `fix-tier1`, `fix-tier2`, `drift`, `alerts`, `nightly-sync`, `weekly-sync`
- Bulk catalog sync: `bulkOperationRunQuery` orchestration + streaming JSONL parser (`lib/bulk-sync.server.ts`, AsyncGenerator yields one product block at a time)
- Three Tier 2 enrichment paths wired to `@flintmere/llm`: alt-text generation, title rewrite, attribute inference
- Prisma schema: `shops`, `products`, `variants`, `metafields_index`, `scores`, `issues`, `fixes`, `fix_batches`, `webhook_events`, `channel_health`

## In progress

None — current code is committed and pushed. Waiting on operator to unblock launch path.

## Next (in order of leverage)

1. **Operator launch prep** — Stage 2 account creation (Shopify Partner, Google Vertex, Azure OpenAI, Stripe, Resend, Sentry, BetterStack) + Stage 3 Coolify deploy. See `OPERATOR-TASKS.md`.
2. **Validation week (SPEC §2)** — scanner live at `audit.flintmere.com`, cold outreach (LinkedIn + r/shopify + Partner Slack), £97 concierge audits.
3. **Fix History UI + revert endpoint** (SPEC §5.2.1) — schema + job exist; UI + `POST /api/fix/:id/revert` route to wire.
4. **Shareable badge + share-for-trial loop** (SPEC §2.1.3, §2.1.2) — `flintmere.com/score/{shop}` public page + LinkedIn/X verification.
5. **Legal pages** — Privacy, Terms, DPA, Cookie Policy (draft via `legal-page-draft` → UK commercial lawyer review).
6. **Worker Dockerfile** — separate Coolify service for the Shopify app's BullMQ worker process (currently bundled with the web container).
7. **App Store submission prep** (SPEC Week 7–10) — `shopify-app-store-submission` skill checklist, screenshots, demo video.
8. **Beta merchant onboarding** — private MVP for 10–20 merchants.

## Known issues (non-blocking)

- **SPEC.md is 640 lines** — over the 600-line limit (`PROCESS.md` §2). Inherited document, supersede header added 2026-04-20. Decision: keep as historical-intent canonical; truth lives in STATUS + ADRs.
- **Skill body content**: ~10 skills still have "wallet / approval / Permit2 / Sentinel / SIWE" in example prose. Descriptions are Flintmere; body gets rewritten lazily on first Flintmere invocation.
- **`projects/allowanceguard/`** — legacy reference from kit inheritance. Safe to remove.
- **Coolify not yet configured for this repo.** Deploy path unverified end-to-end. Operator task (Stage 3).
- **Vertex AI service account not yet provisioned.** Blocks LLM integration test + Tier 2 enrichment in production.
- **BetterStack + Sentry + Resend + Stripe accounts not yet connected.** Apps gracefully degrade (503 on missing Stripe; log-warn on missing Resend) — no crashes, just disabled features.
- **Fix History UI not yet built** — schema + fix_batches table exist; `/fix-history` Remix route + revert endpoint still to ship.
- **Share-for-trial loop not yet built** — SPEC §2.1.3, not scaffolded.

## Open decisions (blocking nothing yet, settle before related work)

- Whether `flintmere.com` (marketing site) is its own app or a static route inside `apps/scanner/`. Current posture: marketing content lives at `apps/scanner/src/app/page.tsx` (root route). Split if traffic patterns diverge post-launch.
- Self-hosted PostHog vs cloud free tier: leaning self-hosted on the droplet (data-residency story). Defer decision until Coolify stack is up.
- SOC 2 posture: not needed pre-launch. Budget a preparation window when first Enterprise deal surfaces.

## Changelog

- **2026-04-20**: Updated to reflect scaffolding-complete state. `packages/scoring`, `packages/llm`, `apps/scanner` (full surface + marketing + Stripe concierge + Resend email gate + PECR unsubscribe), `apps/shopify-app` (OAuth + Polaris + GDPR webhooks + AES-256-GCM + BullMQ + bulk-sync + three Tier 2 enrichment paths) all shipped across 11 commits since 2026-04-19. Now operator-blocked for launch.
- **2026-04-19**: Foundations complete. Phases 1–3 shipped in 12 commits. All seven memory departments rewritten for Flintmere, six ADRs written, 50+ skills audited.
