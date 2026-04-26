# 0016 — Pricing axis: vertical standard × distribution mode

- **Status:** Accepted
- **Date:** 2026-04-26
- **Source:** `projects/flintmere/strategy/2026-04-26-final-report.md` §4, ratified per `projects/flintmere/strategy/2026-04-26-final-report-council-review.md` Q1 council decision.
- **Affects:** `apps/scanner/src/lib/pricing.ts`, `apps/scanner/src/app/pricing/page.tsx`, `apps/scanner/src/app/page.tsx` hero h2, `BUSINESS.md` Tiers section.
- **Existing customers:** grandfathered — current Growth £79 / Scale £249 / Agency £499 stay in force for in-flight subscriptions until they cancel.

## Context

The previous tier ladder (Free / Growth £79 / Scale £249 / Agency £499 / Plus £1,500) priced on volume — SKU count and store count. Volume is the wrong axis when the product's actual value is regulatory complexity per merchant. A 200-SKU artisan food brand pushing to four marketplaces with ten allergen profiles is a higher-value customer than a 4,000-SKU apparel brand pushing to one channel — but the previous ladder charged the apparel brand more.

The homepage h2 *"Five tiers. One question: how many stores?"* compounded the error. To a sophisticated buyer it signalled that Flintmere did not understand its own product, contradicting the vertical pages two clicks deep.

## Decision

**Two orthogonal axes.**

**Axis 1 — Vertical standard licensed:** Food / Beauty / Apparel / bundles. Each vertical priced separately because each requires separate regulatory maintenance under ADR 0018.

**Axis 2 — Distribution mode:** Self-serve (Shopify App Store) / Concierge (£97 audit + retainer) / Embedded enterprise (private beta per ADR 0017).

### Launch ladder (council-recommended, Month 1–2 WTP study calibrates)

```
Free                                                 £0/mo
Food single store                                    £99/mo
Food agency (5 stores @ £70/store)                   £349/mo
Food + Beauty bundle (single)                        £159/mo
Food + Beauty bundle (agency)                        £499/mo
Concierge food audit + 30-day re-scan                £97 one-off (existing — holds)
Concierge monthly retainer (1 vertical)              £349/mo
Embedded enterprise                                  from £1,200/mo on enquiry (per ADR 0017)
```

**Anchors checked:** Yotpo Reviews £15–150/mo (entry SaaS), Klevu £250–1,000/mo (specialist search), Plytix PIM £300/mo, TraceGains/FoodLogiQ £15k+/yr enterprise (above our band), current Growth £79.

**Council positioned the £99 food-single entry deliberately:** £49 reads as "Shopify app," £99 reads as "tool," £149+ reads as "platform." A vertical regulatory specialist needs the *tool* frame at minimum, with headroom toward platform once Phase 3 surfaces ship and signal depth.

### Vertical bundles

Bundle pricing reflects roughly 60% premium over single-vertical (typical SaaS bundle math) — not 2× because the regulatory maintenance overlap (certifications, country codes, identifier rules) is real, but not zero. Triple-bundle (food + beauty + apparel) is **not** offered at launch — concentration per ADR 0015 means we don't sell what we haven't committed to maintain.

### What changes about Growth / Scale

The previous Growth / Scale tiers do **not** map cleanly to a vertical. Decision: existing customers grandfathered at current prices. New customers from Phase 3 onwards choose a vertical. The "generic catalog scanner with no vertical specialisation" tier is **discontinued for new sign-ups** — that posture contradicts the spearhead strategy.

The Free tier survives unchanged as the tire-kicker funnel.

### Homepage h2

The line *"Five tiers. One question: how many stores?"* is replaced. Council's working line: *"Pick the standard your catalog needs. We maintain it."* Final wording is for Copy Council pass in Phase 2 (the "we maintain it" claim ties directly to ADR 0018 cadence — must not over-promise).

## Consequences

- `apps/scanner/src/lib/pricing.ts`: `Tier` interface gains `vertical: 'food' | 'beauty' | 'apparel' | 'bundle' | 'all' | null` and `betaGated: boolean`. `TIERS` array restructured. Existing tier IDs preserved for grandfathered subscribers (`growth`, `scale`, `agency`, `plus`).
- `apps/scanner/src/app/pricing/page.tsx`: vertical selector at top; default selection = Food; tier cards filter on selection.
- `apps/scanner/src/app/page.tsx`: hero h2 replaced (Phase 3, post Copy Council).
- `BUSINESS.md` Tiers section: rewritten to reflect new ladder. Existing tiers marked as "legacy — grandfathered; not offered to new sign-ups."
- Stripe price IDs: existing `STRIPE_PRICE_GROWTH_MONTHLY` etc. preserved for grandfathered customers. New IDs created for the new ladder (`STRIPE_PRICE_FOOD_SINGLE_MONTHLY` etc.) at Phase 3.
- `experiment-design` skill: Month 1–2 WTP study with 20+ food merchants. Calibration rule: drop launch numbers only if ≥60% refusal at £99 food-single. Otherwise hold.

## Rollout

- **Phase 1 (this commit):** ADR landed; `BUSINESS.md` Tiers updated to reflect "legacy + new ladder pending pricing.ts rebuild"; new ladder visible to operator + council, not yet to merchants.
- **Phase 2:** `grill-requirement` on pricing axis change (edge cases, vertical-bundle math, agency-seat math, downgrade paths, refund on vertical switch). `experiment-design` skill drafts the WTP study protocol.
- **Phase 3 (Month 1):** `pricing.ts` shape change + `/pricing` page rebuild + homepage h2 swap. New Stripe prices created. WTP study runs in parallel.
- **Phase 4 onwards:** WTP study readout informs whether launch numbers hold or drop.

## Re-open conditions

- WTP study returns >60% refusal at £99 food-single → drop floor (ADR amendment, not full re-open).
- Vertical-bundle uptake materially exceeds single-vertical at parity rates → introduce three-vertical bundle once apparel + beauty cadence is committed.
- Embedded enterprise demand justifies fixed published tiers above the £1,200 floor → ADR 0017 supersedes.
- Existing Growth/Scale customers churn at materially elevated rate post-ladder-launch (signalling the "you're not a vertical specialist for me" effect even on grandfathered tiers) → consider migration path or reactivation.
