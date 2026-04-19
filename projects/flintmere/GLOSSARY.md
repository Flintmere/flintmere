# Flintmere — Glossary

Canonical definitions of terms used across Flintmere. Extended from `SPEC.md` Appendix B. Every cross-functional doc should use these terms with these meanings.

## Product

**Flintmere** — The product. Scores Shopify product catalogs for AI-agent readiness and fixes what's broken. The parent brand.

**Public scanner** — The tool at `audit.flintmere.com` that runs a partial (3-pillar) audit on any public Shopify store URL without installation. Public, no-auth.

**Shopify app** — The embedded merchant app at `app.flintmere.com`, installed via OAuth from the Shopify App Store. Full 6-pillar scoring + auto-fix engine.

**Marketing site** — `flintmere.com`. Lives inside the scanner app at launch; may split later.

**Concierge audit** — £97 one-off manual audit offered in SPEC §2.4 Week 1. Landing page at `flintmere.com/audit` or similar. Stripe-paid one-off, 48-hour delivery.

## Scoring system (six pillars)

**AI-readiness score** — Composite 0–100 score summarising how readable a catalog is by AI shopping agents. Weighted sum of the six pillars.

**Pillar** — One dimension of the score. Six pillars; each has a weight.

1. **Identifier completeness (20%)** — GTIN, MPN, brand, SKU presence and validity.
2. **Attribute completeness (25%)** — Metafield population against a vertical-specific template.
3. **Title & description quality (15%)** — Literal language, length, agent-parseability.
4. **Catalog mapping coverage (15%)** — Custom fields mapped to Shopify Catalog standard fields.
5. **Consistency & integrity (15%)** — Price/inventory/status alignment across Admin API, Storefront API, and rendered JSON-LD.
6. **AI checkout eligibility (10%)** — External URL metafield, store policies, published status.

**GTIN-less ceiling** — The maximum score a merchant can reach without investing in GS1 GTINs. Roughly 80/100 per SPEC §4.2.1. Surfaces explicitly in the scorecard ("Your ceiling without GTINs: 82").

**Full ceiling** — 100/100. Requires GS1 GTINs.

**Grade** — A letter (A / B / C / D / F) derived from the 0–100 score, shown alongside the numeric score for quick reading.

**Percentile** — Where a merchant ranks within their vertical and SKU band. "42nd percentile of supplement stores, 100–1,000 SKU band."

## Fixes

**Tier 1 — auto-safe** — Changes that cannot realistically go wrong (alt-text from vision LLM, moving existing barcode → typed GTIN metafield, populating `brand` from vendor). One-click apply, reversible for 7 days.

**Tier 2 — auto-suggest** — LLM-inferred changes requiring merchant approval per batch (title rewrites, attribute inferences, category suggestions). Dry-run preview on 5 sample products before bulk apply.

**Tier 3 — detect + guide** — Things Flintmere can't automatically fix (missing GTINs requires GS1 membership; missing store policies require merchant to write them). Detected and surfaced with guidance.

**Fix batch** — A group of changes applied in one action. Revertable as a unit within 7 days.

**Revert window** — 7 days. After that, Tier 1 and Tier 2 fix batches are no longer one-click-revertable (they can still be manually undone by applying inverse changes).

**Fix History** — Merchant-facing audit trail of every batch. Filterable by type, date, confidence threshold. CSV export.

**Dry-run preview** — Required before any Tier 2 bulk apply. Shows 5 sample products' before/after so the merchant approves the pattern before rolling across the full set.

## Catalog + data

**Product** — A Shopify product record. Has a handle, title, description, images, and one or more variants.

**Variant** — A specific SKU within a product (size, colour). Carries `barcode`, `sku`, `price`, `inventory`, own images.

**Metafield** — A custom attribute on a product or variant. **Typed metafields** have a schema (e.g., `material: String`, `volume_ml: Number`); **untyped** are free-text and score lower on attribute completeness.

**Metafield definition** — The schema for a metafield. Required for it to appear in Shopify Catalog Mapping.

**Storefront visibility** — Whether a metafield is exposed to the Storefront API (and therefore to agents that read via Storefront). `metafieldStorefrontVisibility` = `PUBLIC_READ` for agent-visible fields.

**Bulk operation** — `bulkOperationRunQuery` / `bulkOperationRunMutation`. The Shopify API path for multi-product reads/writes. Returns a signed URL to a JSONL file, which **must be streamed** (see `shopify-api-rules.md`).

## Identifiers

**GTIN** — Global Trade Item Number. The 8/12/13/14-digit number encoded in a UPC/EAN barcode. Licensed from GS1 (not generated, not sold by Flintmere).

**EAN** — European Article Number. A 13-digit GTIN variant.

**UPC** — Universal Product Code. A 12-digit GTIN variant used mainly in North America.

**MPN** — Manufacturer Part Number. The brand's internal product identifier (electronics, industrial goods). Not a GTIN.

**SKU** — Stock Keeping Unit. The merchant's internal identifier. Unique within the merchant's catalog; not a universal identifier.

**GS1** — The non-profit standards body that licenses GTINs. Flintmere is **not affiliated with GS1**.

**GS1 UK** — UK branch of GS1. Membership from £50/year (excl. VAT), turnover-based.

**GS1 US** — US branch of GS1. Offers single-GTIN ($30 one-time, <10 products) or Company Prefix (tiered annual).

**GEPIR** — GS1 Global Electronic Party Information Registry. Public database of who owns a given GTIN. Flintmere uses GEPIR (optional, rate-limited) to verify merchant GTINs.

## AI agents + protocols

**Agentic storefront** — Shopify's sales surface for AI shopping agents (ChatGPT, Gemini, Copilot). Stores opt in; Shopify publishes product data to the agents via protocols.

**ACP** — Agentic Commerce Protocol. OpenAI's standard for AI-agent commerce.

**UCP** — Universal Commerce Protocol. Google + Shopify joint standard for agentic checkout.

**JSON-LD** — JSON for Linked Data. Structured data format embedded in HTML product pages. Primary signal for AI agents parsing storefronts. Type `Product` + `Offer` required.

**Catalog Mapping** — Shopify's feature for mapping merchant-custom metafields to Shopify's standard Catalog fields (so agents see a normalised catalog).

**Shopify Catalog** — Shopify's normalised product-data layer that feeds agentic storefronts. Fills from Admin API + metafields + Catalog Mapping.

## Measurement

**Channel Health** — Flintmere's measurement layer (SPEC §11.2). Tracks AI-agent referrals via a UTM parameter injected on the external product URL metafield. Dashboards show AI-agent clicks, attributed orders, revenue.

**AI-visibility lift** — Estimated percentage increase in AI-agent visibility after a set of fixes. Always qualified as "estimated based on comparable stores in your vertical" — never promised.

**Drift** — When a merchant's score changes because their catalog changed (new products, title edits, inventory changes). Detected via webhooks + nightly incremental sync.

**Drift alert** — Notification sent to the merchant when score drift exceeds a threshold. Cadence by tier.

## Commerce + tiers

**Growth tier** — £49/month. SMB, <500 SKUs.

**Scale tier** — £149/month. Mid-market, 500–5,000 SKUs.

**Agency tier** — £399/month. Shopify agencies, 25 client store seats, white-label reports, API access.

**Enterprise tier** — £499+/month. Shopify Plus, 10,000+ SKUs, custom attribute templates, dedicated support.

**Client store seat** — One merchant store under an Agency tier subscription. Agency tier includes 25.

**Built for Shopify** — Shopify's certification programme for apps meeting elevated quality + performance standards. Requires install base + reviews + technical checklist. Target milestone: month 6+ per SPEC §9.

## Deployment + infrastructure

**Coolify** — The self-hosted PaaS running on the DigitalOcean droplet. Handles Docker deploys, reverse proxy (Traefik), SSL, backups.

**Droplet** — The DigitalOcean VM. Starts at Basic 2 vCPU / 8GB; upgrade trigger at ~30 paying merchants.

**BullMQ** — The Redis-backed job queue. Handles bulk sync, scoring, Tier 2 enrichment, drift re-score.

**Managed Pricing** — Shopify's built-in subscription API for Growth + Scale tiers (0% revenue share first $1M, 15% after).

## Council + governance

**Standing Council** — The 36-member advisory roster in `memory/PROCESS.md`. Consulted in spirit on non-trivial decisions.

**Sub-council** — Specialist group convened in addition to the Standing Council. Design Council (6), Copy Council (3), Legal Council (3).

**Veto power** — Authority held by specific Council members to block a decision. Noor (#8, accessibility), #24 (data protection), #11 (banned phrases), Legal Council (#9 + #23 + #24 on legal pages).

**ADR** — Architecture Decision Record. Numbered files under `projects/flintmere/decisions/`. Documents significant decisions with context + rationale + consequences.

## Changelog

- 2026-04-19: Initial glossary. Consolidated from SPEC.md Appendix B plus terms introduced by decisions 0001–0006 and the new product-engineering + design memory.
