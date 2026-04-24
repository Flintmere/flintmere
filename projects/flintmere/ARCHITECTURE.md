# Flintmere — Architecture

System-level design — API routes, DB schema, integrations, data flow, feature gates. File-level rules live in `../../memory/product-engineering/architecture-rules.md`. Shopify-specific API rules live in `../../memory/product-engineering/shopify-api-rules.md`.

## Two apps, one repo

### Scanner (`apps/scanner/`, Next.js → audit.flintmere.com)

Public, no auth. Merchant enters a Shopify store URL; app scrapes the public feed, sitemap, and sample JSON-LD; returns a partial score (3 of 6 pillars: identifiers, titles, consistency); gates the full report behind email. Also hosts the £97 concierge audit landing page.

### Shopify app (`apps/shopify-app/`, Remix → app.flintmere.com)

OAuth-installed via `@shopify/shopify-app-remix`. Bulk catalog sync via `bulkOperationRunQuery`. All six pillars scored. Auto-fix engine (Tier 1 safe, Tier 2 approved, Tier 3 detect-and-guide). Polaris chrome with Flintmere islands per `DESIGN.md`.

### Shared `packages/`

- `packages/scoring/` — pure TS pillar scoring engine. Used by both apps. Framework-free, no DB / network imports.
- `packages/llm/` — provider abstraction. See ADRs 0005 + 0006. Both apps import the `LLMProvider` interface; swap providers via env.

## API routes (canonical surface)

**Status key**: ✅ shipped · 🚧 planned · ⏳ partial (route exists, handler stub).

### Scanner

| Route | Method | Auth | Rate limit | Purpose | Status |
|---|---|---|---|---|---|
| `/api/scan` | POST | public | 10/hr per IP | Accept store URL, enqueue scan job, return job ID | ✅ |
| `/api/scan/:id` | GET | public (job-ID auth) | 60/hr per IP | Poll scan status + return results | ✅ |
| `/api/lead` | POST | public | 5/hr per IP + 3/hr per email | Email capture + send full report via Resend | ✅ |
| `/api/unsubscribe` | POST | HMAC token | 30/hr per token | RFC 8058 one-click unsubscribe | ✅ |
| `/api/concierge/checkout` | POST | public | — | £97 concierge — create Stripe Checkout Session, 303-redirect | ✅ |
| `/api/webhooks/stripe` | POST | Stripe signature | — | `checkout.session.completed` → upsert `scanner_concierge_audits` | ✅ |
| `/api/scan/:id/publish` | POST | scan-id capability | — | Merchant opt-in to anonymised benchmark (aggregate only) | ✅ |
| `/api/scan/:id/publish-public-page` | POST / DELETE | scan-id capability | — | Merchant opt-in / opt-out for public `/score/{normalisedDomain}` page | ✅ |
| `/api/report/:token` | GET | one-time token | 30/hr per token | Serve full PDF report from a tokenised link | 🚧 |
| `/api/healthz` | GET | public | none | Liveness | ✅ |

### Public marketing surfaces (non-API)

| Route | Purpose | Status |
|---|---|---|
| `/score/[shop]` | Public per-shop score page, merchant opt-in (`publishPublicPage=true`). ISR `revalidate=3600`. Dynamic OG image. | ✅ |
| `/sitemap.xml` | Static marketing routes + every `publishPublicPage=true` domain. | ✅ |

### Shopify app

| Route | Method | Auth | Rate limit | Purpose | Status |
|---|---|---|---|---|---|
| `/auth/$` (OAuth) | GET | Shopify OAuth | none (Shopify owns) | OAuth install + callback, token encryption, initial sync trigger | ✅ |
| `/auth/login` | GET | public | — | Offline auth entry point for unembedded testing | ✅ |
| `/webhooks/products` | POST | HMAC | none | `products/create|update|delete` → enqueue drift re-score | ✅ |
| `/webhooks/app-uninstalled` | POST | HMAC | none | Scrub tokens, enqueue data purge | ✅ |
| `/webhooks/customers-data-request` | POST | HMAC | none | GDPR DSAR | ✅ |
| `/webhooks/customers-redact` | POST | HMAC | none | GDPR erasure | ✅ |
| `/webhooks/shop-redact` | POST | HMAC | none | Shop-level erasure | ✅ |
| `/api/rescan` | POST | session token | 2/hr per shop | Manual rescan trigger | ✅ |
| `/api/enrichment/preview` | POST | session token | 10/hr per shop | Tier 2 LLM dry-run (5-sample preview before bulk apply) | ✅ |
| `/healthz` | GET | public | none | Liveness | ✅ |
| `/api/fix` | POST | session token | 60/min per shop | Apply a fix batch | 🚧 |
| `/api/fix/:id/revert` | POST | session token | 20/min per shop | Revert a fix batch (7-day window) | 🚧 |
| `/api/export/:type` | GET | session token | 10/hr per shop | CSV exports (fix history, product-level scores) | 🚧 |

## Database schema (high level)

Shared Postgres 16, two schemas: `scanner_*` (public scanner) and `app_*` (Shopify app). Schema isolation means migrations don't collide.

### `scanner_*` schema

- `scanner_scans` — URL, status, partial score JSON, submitted_at, ip, user_agent, `published_to_benchmark` (aggregate consent), `publish_public_page` (public-page consent; gates `/score/{normalisedDomain}`)
- `scanner_leads` — email, source_scan_id, consent flags, unsubscribed_at
- `scanner_reports` — token, scan_id, sent_at, opened_at, pdf_url
- `scanner_concierge_audits` — Stripe payment intent ID, email, store URL, status, delivered_at

### `app_*` schema

- `shops` — shop_domain (PK), encrypted_access_token, scopes, plan_tier, installed_at, uninstalled_at
- `products` — shop_domain (FK), shopify_product_id, handle, title, updated_at, raw_payload (jsonb)
- `variants` — product_id (FK), shopify_variant_id, sku, barcode, price, inventory, raw_payload
- `metafields_index` — product_id (FK), namespace, key, type, value, storefront_visible
- `scores` — shop_domain (FK), scored_at, composite_score, gtinless_ceiling, pillar_scores (jsonb)
- `issues` — score_id (FK), pillar, severity, title, description, affected_count, revenue_impact_score
- `fixes` — shop_domain (FK), tier (1/2/3), status, created_by, confidence, preview_json, applied_at, revertable_until
- `fix_batches` — fix_batch_id, shop_domain, fix_type, product_count, before_state (jsonb), after_state (jsonb), reverted_at
- `webhook_events` — shopify_webhook_id (unique), topic, shop_domain, processed_at
- `channel_health` — shop_domain (FK), date, ai_clicks, ai_orders, ai_revenue_pence, google_shopping_approvals, ai_overviews_citations

Full schema lives in each app's `prisma/schema.prisma`. **#18 DBA** reviews every migration that transforms existing rows.

## Data flow

### Scanner path (public)

```
User enters store URL
  → POST /api/scan
  → BullMQ job: fetch /products.json + sitemap + JSON-LD samples
  → scoring/packages engine computes 3-of-6 pillars
  → scanner_scans updated with result
  → UI polls /api/scan/:id for completion
  → Email gate form submission → scanner_leads + Resend report send
```

### Shopify app install + initial sync

```
Merchant installs from App Store
  → OAuth callback, encrypt + store access token
  → Enqueue initial bulk sync job
  → bulkOperationRunQuery (streaming JSONL — see shopify-api-rules.md)
  → Products + variants + metafields written in 500-row chunks
  → Scoring job reads from app_products, computes all 6 pillars
  → app_scores + app_issues populated
  → Webhooks registered
  → Dashboard ready, merchant sees first scorecard
```

### Fix application

```
Merchant clicks "Apply fix" in dashboard
  → POST /api/fix with fix_batch_id + confidence threshold
  → BullMQ enqueues tier-appropriate job
  → Tier 1: direct Shopify mutation (productVariantsBulkUpdate etc.)
  → Tier 2: LLM enrichment via packages/llm → merchant preview → bulk apply
  → Tier 3: detect + guide (no mutation), surface guidance in UI
  → fix_batches row captures before/after for 7-day revert window
  → Channel Health attribution starts tracking via UTM on external URL metafield
```

### Drift monitoring

```
Shopify webhook fires (products/update)
  → HMAC verified (security-posture.md)
  → /api/webhooks/products-update → 200 within 5s
  → Job enqueued for re-score
  → If score change > threshold, alert enqueued (email + in-app)
  → Nightly incremental sync catches anything webhooks missed
  → Weekly full re-sync for paid tiers
```

## Feature gates

Enforcement: `apps/shopify-app/src/lib/tier.ts`. Canonical tier data comes from Shopify Managed Pricing for Growth/Scale; Postgres `shops.plan_tier` for Agency/Enterprise (direct invoice).

| Feature | Free | Growth £59 | Scale £159 | Agency £499 | Enterprise £599+ |
|---|---|---|---|---|---|
| Scorecard (read-only) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Refresh frequency | 30 days | Unlimited | Unlimited | Unlimited | Unlimited |
| Tier 1 auto-fixes | — | ✓ | ✓ | ✓ | ✓ |
| Tier 2 LLM enrichments | — | 500/mo | Unlimited | Unlimited | Unlimited |
| Tier 3 GTIN guidance + CSV import | — | ✓ | ✓ | ✓ | ✓ |
| Competitor benchmarking | — | — | ✓ | ✓ | ✓ |
| Drift alerts | — | Weekly | Daily | Daily | Realtime |
| White-label reports | — | — | — | ✓ | ✓ |
| Client store seats | — | 1 | 1 | 25 | Custom |
| API access | — | — | — | ✓ | ✓ |
| Custom attribute templates | — | — | — | — | ✓ |
| SLA (bulk sync) | None | Best-effort | 1K in 2h / 10K in 24h | Same as Scale | 50K in 72h |
| Dedicated Slack support | — | — | — | — | ✓ |

## External integrations

- **Shopify Admin GraphQL API** — primary data source (see `shopify-api-rules.md`)
- **Shopify Storefront API** — verify published state vs Admin state
- **Shopify Managed Pricing / AppSubscription** — billing for Growth + Scale tiers
- **Google Vertex AI** (`europe-west1` pinned) — Gemini Flash + Pro
- **Azure OpenAI** (`swedencentral`) — GPT-4o-mini fallback with circuit breaker
- **Resend** — transactional email (scanner full reports, app alerts)
- **Stripe** — Agency + Enterprise direct invoicing, £97 concierge audit one-offs
- **Sentry** — error tracking across both apps
- **PostHog** — product analytics (self-hosted on droplet)
- **BetterStack Uptime** — external monitoring on `flintmere.com`, `audit.flintmere.com`, `app.flintmere.com`, and the OAuth callback
- **GS1 GEPIR** (optional, paid per-call) — real-time GTIN verification at a rate-limited cadence

## BullMQ queues

- `scan` — public scanner jobs (priority high, concurrency 4)
- `sync` — Shopify bulk catalog sync (concurrency 2 per shop, global 8)
- `score` — pillar scoring after sync chunk (concurrency 4)
- `fix-tier1` — auto-safe mutations (concurrency 8)
- `fix-tier2` — LLM enrichment + merchant-gated bulk apply (concurrency 2)
- `drift` — webhook-triggered re-score (concurrency 8, debounced 30s per product)
- `alerts` — drift / standards-change / competitor-passed notifications
- `nightly-sync` — incremental re-sync per shop (cron 02:00 UTC)
- `weekly-sync` — full re-sync for paid tiers (cron Sunday 04:00 UTC)

## Observability

- **Logs:** structured JSON to Coolify log collector; 90-day retention hot, 13-month cold.
- **Errors:** Sentry per app; release tracking via commit SHA at build time.
- **Uptime:** BetterStack pings every 30s; PagerDuty routing for P0/P1 outages.
- **Business metrics:** PostHog events for the funnel (URL entered → scan complete → email submitted → install → first fix applied → upgrade). Canonical metric definitions in `../../memory/data-intelligence/metric-catalog.md`.
- **Cost tracking:** per-request LLM logging (provider, model, tokens in/out, cost pence). Monthly rollup in admin dashboard.

## ADRs

- `decisions/0001-single-repo-monorepo.md` — repo topology
- `decisions/0002-coolify-on-do.md` — deployment layer
- `decisions/0003-canon-neutral-bold-bracket.md` — visual canon
- `decisions/0004-prisma-over-drizzle.md` — ORM choice
- `decisions/0005-llm-provider-strategy.md` — primary + fallback LLMs
- `decisions/0006-hardcase-llm-lock-gemini-pro.md` — hard-case lock
- `decisions/0007-canon-amber-signature.md` — amber `#F8BF24` + asymmetric wordmark
- `decisions/0008-merchant-store-identity.md` — shop-as-PK + deferred agency overlay
- `decisions/0009-billing-api-shape.md` — Shopify Billing for Growth/Scale, Stripe Payment Element for Agency/Enterprise
