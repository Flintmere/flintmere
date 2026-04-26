# claims-register.md

Append-only log of Flintmere's public claims + their source of truth. Every claim that appears in marketing, UI, docs, legal pages, outreach, or API responses should be traceable here.

If a claim isn't in this register, it either needs adding or it shouldn't be shipping.

## Entry format

```
## <short claim name>

- **Claim text (verbatim):** "<the sentence as it appears in public>"
- **Surfaces:** <where the claim lives — file paths, URLs, marketing copy>
- **Source of truth:** <BUSINESS.md:NN / ARCHITECTURE.md:NN / ADR path / external citation>
- **Classification:** factual | security | regulatory | commercial | performance
- **Last verified:** YYYY-MM-DD by <skill or person>
- **Risk if wrong:** <one line — what happens if the claim is inaccurate>
- **Status:** active | retired (replaced by <> on YYYY-MM-DD)
```

## Rules

- Append-only. Never edit a past entry to change a claim's history; add a follow-up entry marking the old one retired.
- Every claim shipped via any skill (`writer`, `conversion`, `legal-page-draft`, etc.) gets a register entry before or at ship time.
- `claim-review` and `security-claim-audit` operate against this register — any public claim not here is a P0 finding.
- Re-verify quarterly. `regulatory-change-response` and `security-claim-audit` run sweeps; stale "last verified" dates flag for re-check.

## Claim classifications

- **factual** — product facts (pillar count, tier prices, feature availability, SKU limits). Source: `BUSINESS.md` / `ARCHITECTURE.md` / `SPEC.md`.
- **security** — what Flintmere does / does not protect against (token encryption, HMAC verification, data-scrubbing on uninstall). Source: `memory/product-engineering/security-posture.md`. Highest scrutiny — #4 + #9.
- **regulatory** — GDPR, UK ICO, EU AI Act posture, Shopify Partner obligations. Source: legal pages + `regulatory-matrix.md`. **#24 veto.**
- **commercial** — tier, pricing, Agency-seat count, Shopify Managed Pricing terms. **#11 gatekeeper.**
- **performance** — scan time, AI-readiness lift percentages, bulk sync SLAs, uptime. Source: `metric-catalog.md` + `performance-budget.md`.
- **AI-outcome** — any claim about AI-agent behaviour (ChatGPT / Gemini / Copilot recommending the store). **Highest scrutiny. #21 Technical + #23 Regulatory must both sign off.** Never guarantee; always qualify as "estimated based on comparable stores."

## Banned claim patterns (enforce across every entry)

- "Will appear in ChatGPT" / "Will be recommended by AI agents" → reject. Use: "catalog made legible to AI agents."
- "Guaranteed visibility lift" → reject. Use: "estimated ~N% visibility lift based on comparable stores in your vertical."
- "Generate valid barcodes" / "Issue GTINs for you" → reject. Flintmere does not issue GTINs.
- "GDPR compliant" → reject. Use: "designed to comply with UK GDPR; see our Privacy Policy."
- "Bank-level security" / "Military-grade encryption" → reject. Meaningless marketing phrases with regulatory exposure.
- "100% safe" / "100% secure" / "100% anything" → reject.
- "Trusted by thousands" without evidence → reject.
- "Free forever" as a blanket → reject. Use "Free scanner; paid tiers from £49/mo."
- Any claim that implies GS1 affiliation → reject + disclaimer required.
- Any claim implying outcomes about Shopify's own ranking / search surfaces → reject + #23 review.

## Known claims (seed — backfill as copy ships)

<!-- Initial entries land via the first `claim-review` sweep when marketing copy ships. Skeletons below seed the pattern. -->

### Pillar count — 6

- **Claim text:** "Six pillars: identifiers, attributes, titles, catalog mapping, consistency, AI checkout eligibility."
- **Surfaces:** marketing site (pillars section), scanner results, Shopify app dashboard, email reports.
- **Source of truth:** `projects/flintmere/SPEC.md` §4.1, `projects/flintmere/ARCHITECTURE.md`.
- **Classification:** factual
- **Last verified:** <to be set by first claim-review pass>
- **Risk if wrong:** every surface out of sync; merchant trust erosion.
- **Status:** retired (replaced by "Pillar count — 7" on 2026-04-26 — SPEC.md and homepage already shipped seven; this entry was stale).

### Pillar count — 7

- **Claim text:** "Seven pillars: identifiers, structured attributes, titles, Google category match, data consistency, AI agent access (crawlability), agent checkout readiness."
- **Surfaces:** marketing site (`apps/scanner/src/app/page.tsx` pillars section), scanner results, Shopify app dashboard, email reports.
- **Source of truth:** `projects/flintmere/SPEC.md` ("seven weighted pillars"); `packages/scoring/src/types.ts` `PILLAR_WEIGHTS` (sum 100); `apps/scanner/src/app/page.tsx` pillar list.
- **Weights:** identifiers 20, attributes 20, titles 15, mapping 15, consistency 15, checkout-eligibility 10, crawlability 5. Sum 100.
- **Classification:** factual
- **Last verified:** 2026-04-26 by `claim-review` (sweep at `context/compliance/reviews/2026-04-26-homepage-hero-post-agentic-storefronts.md`).
- **Risk if wrong:** every surface out of sync; merchant trust erosion. Weight column on the homepage must always sum to 100 — Claim 9 in the 2026-04-26 review found a 110% bug shipped to production.
- **Status:** active

### Pricing — Growth £49 / Scale £149 / Agency £399 / Enterprise £499+

- **Claim text:** tier prices as in `BUSINESS.md` §Tiers.
- **Surfaces:** pricing page, scanner CTA, Shopify app upgrade flow, Shopify Managed Pricing config, Stripe product configuration.
- **Source of truth:** `projects/flintmere/BUSINESS.md` §Tiers + Shopify App Subscription configuration + Stripe Dashboard price IDs.
- **Classification:** commercial
- **Last verified:** <>
- **Risk if wrong:** mismatched copy vs checkout → trust loss + ASA/FTC exposure on advertising.
- **Status:** retired (replaced by "Pricing — Growth £59 / Scale £159 / Agency £499 / Enterprise £599+" on 2026-04-26 — register was stale relative to `apps/scanner/src/lib/pricing.ts`).

### Pricing — Growth £59 / Scale £159 / Agency £499 / Enterprise £599+

- **Claim text:** Free £0 · Growth £59/mo · Scale £159/mo · Agency £499/mo · Enterprise £599+/mo. Plus £97 one-off concierge audit.
- **Surfaces:** marketing homepage `/#pricing`, pricing page `/pricing`, scanner CTA, Shopify app upgrade flow, Shopify Managed Pricing config (Growth + Scale), Stripe product configuration (Agency + Enterprise + £97).
- **Source of truth:** `projects/flintmere/BUSINESS.md` §Tiers; canonical TIERS array in `apps/scanner/src/lib/pricing.ts`.
- **Classification:** commercial
- **Last verified:** 2026-04-26 by `claim-review`.
- **Risk if wrong:** mismatched copy vs checkout → trust loss + ASA/FTC exposure on advertising.
- **Status:** retired (replaced by "Pricing — Growth £79 / Scale £249 / Agency £499 / Plus from £1,500" on 2026-04-26 — operator-confirmed restructure post-Agentic-Storefronts; Enterprise renamed Plus + price floor raised).

### Pricing — Growth £79 / Scale £249 / Agency £499 / Plus from £1,500

- **Claim text:** Free £0 · Growth £79/mo · Scale £249/mo · Agency £499/mo · Plus from £1,500/mo. Plus £97 one-off concierge audit.
- **Surfaces:** marketing homepage `/#pricing`, pricing page `/pricing`, scanner CTA, Terms of Service, Privacy Policy, DPA, Support page, Shopify app upgrade flow (when shipped), Shopify Managed Pricing config (Growth + Scale), Stripe product configuration (Agency + Plus + £97).
- **Source of truth:** `projects/flintmere/BUSINESS.md` §Tiers; canonical TIERS array in `apps/scanner/src/lib/pricing.ts`; spec at `context/requirements/2026-04-26-pricing-restructure.md`.
- **Classification:** commercial
- **Last verified:** 2026-04-26 by `claim-review` post-pricing-restructure.
- **Risk if wrong:** mismatched copy vs checkout → trust loss + ASA/FTC exposure on advertising. Pre-launch state means no grandfathering risk; first paid signup anchors prices.
- **Status:** active. Stripe + Shopify Managed Pricing dashboard config to be updated by operator before first paid signup. Pricing restructure success metric: month-6 MRR ≥ 1.30× modeled-baseline at same paying-customer count (per requirements spec §3).

### AI visibility uplift — "3–4× at 99%+ attribute completion"

- **Claim text:** "Stores at 99%+ attribute completion see 3–4× higher AI visibility."
- **Surfaces:** marketing numbers strip, scanner stats, email reports.
- **Source of truth:** `projects/flintmere/SPEC.md` Appendix A; cited from industry reporting (verify exact source before publishing each cycle).
- **Classification:** performance + AI-outcome
- **Last verified:** <>
- **Risk if wrong:** overpromise = ASA / FTC exposure; trust loss. Always qualify "at 99%+ attribute completion" — never as standalone lift.
- **Status:** active

### 60-second scan promise

- **Claim text:** "Know where you stand in 60 seconds."
- **Surfaces:** scanner hero, marketing hero, email report.
- **Source of truth:** `performance-budget.md` (scan-complete-to-results ≤ 55s wall clock, 5s buffer).
- **Classification:** performance
- **Last verified:** <>
- **Risk if wrong:** if scans regularly exceed 60s, claim becomes deceptive; retire or adjust.
- **Status:** active

### Agency tier — 25 client store seats

- **Claim text:** "Agency tier includes 25 client store seats."
- **Surfaces:** pricing page, Agency sales collateral, `BUSINESS.md`.
- **Source of truth:** `projects/flintmere/BUSINESS.md` §Agency tier.
- **Classification:** commercial
- **Last verified:** <>
- **Risk if wrong:** feature-gating logic and pricing page out of sync.
- **Status:** active

### GTIN non-affiliation disclaimer

- **Claim text:** "Flintmere is not affiliated with GS1. Identifier requirements vary by marketplace and jurisdiction."
- **Surfaces:** scanner results (wherever GTINs are referenced), Shopify app GTIN panel, email reports, pricing page GS1-fee line, marketing GTIN guidance.
- **Source of truth:** legal requirement (avoid implied association with GS1).
- **Classification:** regulatory
- **Last verified:** <>
- **Risk if wrong:** trademark exposure + implied endorsement; #23 + #24 review veto on removal.
- **Status:** active

### Reversible fix window — 7 days

- **Claim text:** "Every change previewed. Every change reversible for 7 days."
- **Surfaces:** marketing, Shopify app Fix History, Terms of Service.
- **Source of truth:** `projects/flintmere/SPEC.md` §5.1 + `memory/product-engineering/architecture-rules.md` (fix_batches retention).
- **Classification:** factual + commercial
- **Last verified:** <>
- **Risk if wrong:** legally enforceable if shipped in ToS; engineering must back it.
- **Status:** active

## When a claim changes

1. `claim-review` (or the originating skill) flags the proposed change.
2. Legal Council convenes. #24 VETO applies if the change touches privacy / consent. #23 approval required on regulatory claims. #21 Technical on factual accuracy.
3. Every surface in the "Surfaces" line updates in lockstep (hand off to `writer` / `web-implementation` / `legal-page-draft` / engineering).
4. The old entry is marked `retired (replaced by <new entry> on YYYY-MM-DD)`.
5. A new entry is appended for the updated claim.

No orphan claims. No partial updates.

## Changelog

- 2026-04-19: Rewritten for Flintmere. Replaced allowanceguard Web3 claims (chain count, non-custodial, free-scanner) with Flintmere claims (pillar count, tier pricing, AI-uplift qualifiers, GTIN disclaimer, 60-second promise, 7-day reversibility).
