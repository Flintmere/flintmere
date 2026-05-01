# 0020 — Per-channel pricing axis: outbound channel surface area as the third axis

- **Status:** Accepted
- **Date:** 2026-05-01
- **Layers on:** ADR 0016 (vertical × distribution mode axes). Does NOT supersede. ADR 0016's two axes hold; 0020 adds the per-channel multiplier dimension.
- **Source:** `projects/flintmere/strategy/2026-04-26-final-report.md` §5 + council ratification block #3 (structural axis ratifies; magnitudes WTP-pending). 30-day Phase 1 plan Day 2 dispatch (`context/plans/2026-04-30-phase-1-finish-out-30-day-plan.md`).
- **Affects:** `apps/scanner/src/lib/pricing.ts`, `apps/scanner/src/app/pricing/page.tsx`, `apps/scanner/src/app/page.tsx` hero h2 + tier strip, `BUSINESS.md` Tiers section, Stripe price-ID set (deferred to magnitudes-land).
- **Magnitudes:** WTP-pending. Every pound figure referenced below is a HYPOTHESIS until the WTP study closes (target: 50+ food-merchant responses; 30 minimum; window May–June 2026). Public copy must NOT name specific magnitudes until the WTP amendment lands. ADR 0016's £99 single-vertical floor remains the council-recommended hypothesis but is not a commitment.

## Context

ADR 0016 retired volume pricing (SKU + store count) and committed two axes: vertical standard licensed × distribution mode. The launch ladder there was a *single-axis-per-tier* expression — Food single-store £99, Food agency £349, Food + Beauty bundle £159 / £499, Concierge retainer £349, Plus enquiry-only.

The v2 strategic report (2026-04-26, ratified the same day) flagged a third axis the v1 report missed: **outbound channel surface area**. The argument:

- A merchant pushing data to Shopify only is operationally cheap for Flintmere to maintain.
- A merchant pushing to Shopify + GMC + Amazon Fresh + TikTok Shop + Perplexity Shopping has 5× the maintenance burden — Flintmere has to keep their data passing five channel specs that drift independently.
- Volume axes (SKU, store) don't capture this. Channel count does.
- Per-channel pricing also makes the upsell pitch self-evident: "you're already pushing to GMC + Amazon — we keep your data ready for both." The merchant's distribution surface area is the value metric.

Per ratification block #3, the structural change ratifies independently of the magnitudes. ADR 0016 already committed a Month 1–2 WTP study to calibrate magnitudes; v2 effectively bypassed that commitment by naming hypothetical figures (£99 base + £50/channel + £40/£70 bundle uplifts). This ADR re-honours the WTP commitment: structural axis lands now; magnitudes wait on data.

## Decision

**Three orthogonal axes for SaaS-tier pricing.**

| Axis | From | Values |
|---|---|---|
| 1. Vertical standard licensed | ADR 0016 | Food / Beauty / Apparel / Food+Beauty bundle / Food+Beauty+Apparel bundle |
| 2. Distribution mode | ADR 0016 | Self-serve (Shopify App Store) / Concierge (£97 audit + retainer) / Embedded enterprise (Plus, ADR 0017 private beta) |
| 3. Outbound channel surface area | **NEW (this ADR)** | Per-channel multiplier on top of the base platform fee |

Triple-bundle (Food + Beauty + Apparel) remains gated per ADR 0016 — not offered until apparel + beauty cadence is publicly committed.

### Channel definition

A "channel" is an outbound surface where Flintmere maintains the merchant's catalog data in a syndication-ready state. Inclusion criteria — all four must hold:

1. The channel publishes a documented data spec, or operates de-facto enforced rules with public examples of rejection.
2. Merchants in the target vertical demonstrably push or syndicate data to that channel today.
3. Flintmere can verify the merchant's data passes that channel's spec within the existing scoring + ingestion pipelines.
4. Adding the channel to Flintmere requires non-trivial spec-coverage maintenance (justifies the multiplier — channels that are free to add do not get a multiplier; they fold into the base platform).

### Launch channel set (food-vertical-relevant)

- Google Merchant Center (GMC) — structured, well-documented, the universal first channel.
- TikTok Shop — fastest-growing, weakest existing data quality, strongest strategic-partnership target per §6 of the strategy report.
- Amazon (Fresh + Marketplace, treated as one channel for launch — split into two channels deferred to first-design-partner cohort).
- Perplexity Shopping — bleeding-edge AI-shopping channel; spec immature but adoption growing.
- Ocado — UK food-specific.
- Deliveroo — UK food-specific.

Six launch channels. Beauty-relevant channels (Sephora marketplace, LookFantastic syndication) and apparel-relevant channels (Zalando, Next Direct) added when those verticals receive a publication cadence per ADR 0018.

### What "per-channel" actually delivers — Option B for launch

The strategy report §5 surfaced two options:

- **Option A — Flintmere syndicates the feed itself** (runs the push). Bigger product surface; competes directly with DataFeedWatch / GoDataFeed / Channable. Substantially larger engineering and operational overhead.
- **Option B — Flintmere keeps merchant data syndication-ready for each channel.** Merchant uses their existing feed manager to push; Flintmere ensures the data passes that channel's spec. Narrower scope; honest with the value metric.

**Launch posture: Option B.** Public copy: *"Flintmere keeps your data ready for [channel]. Your existing feed manager does the push; we make sure it doesn't get rejected."*

Roadmap toward Option A for select channels (GMC + TikTok Shop) by Phase 3 (2027 Q1, post-ingestion-engine-Phase-3). That move would be a separate ADR amendment (or a follow-up ADR) — Option A changes the value-metric framing materially.

### `pricing.ts` shape change

The `Tier` interface evolves. Existing fields (`slug`, `name`, `scope`, `blurb`, `features`, `cta`) survive; new fields take `null` until magnitudes land:

```ts
export interface Tier {
  slug: TierSlug
  name: string
  vertical: 'food' | 'beauty' | 'apparel' | 'bundle' | 'all' | null  // ADR 0016
  basePlatform: number | null                                         // £/mo, null = WTP-pending
  perChannelMultiplier: number | null                                 // £/mo per channel, null = WTP-pending
  verticalBundleAdditions: { secondVertical: number } | null          // bundle uplift, null = WTP-pending
  betaGated: boolean                                                  // ADR 0017
  legacyPrice?: { amount: number; unit: string }                      // grandfathered tiers only
  scope: string
  blurb: string
  features: string[]
  cta: TierCTA
}
```

The `TIERS` array carries two cohorts:

- **Grandfathered (`growth`, `scale`, `agency`, `plus`)** — `legacyPrice` populated from the current ladder (£79 / £249 / £499 / from-£1,200-on-enquiry). New fields (`basePlatform`, `perChannelMultiplier`, `verticalBundleAdditions`) = `null`. These render only on `/billing` for in-flight subscriptions; hidden from new sign-up flows.
- **Forward (`food-single`, `food-agency`, `food-beauty-bundle-single`, `food-beauty-bundle-agency`, `concierge-monthly`)** — `basePlatform = null`, `perChannelMultiplier = null`, `verticalBundleAdditions = null`. Tier metadata, copy, and structural slots ship in Phase 2; pricing fields fill in the Phase-3 amendment post-WTP.

A helper `tierIsRenderable(tier)` returns `false` for any tier with `basePlatform === null && legacyPrice === undefined` — used by `/pricing` and homepage tier strip to filter out unrendered-pending tiers.

### UI behaviour during the magnitudes-pending window

`/pricing`:
- Page header: "Pricing finalising — May–June 2026."
- Forward tiers render as cards with the structural copy (vertical / scope / what's included) and a single CTA: "Join the waitlist + tell us what you'd pay" → routes to the WTP Tally form.
- No magnitudes shown. No calculator. No "starting at" / "from" / "early-bird" hedges.
- Grandfathered ladder accessible via a footer link "Existing customer billing →" (legal disclosure, not promotion).

Homepage `apps/scanner/src/app/page.tsx`:
- Existing tier strip (per ADR 0016 four-tier rebuild) hidden from new sessions until magnitudes land. Replaced with a single CTA card pointing to `/pricing`'s waitlist + WTP form.
- Hero h2 swap (proposed: *"Pay for the channels you sell on. Not for SKUs. Not for stores."*) deferred to Phase 3 dispatch — a copy change of this weight requires Copy Council pass + design-marketing-surface dispatch alongside concrete magnitudes.

### Copy floor (per #1 Editor)

The phrase **"Pricing finalising"** wins over **"Coming soon"** during the magnitudes-pending window. *Soon* hedges; *finalising* names the actual mechanism (a study closing). Combined with the named window (May–June 2026), prospects can self-qualify: *"are they pricing for me, will I learn the answer in 4–8 weeks."*

## Consequences

- `apps/scanner/src/lib/pricing.ts` shape change lands Day 4–5 of the 30-day plan (separate commit). Existing `Tier` consumers (`/pricing`, `/#pricing`, `/billing`, `/admin/billing`) update against the new interface.
- `apps/scanner/src/app/pricing/page.tsx` rebuilt around new structure — Day 5 of plan; calculator UI deferred until magnitudes land.
- `apps/scanner/src/app/page.tsx` hero h2 + tier strip swap deferred to Phase 3 (post-WTP).
- `BUSINESS.md` Tiers section appended with three-axis structural framing; magnitude rows redacted to "WTP-pending."
- Stripe: no new price IDs created until magnitudes land. Existing IDs (`STRIPE_PRICE_GROWTH_MONTHLY`, `STRIPE_PRICE_SCALE_MONTHLY`, `STRIPE_PRICE_AGENCY_MONTHLY`) preserved for grandfathered customers and renewals.
- **Refund / downgrade / vertical-switch / channel-swap rules** — deferred to magnitudes land. A `grill-requirement` pass is required before Phase 3 (operator dispatched), covering: pro-rata mid-cycle channel additions, vertical switch rebates, agency-seat math, churn-window rebates. Result lands as ADR 0020 amendment alongside the magnitudes amendment.
- **Channel onboarding cost** — each new channel adds ~2–4 weeks of spec-coverage engineering (observed pattern from existing GMC + structured-data work). Channel-list changes therefore ADR-gated: adding or removing a channel from the launch set requires an explicit ADR amendment, not a config edit.
- **WTP study path** — ADR 0016 committed the WTP study; this ADR inherits that commitment. WTP runs as scheduled (Tally form via scanner email-capture confirmation flow, Day 7 of plan). Magnitudes amendment is an in-place edit + amendment marker on this ADR, not a new ADR — magnitudes are a fill-in, not a new decision.

## Rollout

| Phase | Date | Deliverable |
|---|---|---|
| 1 (this commit) | 2026-05-02 (Day 2) | ADR 0020 landed; index moved Reserved → Accepted; cross-references updated. |
| 2 | 2026-05-05 to 05-07 (Days 4–6) | `pricing.ts` shape change shipped (interface + TIERS array, `null` magnitudes). `/pricing` page UI rewritten to magnitudes-pending posture. Homepage tier strip hidden for new sessions. |
| 3 | post-WTP, ~2026-06 | WTP study readout. Magnitudes proposal drafted from WTP signal + comp benchmarking (Salsify, Akeneo public list prices, TraceGains-via-Capterra). ADR 0020 in-place amendment with magnitudes filled. `pricing.ts` magnitudes filled. `/pricing` calculator UI ships. Homepage h2 swap. Stripe new price IDs created. |
| 4 | post-magnitudes | `claim-review` pass on every surface that quotes any pricing line: outbound emails, ad creatives, partner co-marketing assets, signed PDFs. |

## Re-open conditions

- WTP study returns ≥60% refusal at the council-recommended £99 floor (per ADR 0016 calibration rule) → drop floor; magnitudes amendment, not full re-open.
- WTP study yields <30 responses by 2026-05-29 → window extends 14 days into June; magnitudes amendment slips. Plan Decision Rule 5.
- A launch-set channel closes its spec or shutters (Perplexity Shopping pivots, TikTok Shop UK regulatory change, etc.) → channel removed; ADR amendment.
- A new channel emerges with material UK food merchant adoption (Klarna AI shopping, Apple Intelligence shopping, Tesco syndication API, etc.) → channel added; ADR amendment.
- Embedded enterprise demand justifies a different axis (per-vertical custom workflows, named-merchant SLAs at fixed published tiers) → ADR 0017 supersedes for the Plus track; 0020 holds for self-serve + concierge.
- Operator decides Option A (Flintmere runs the feed itself) for select channels post-ingestion-engine Phase 3 → ADR amendment to update Option-A scope. Full re-open not required because the value-metric (per-channel) holds either way; what changes is the work-per-channel and therefore the multiplier magnitude.
- Existing grandfathered customers (Growth/Scale) churn at materially elevated rate post-ladder-launch (per ADR 0016 re-open trigger) → consider migration path or reactivation. Inherited from 0016, re-stated here.

## Council sign-off

Standing Council convened on the structural axis change as part of the v2 strategy ratification (2026-04-26 evening, recorded in the report's ratification block). Lenses re-confirmed for this ADR draft (Day 2, 2026-05-01):

- **#15 Staff** — `pricing.ts` shape change well-scoped: one interface, one array, no migration on grandfathered subscriptions. Helper `tierIsRenderable` keeps the magnitudes-pending UX honest. Approves.
- **#4 PM** — Phase 2 / Phase 3 split holds; magnitudes land post-WTP, not pre-. Refund / downgrade / vertical-switch deferral to a `grill-requirement` pass before Phase 3 is the right gate. Approves.
- **#22 Sales** — per-channel pitch writes itself ("you're already pushing to GMC + Amazon + TikTok — we keep your data ready for all three"). Watch on the Option B vs Option A framing — must be honest in copy that Flintmere is *spec coverage*, not *feed running*, at launch. Approves with that copy floor.
- **#11 Investor** — revenue-capture argument holds; per-channel + per-vertical compounds upside without punishing catalog growth. Magnitudes-pending posture reads as discipline, not hesitation, when paired with a named WTP window. Approves.
- **#1 Editor** — "Pricing finalising — May–June 2026" wins over "Coming soon." Approves with that copy floor, mandatory across `/pricing` and any waitlist surface.
- **#34 Founder/CEO** — leverage discipline holds; structural change is cheap (one ADR + one shape change), magnitudes wait on data. Approves.
- **#36 COO** — channel onboarding cost flagged at ~2–4 weeks per channel is operationally honest. Channel-list changes ADR-gated prevents config drift. Approves.
- **#37 Consumer psychologist** — magnitudes-pending UX must not feel like a stall. Named window + WTP form CTA gives prospects an action and a date; that's enough. Approves with watch on bounce rate during the window — if `/pricing` bounce >70%, escalate copy revision.

No vetoes. ADR 0020 ratified subject to magnitudes-pending discipline (no public magnitudes until amendment lands).
