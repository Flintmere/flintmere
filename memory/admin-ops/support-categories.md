# support-categories.md — Taxonomy + routing

Categorical scheme used by `support-triage` to bucket Flintmere support contacts. Categories are stable; new categories require an ADR. Routing tells the triage skill which downstream skill / department picks up a recurring trend.

## Schema

Every ticket maps to **exactly one** primary category + zero or more secondary tags. Aggregation is by primary category × week.

## Primary categories

### billing
- **Covers**: Shopify Managed Pricing issues, Stripe Agency/Enterprise invoice queries, concierge audit refund requests, tier-change confusion, cancellation questions.
- **Routing if trending up**: `implement-checkout-flow` (if flow defect), `conversion` (if pricing-page confusion), `writer` (if microcopy ambiguity).
- **Compliance**: refund handling per Stripe ToS + UK consumer law (#9).
- **Privacy**: never quote customer email or amount in a brief; counts only.

### scan-failure
- **Covers**: public scanner submissions that fail — "scan didn't return data", "timeout", "my store URL is valid but it says not Shopify", "wrong product count".
- **Routing if trending up**: `debug-prod-incident` (if reliability breach), `fix-bug` (if defect).
- **Cross-check**: against `scan_success_rate_24h` red line in `metric-catalog.md`.

### sync-failure
- **Covers**: Shopify app bulk sync issues — "sync stuck", "some products missing", "attribute update didn't reflect", "sync too slow".
- **Routing if trending up**: `debug-prod-incident`, `fix-bug`, possibly `webhook-review` if webhook drift.
- **Product invariant**: streaming JSONL parser must handle large catalogs (see `shopify-api-rules.md`).

### fix-error
- **Covers**: auto-fix failures — "fix didn't apply", "fix broke my product", "revert didn't work", "dry-run preview was wrong".
- **Routing if trending up**: `fix-bug`, `debug-prod-incident`, escalate to #4 + #33 if data loss suspected.
- **Critical**: always offer full revert + escalate if merchant reports actual damage.

### score-confusion
- **Covers**: "why is my score 64?", "what is pillar X?", "my competitor scores higher, why?", "the scanner and app show different scores".
- **Routing if trending up**: `writer` (if docs gap), `design-critique` (if UX unclear), `clarify` (if microcopy).

### gtin-guidance
- **Covers**: questions about GTINs, GS1 membership, barcode import, "do I really need GTINs?".
- **Routing if trending up**: `writer` (if docs gap), `legal-page-draft` if disclaimer language is unclear.
- **Critical**: always include the non-affiliation disclaimer in every reply.

### install / auth
- **Covers**: Shopify OAuth failures, install loops, permissions-scope questions, "the app won't load inside Shopify admin".
- **Routing if trending up**: `fix-bug`, `debug-prod-incident`, escalate to #4 if credential-stuffing pattern suspected.

### agency-admin
- **Covers**: Agency tier questions — "how do I add a client store?", "can I white-label?", "API access how-to", "seat count confusion".
- **Routing if trending up**: `conversion` (if pre-purchase confusion), `build-feature` (if feature gap), `writer` (if docs gap).

### enterprise / sales
- **Covers**: Enterprise inbound, SOC 2 requests, custom-MSA requests, large-catalog-pilot inquiries.
- **Routing**: operator + `partnership-brief` / `sponsorship-brief` as appropriate. Not auto-routed.

### docs
- **Covers**: "the docs say X but the product does Y", broken links, missing examples, unclear quickstart.
- **Routing**: `docs-coherence-audit` (if systemic), `writer` (if single doc), `clarify` (if in-product microcopy).

### feature-request
- **Covers**: "can you add X?", "would love Y", new-vertical requests, integration requests.
- **Routing**: aggregate trend → `content-strategy` (for acknowledgement), `build-feature` (if approved), `integration-proposal` (if partner-shaped).
- **Note**: most feature-requests get a personal reply; aggregates inform roadmap.

### legal
- **Covers**: privacy questions, GDPR / CCPA DSARs, terms-of-service questions, deletion requests, Shopify merchant data queries.
- **Routing**: operator + #9 + #24 immediately. Never auto-routed.
- **Compliance**: DSAR window = 1 month (UK GDPR Art 12). Triage flags as time-sensitive.

### security-report
- **Covers**: responsible-disclosure reports, "I found a vulnerability", phishing reports.
- **Routing**: operator + #4 immediately. Reference `SECURITY.md` flow.
- **Privacy**: private channel only. Acknowledged within 48h per SLA.

### partner / press
- **Covers**: inbound partnerships (Shopify, PIM vendors, SEO apps), press requests, podcast invitations.
- **Routing**: operator + relevant Growth skill (`partnership-brief`, `outreach`).
- **Note**: not support per se, but lands in same inbox. Categorised to keep support trends clean.

### spam / unrelated
- **Covers**: phishing, sales pitches, off-topic.
- **Routing**: deleted; counted only for inbox health.

## Secondary tags (multi-select)

Granularity within a category:

- `tier:<free|growth|scale|agency|enterprise>`
- `vertical:<beauty|supplements|apparel|electronics|home|other>`
- `sku-band:<100-500|500-5k|5k-10k|10k+>`
- `shopify-plan:<basic|shopify|advanced|plus>`
- `repeat-contact` — operator-tagged when known; never inferred from PII
- `time-sensitive` — DSAR window, security report, payment-blocking

## Volume thresholds (when to escalate)

A category exceeding **15% of weekly volume** OR **3× its 4-week baseline** is escalated in the triage brief. Smaller spikes flagged, not escalated.

## Anti-patterns

- Reporting individual tickets in a brief.
- Quoting user message text.
- Naming merchants.
- Categorising security reports as "security-report" without immediate operator + #4 notification.
- Treating feature-request count as a feature-request mandate. Counts inform; roadmap is owned by operator.

## Maintenance

- Quarterly review by #36 + #24 + #4.
- New category requires an ADR + #36 sign-off.
- Removing a category requires re-tagging historical entries; never silently drop.

## Changelog

- 2026-04-19: Rewritten for Flintmere. Replaced allowanceguard support categories (scan-failure → wallet scan, revoke-failure, sentinel, api, chain-specific tags) with Flintmere categories (scanner URL, Shopify bulk sync, fix-error, score confusion, GTIN guidance, install/auth, agency-admin, enterprise/sales). Secondary tags now by tier/vertical/SKU-band/Shopify-plan.
