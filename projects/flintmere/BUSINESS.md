# Flintmere — Business Truth

Pricing, positioning, revenue model. Claude reads this on pricing-page edits, marketing copy, claim review, and any cross-functional prioritisation.

## Positioning

- **For:** UK food merchants (100–5,000 SKUs, £500K–£20M revenue) pushing to Google Merchant Center, Amazon Fresh, Ocado, Deliveroo, ChatGPT shopping, Perplexity. Food-first per ADR 0015. Beauty + apparel pages remain live (in development) and earn organic interest. Agencies managing 5–50 client stores supported via vertical-bundle agency tiers (per ADR 0016).
- **Against:** generic SEO apps retrofitted for AI, fake-GTIN resellers, black-box AI-fix vendors, one-time consulting audits, generic catalog tools that price on store count rather than regulatory complexity. See `SPEC.md` §11 for the named competitor list.
- **Wedge:** the only tool combining vertical regulatory taxonomy depth (`standards.flintmere.com/food/v1` per ADR 0018), an automated fix engine, honest GTIN guidance, and real AI-visibility measurement (Channel Health, SPEC §11.2). The standards publication is the artifact a third party can cite — no other Shopify-adjacent tool maintains a citable, dated, regulator-grounded catalog standard.
- **One-line promise:** "ChatGPT lists you and every competitor. Yours ranks `[ last ]`. We show why and fix it." (Updated 2026-04-26 post-Shopify Agentic Storefronts announcement; "invisible" framing retired — see `context/compliance/reviews/2026-04-26-homepage-hero-post-agentic-storefronts.md`.)
- **Canonical positioning frame:** We don't sell SEO. We make your catalog legible to the agents that will decide your next sale.

## Decision-making framework

Flintmere does not ship through one person's instinct. Every non-trivial decision — product, design, copy, legal, regulatory, pricing — passes through the **Flintmere Standing Council**, a 39-role specialist review framework with codified veto holders documented in `memory/PROCESS.md`. Sub-councils convene by domain: Copy Council (4 voices) reviews every customer-facing sentence; Legal Council (3 voices) gates every legal page; Design Council (6 voices, Noor's accessibility veto) gates every visual surface. Council seat #39 (Regulatory Affairs, added 2026-04-26) holds veto on standards publication accuracy.

This is unusual at our scale. Most SaaS tools at Flintmere's stage ship on one engineer's gut. Flintmere ships through reviewed lenses with explicit, named vetoes. It's why the standards publication is citable, why our claims survive `claim-review`, and why a sophisticated buyer can rely on what's on the site.

**Public framing rule (council, 2026-04-26):** customer-facing surfaces never use single-named-individual framing ("John," "founder," "I"). Phrasing is "we" / "the Flintmere team" / specific council seats by function. Procurement and `/about` surfaces name the legal entity (Eazy Access Ltd), the accountable director (John Morris), AND the council operating model — three separate questions, three separate answers.

## Revenue goal

- **Short-term (month 6):** 50 paying merchants, ~£5K MRR. Validates product-market fit, funds continued build.
- **Near-term (month 12):** 250 paying merchants, ~£25K MRR. Comfortable operator income + first hire possible.
- **12–18 months:** 500 paying merchants, ~£50K MRR. True small business.
- **18–36 months:** 1,000+ paying merchants, ~£100K+ MRR, 2–4 person team.

Per-100-merchant unit economics summary (full math in conversation memory, summary here):

- Gross MRR at 100 paying: ~£17,500 (tier mix 70/20/8/2 across Growth £79 / Scale £249 / Agency £499 / Plus £1,500). Updated 2026-04-26 post-pricing-restructure (was £10,600 at the £59/£159/£499/£599 ladder).
- Direct costs (infra + LLM + email + Sentry): ~£320/mo
- Overhead (insurance, legal, support tool, content): ~£960/mo
- **Net margin before founder pay: ~77%** (£8,100/mo per 100 merchants)

The cost side is controlled. The bet is on acquisition.

## Tiers

> **Pricing model in transition.** Per ADR 0016 (2026-04-26), the canonical pricing axis is shifting from volume (Free / Growth / Scale / Agency / Plus) to **vertical standard licensed × distribution mode** (Food / Beauty / Apparel × Self-serve / Concierge / Embedded). Existing Growth / Scale / Agency / Plus customers are **grandfathered** at current prices. New sign-ups from Phase 3 onwards see the vertical ladder. The new launch ladder lives in ADR 0016 §Launch ladder, calibrated by the Month 1–2 willingness-to-pay study with 20+ food merchants. The Plus tier is in private beta per ADR 0017 — public price withdrawn, anchor "from £1,200/mo on enquiry."

### Free

- **Price:** £0
- **Scope:** Read-only scorecard. Pillar breakdown. One refresh per 30 days.
- **Limits:** No auto-fixes. No enrichment. No drift alerts.
- **Purpose:** tire-kicker filter; funnel into Growth tier.

### Growth — £79/month

- **Price:** £79/month. 14-day trial (no first-month discount — see ADR 0009).
- **Target:** SMB stores, <500 SKUs, <£1M revenue.
- **Scope:** Unlimited audits. Tier 1 auto-safe fixes — included by default (was gated pre-restructure). Monthly automated re-scan. 500 Tier 2 LLM enrichments per month. Weekly drift alerts. Score history (30 days).
- **Shopify pricing ID:** `STRIPE_PRICE_GROWTH_MONTHLY` (via Shopify Managed Pricing, not direct Stripe).

### Scale — £249/month

- **Price:** £249/month. 14-day trial.
- **Target:** Mid-market, 500–5,000 SKUs, £1M–£10M revenue.
- **Scope additions:** Unlimited Tier 2 enrichments. Competitor benchmarking. Daily drift alerts. Priority support. Bulk sync SLA (1K products within 2h, 10K within 24h). Score history (12 months).
- **Shopify pricing ID:** `STRIPE_PRICE_SCALE_MONTHLY`.

### Agency — £499/month

- **Price:** £499/month.
- **Target:** Shopify agencies managing 5–50 client stores.
- **Scope additions:** 25 client store seats. White-label reports (remove Flintmere branding, add agency logo). API access. Per-client benchmarking. Agency dashboard for cross-client score views.
- **Billing:** direct Stripe invoicing (not Shopify Managed Pricing — agencies own the relationship).
- **Economic significance:** SPEC §8.2 — Agency tier is the economic engine. One sale = 25 stores on the platform. Ratio of revenue to acquisition cost is 8–10× better than direct merchant sales.

### Plus — private beta (anchor: from £1,200/month on enquiry)

- **Price:** *No public floor displayed.* Anchor only: "from £1,200/mo on enquiry." (Per ADR 0017, 2026-04-26: public £1,500+ floor withdrawn. Reason: the public scanner — Flintmere's dominant conversion path — cannot reach Shopify Plus stores behind enterprise bot-management, per `/research`. Listing a tier the conversion path can't fulfil is a credibility gap. Plus re-lists with verified pricing once the embedded Shopify app's first installable food-vertical build ships.)
- **Target:** Shopify Plus (£500K/mo+ platform fee tier), 10,000+ SKUs. Vertical-specialised — food first.
- **Scope additions:** 50,000 SKU support (custom rate limits). Custom attribute templates per vertical. Dedicated Slack support channel. Monthly strategy call. Per-contract SLAs. SOC 2 posture review (when needed).
- **Billing:** direct Stripe invoicing, contract-based, annual pre-pay available at 15% discount.
- **Model:** Direct enquiry. The `/for/plus` page reframes as "Plus is in private beta — talk to the Flintmere team before signing with a £2k/mo discovery platform." Enquiry routes to the team inbox; sales call replaces self-serve checkout. Council pricing review 2026-04-26 confirmed the anchor: visible-but-not-committed. First 2–3 deals teach what belongs above the floor.
- **Existing £1,500-floor reference customers:** none yet. No grandfathering exposure on this tier.

## Payment stack

- **Shopify Managed Pricing** for Growth + Scale (automatic subscription, no Stripe integration needed).
  - Shopify keeps: 0% on first $1M lifetime (2025 policy), 15% after.
- **Stripe direct** for Agency + Plus + the £97 concierge audit (SPEC §2.4).
- No crypto payments. No alternative gateways.

## Promotions

- **14-day trial on Growth and Scale.** Via Shopify Billing `trialDays`. No first-month discount, no price override — see ADR 0009.
- **Agency trial:** 30-day full-feature trial of Agency tier, no card required. Converts via 25-store scorecard preview.
- **Plus annual pre-pay:** 15% off on 12-month pre-pay. Applied at contract signature.
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
2. **Your catalog ranks last** — Shopify Agentic Storefronts (March 2026) lists default catalogs in ChatGPT; the ranking battle is what's left, and most catalogs lose it at the field-completeness stage.
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
