# integrations.md

Current integrations + requested integrations + technical constraints per partner. Operational file for `integration-proposal`.

## Integration shapes

Flintmere can be integrated **outbound** (partner embeds Flintmere scores / insights into their UI) or **inbound** (Flintmere consumes partner data to enrich its scoring). Most opportunities are **outbound — the scoring API + merchant dashboard are the valuable surfaces** — and **inbound infrastructure** (Shopify, Vertex AI, etc.) is mandatory for operation.

### Outbound integration surfaces

- **REST API** — `projects/flintmere/ARCHITECTURE.md` documents the canonical API (Agency + Enterprise tiers). Rate-limited; tier-appropriate.
- **Shareable scorecards** — `flintmere.com/score/<shop-slug>` public badge widget for merchants to embed in their site footer.
- **Webhooks** — partners can subscribe to score-drift events for their client merchants.
- **White-label reports** — Agency tier: PDF + HTML reports with agency branding.
- **CSV exports** — score history, fix history, pillar-level breakdowns.

### Inbound integrations (where Flintmere consumes partner data)

- **Shopify Admin + Storefront APIs** — core; see `memory/product-engineering/shopify-api-rules.md`.
- **Google Cloud Vertex AI + Azure OpenAI** — LLM providers; see ADRs 0005 + 0006.
- **Stripe + Shopify Managed Pricing** — billing.
- **GS1 GEPIR** (optional, rate-limited) — GTIN verification.
- **PIM vendor APIs** (roadmap) — direct read from Plytix / Sales Layer / Akeneo etc. to reduce merchant friction for mid-market.

## Current integrations (core infrastructure — all inbound)

### Shopify (Admin + Storefront + Managed Pricing + Webhooks)
- **Shape:** inbound infrastructure + commercial.
- **Surface:** the entire Shopify app (`apps/shopify-app`).
- **Agreement:** Shopify Partner Program Agreement.
- **Notes:** see `memory/product-engineering/shopify-api-rules.md`.

### Google Vertex AI
- **Shape:** inbound infrastructure.
- **Surface:** `packages/llm` provider adapter; used by scoring + enrichment paths.
- **Agreement:** Google Cloud Master Services Agreement + DPA. Region-pinned `europe-west1`.
- **Notes:** ADR 0005 + 0006.

### Azure OpenAI
- **Shape:** inbound infrastructure (fallback).
- **Surface:** circuit-breaker fallback in `packages/llm`.
- **Agreement:** Microsoft Enterprise Services Agreement + DPA. Region EU.

### Stripe
- **Shape:** inbound payment infrastructure.
- **Surface:** Agency + Enterprise direct invoicing + £97 concierge audit one-offs.
- **Agreement:** Stripe standard ToS.

### Resend
- **Shape:** inbound infrastructure (transactional email).
- **Surface:** scanner full reports, app drift alerts, support replies.
- **Agreement:** Resend standard ToS + DPA.

### Sentry
- **Shape:** inbound infrastructure (observability).
- **Surface:** error tracking for both apps.
- **Agreement:** Sentry standard ToS + DPA (PII-scrubbed).

### PostHog
- **Shape:** inbound infrastructure (self-hosted analytics).
- **Surface:** product analytics; runs on the Coolify droplet.
- **Agreement:** self-hosted open source; no data leaves our droplet.

### GS1 GEPIR (optional)
- **Shape:** inbound reference data.
- **Surface:** real-time GTIN verification at rate-limited cadence.
- **Agreement:** GS1 terms for their public-ish API.

## Requested / in-progress integrations (outbound — the growth opportunities)

<!-- Append as conversations begin. Entries here become `partnerships-history.md` records once formal engagement happens. -->

### Entry template

```
### <Partner name>
- **Shape:** outbound API | white-label report | shareable badge | data exchange | webhook subscription
- **Status:** scoping | proposal drafted | proposal sent | technical conversation | build | live | declined | paused
- **Contact:** <person, role, company, channel>
- **Technical constraints:**
    - Shopify merchants they serve: <segment / vertical>
    - Required response time: <>
    - Required SLA: <>
    - Data shape they want: <pillar scores | issue list | Channel Health | full scorecard>
- **Commercial shape:** <free tier access for their users, paid API tier, revenue share, integration-funded build>
- **Timeline:** <>
- **Flintmere-side work:** <engineering effort; handoff to build-feature>
- **Partner-side work:** <their effort estimate>
- **Risk flags:** <jurisdiction, brand alignment, exclusivity ask>
- **Last activity:** YYYY-MM-DD
```

## Integration shapes by partner type

### PIM vendors

- **Shape:** Flintmere reads product data from PIM → scores → writes suggestions back to PIM via their API (if supported) or exports CSV for merchant to import.
- **Partners:** Plytix, Sales Layer, Akeneo, Pimcore.
- **Value to partner:** their customers get an AI-readiness score layer.
- **Value to us:** direct channel to mid-market merchants; reduces onboarding friction.

### Shopify agencies

- **Shape:** Flintmere Agency tier with API + white-label reports embedded in agency's client dashboards.
- **Value to partner:** client-retention tool; QBR artefact.
- **Value to us:** 25-store seats per agency = leverage (SPEC §8.2).

### Complementary Shopify apps

- **Shape:** cross-promotion + joint content. Non-competitive apps (PIM-adjacent, SEO apps for keyword search, headless-stack apps).
- **Partners:** Klaviyo (email), Yotpo (reviews), Judge.me (reviews), Gorgias (support).
- **Value:** joint case studies ("how a Klaviyo + Flintmere stack lifted X"); not deep integrations.

### Shopify ecosystem (platform-level)

- **Shape:** Built-for-Shopify badge, App Store category features, Shopify Plus Partner Directory listing.
- **Value:** credibility + merchant-visible distribution.

### Research + content partnerships

- **Shape:** "State of AI Readiness in [Vertical]" research reports co-published with ecommerce media (Modern Retail, Retail Dive, eComExperts).
- **Value:** category-defining content + distribution.

### Platform integrations (future)

- **Shape:** when Flintmere expands beyond Shopify (WooCommerce / BigCommerce / Salesforce Commerce Cloud — not at launch).
- **Status:** not pursued. Revisit at month 12+ with 500+ paying merchants.

## Technical standards we maintain for outbound integrations

- **OpenAPI spec** — public; canonical path documented in `projects/flintmere/ARCHITECTURE.md` (when API ships). Every partner references this.
- **Rate-limit tiers** — per API tier; documented. Partners negotiate higher tiers if justified.
- **Webhook reliability** — signed (HMAC), idempotent, versioned. See `webhook-review` skill.
- **SDK compatibility** — semver; breaking changes batched into major releases with 90-day deprecation notice.
- **Uptime story** — honest SLA, not marketing SLA. Current: best-effort 99.5% on scanner + app. Enterprise SLAs contractual.

## Hard-no integration patterns

We do not integrate with:

- Partners operating in OFAC-sanctioned jurisdictions.
- Partners who request that Flintmere hide specific merchants' low scores from their clients.
- Partners who require Flintmere to white-label in ways inconsistent with the legibility-bracket signature (the signature is non-negotiable on our surfaces).
- Partners who require exclusivity we are not prepared to offer. We are not exclusive to any specific Shopify plan tier or vertical.
- Partners whose primary business is selling fake barcodes or GTINs (conflict with our canonical honesty posture).

## How this file is maintained

- On every `integration-proposal` run: verify status + technical constraints per entry.
- On every integration shipping / pausing / ending: update status + `partnerships-history.md`.
- On every change to Flintmere's own API / SDK / reference data: update the "Technical standards" section.
- On every integration termination: the reason is recorded in `partnerships-history.md`; facts only.

## Changelog

- 2026-04-19: Rewritten for Flintmere. Replaced allowanceguard integration targets (wallet Snaps, DEX embeds, security-tool data exchanges, chain ecosystem listings) with Flintmere-appropriate integrations (PIM vendors, Shopify agencies, complementary Shopify apps, research content partnerships).
