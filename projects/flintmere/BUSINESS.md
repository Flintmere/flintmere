# Flintmere — Business Truth

Pricing, positioning, revenue model. Claude reads this on pricing-page edits, marketing copy, claim review, and any cross-functional prioritisation.

## Positioning

- **For:** Shopify merchants with 100–5,000 SKUs and £500K–£20M revenue; Shopify agencies (Plus Partner or growing) managing 5–50 client stores.
- **Against:** generic SEO apps retrofitted for AI, fake-GTIN resellers, black-box AI-fix vendors, one-time consulting audits. See `SPEC.md` §11 for the named competitor list.
- **Wedge:** the only tool combining a scoring system, automated fix engine, honest GTIN guidance, and real AI-visibility measurement (Channel Health, SPEC §11.2). Agency-friendly by default.
- **One-line promise:** "Your product catalog is `[ invisible ]` to ChatGPT. We score it, fix it, and show you what changes."
- **Canonical positioning frame:** We don't sell SEO. We make your catalog legible to the agents that will decide your next sale.

## Revenue goal

- **Short-term (month 6):** 50 paying merchants, ~£5K MRR. Validates product-market fit, funds continued build.
- **Near-term (month 12):** 250 paying merchants, ~£25K MRR. Comfortable operator income + first hire possible.
- **12–18 months:** 500 paying merchants, ~£50K MRR. True small business.
- **18–36 months:** 1,000+ paying merchants, ~£100K+ MRR, 2–4 person team.

Per-100-merchant unit economics summary (full math in conversation memory, summary here):

- Gross MRR at 100 paying: ~£10,600 (tier mix 70/20/8/2 across Growth/Scale/Agency/Enterprise)
- Direct costs (infra + LLM + email + Sentry): ~£320/mo
- Overhead (insurance, legal, support tool, content): ~£960/mo
- **Net margin before founder pay: ~77%** (£8,100/mo per 100 merchants)

The cost side is controlled. The bet is on acquisition.

## Tiers

### Free

- **Price:** £0
- **Scope:** Read-only scorecard. Pillar breakdown. One refresh per 30 days.
- **Limits:** No auto-fixes. No enrichment. No drift alerts.
- **Purpose:** tire-kicker filter; funnel into Growth tier.

### Growth — £59/month

- **Price:** £59/month. 14-day trial (no first-month discount — see ADR 0009).
- **Target:** SMB stores, <500 SKUs, <£1M revenue.
- **Scope:** Unlimited audits. Tier 1 auto-safe fixes. 500 Tier 2 LLM enrichments per month. Weekly drift alerts. Score history (30 days).
- **Shopify pricing ID:** `STRIPE_PRICE_GROWTH_MONTHLY` (via Shopify Managed Pricing, not direct Stripe).

### Scale — £159/month

- **Price:** £159/month. 14-day trial.
- **Target:** Mid-market, 500–5,000 SKUs, £1M–£10M revenue.
- **Scope additions:** Unlimited Tier 2 enrichments. Competitor benchmarking. Daily drift alerts. Priority support. Bulk sync SLA (1K products within 2h, 10K within 24h). Score history (12 months).
- **Shopify pricing ID:** `STRIPE_PRICE_SCALE_MONTHLY`.

### Agency — £499/month

- **Price:** £499/month.
- **Target:** Shopify agencies managing 5–50 client stores.
- **Scope additions:** 25 client store seats. White-label reports (remove Flintmere branding, add agency logo). API access. Per-client benchmarking. Agency dashboard for cross-client score views.
- **Billing:** direct Stripe invoicing (not Shopify Managed Pricing — agencies own the relationship).
- **Economic significance:** SPEC §8.2 — Agency tier is the economic engine. One sale = 25 stores on the platform. Ratio of revenue to acquisition cost is 8–10× better than direct merchant sales.

### Enterprise — £599+/month

- **Price:** £599/month floor. Custom pricing above.
- **Target:** Shopify Plus (£500K/mo+ platform fee tier), 10,000+ SKUs.
- **Scope additions:** 50,000 SKU support (custom rate limits). Custom attribute templates per vertical. Dedicated Slack support channel. Monthly strategy call. Per-contract SLAs. SOC 2 posture review (when needed).
- **Billing:** direct Stripe invoicing, contract-based, annual pre-pay available at 15% discount.
- **Model:** "Contact sales" at launch — published price, gated behind a booked call. First 2–3 deals teach what belongs in the tier.

## Payment stack

- **Shopify Managed Pricing** for Growth + Scale (automatic subscription, no Stripe integration needed).
  - Shopify keeps: 0% on first $1M lifetime (2025 policy), 15% after.
- **Stripe direct** for Agency + Enterprise + the £97 concierge audit (SPEC §2.4).
- No crypto payments. No alternative gateways.

## Promotions

- **14-day trial on Growth and Scale.** Via Shopify Billing `trialDays`. No first-month discount, no price override — see ADR 0009.
- **Agency trial:** 30-day full-feature trial of Agency tier, no card required. Converts via 25-store scorecard preview.
- **Enterprise annual pre-pay:** 15% off on 12-month pre-pay. Applied at contract signature.
- **No share-for-trial loop at launch.** Revisit if month-3 conversion data shows price is the blocker (SPEC §2.1.3 is superseded on this point).

## Refunds / cancellation

- **30-day no-questions refund** (SPEC §10.3). Mitigates chargeback risk and signals confidence.
- **Cancellation:** any time, effective at end of current billing period. No pro-rating on monthly; pro-rated on annual.
- **Data retention after cancel:** 30-day grace window for reinstall. After 30 days, scoring data purged; tokens scrubbed within 60s of uninstall (see `memory/product-engineering/security-posture.md`).

## Positioning copy rules

Canonical voice rules live in `../../memory/VOICE.md`. Business-specific:

### Banned phrases

- "Bulletproof," "zero-risk," "guaranteed" (overpromise — compliance exposure)
- "Revolutionary," "game-changing," "disruptive" (#11 Investor voice: marker of weak signal)
- "AI-powered" (we are — we don't brag about it)
- "Unlock," "elevate," "empower" (SaaS fluff)
- "Trusted by" (we earn trust, we don't claim it)
- "Best-in-class" without benchmark citation

### Required framing

- **On GTINs:** always include "Flintmere is not affiliated with GS1. Identifier requirements vary by marketplace and jurisdiction" when surfacing GTIN guidance (SPEC §5.3 legal note).
- **On AI visibility lift:** always qualify estimates — "estimated ~34% lift based on comparable stores in your vertical," never "will increase by 34%."
- **On pricing:** GS1 fees are separate. State it explicitly on pricing page.
- **On fixes:** "every change previewed and reversible for 7 days" is a load-bearing claim — do not weaken it.

### The seven narrative anchors

Every marketing piece should sit on one of these seven:

1. **The AI shopping shift is here** — 15× YoY growth, 5.6M stores auto-enrolled.
2. **Your catalog is invisible** — 40% of catalogs ignored by AI agents.
3. **The six pillars** — what we score, why it matters.
4. **Before / after agentic commerce** — the paradigm change.
5. **Honest GTIN guidance** — we don't sell fake barcodes.
6. **Channel Health** — measured impact, not faith-based.
7. **Agency-friendly** — score your clients, improve their scores.

## Competitors (quick reference, full in SPEC §11)

- **Agent IQ / 40rty.ai** — direct competitor, early stage, no Built-for-Shopify yet.
- **Alhena AI** — adjacent (AI shopping assistant + SEO audit), broader surface.
- **Stellagent** — consulting-led, not a scalable product.
- **Shopify Catalog (native)** — free, auto-enrolled; basic, not a diagnostic.
- **Generic SEO apps** — Schema Plus, JSON-LD for SEO; don't address agent-specific requirements.

Positioning gap: nobody combines agency-grade diagnostic + automated fix engine + honest GTIN guidance + real AI-visibility measurement.

## ADR pointers

- `decisions/0003-canon-neutral-bold-bracket.md` — the visual positioning
- `SPEC.md` — the full Product & GTM plan (v1.2, canonical for intent)
