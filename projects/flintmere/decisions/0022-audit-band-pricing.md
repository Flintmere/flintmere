# 0022 — Audit-band pricing for the Concierge audit

- **Status:** Accepted
- **Date:** 2026-05-01
- **Layers on:** ADR 0016 (specifies pricing for the *Concierge* distribution mode within the vertical × distribution axes). Does NOT supersede.
- **Independent of:** ADR 0020. ADR 0020 governs recurring SaaS-tier magnitudes (WTP-gated until June 2026). ADR 0022 governs one-off Concierge-product pricing (operator-discretion ratification, not WTP-gated). Both ADRs hold concurrently.
- **Source:** Pricing Council convene 2026-05-01 (this ADR's §Council sign-off captures it). Operator instinct on anchor inertia ratified the structural move; council calibrated bands and predeclared the validation-week trigger.
- **Affects:** `apps/scanner/src/lib/audit-pricing.ts` (NEW), `apps/scanner/src/app/api/concierge/checkout/route.ts`, `apps/scanner/src/app/api/webhooks/stripe/route.ts`, `apps/scanner/src/app/audit/{page.tsx,CheckoutCard.tsx}`, `apps/scanner/src/app/audit/success/page.tsx`, `apps/scanner/src/lib/{concierge-email.ts,report-email.ts,copy.ts}`, `apps/scanner/src/app/pricing/page.tsx`, `apps/scanner/src/app/for/{food-and-drink,beauty,apparel,plus}/page.tsx`, `apps/scanner/src/app/research/components/CTA.tsx`, `apps/scanner/src/components/{EmailGate,sections/FounderStrip}.tsx`, `apps/scanner/src/app/terms/page.tsx`, `apps/scanner/prisma/schema.prisma` (`scanner_concierge_audits`), `BUSINESS.md`, `STATUS.md`, `CLAUDE.md`.
- **Existing customers:** zero in-flight Concierge audits per STATUS.md as of 2026-05-01. No grandfathering exposure. Atomic price lift is safe.

## Context

The £97 audit price was set when the Concierge audit was a low-friction conversion mechanic into the £79–£499/mo recurring SaaS ladder (the volume axis retired by ADR 0016). Three things have changed:

1. **The recurring ladder has no destination for new sign-ups today.** Per ADR 0020, SaaS-tier magnitudes are WTP-pending until June 2026, and per the v2 strategic report the embedded ingestion engine is 9–12 months out. The audit is the only commercial product for the next 12 months — not a lead-magnet.
2. **A flat £97 price across non-flat workload is structurally regressive.** A 200-SKU read takes 90 minutes; a 4,000-SKU read takes 8+ hours. The small merchant pays roughly 5× more per hour of value than the large merchant — exactly inverting the pricing-by-complexity logic that ADR 0016 ratified for the SaaS axis.
3. **Anchor inertia dominates.** The audit price sets the floor for every commercial surface for the next 12 months — Concierge retainer (`concierge-monthly` per ADR 0020), and the prospective post-WTP self-serve subscription floor. Lifting £97 in Q3 reads as either a confused brand pivot or a 3.5× price grab. Better to anchor at the right number now.

Behavioural-economics texture (per council seat #37): pricing categories are categorical, not linear. £97 reads as *Shopify app extra*; £197 as *professional tool*; £397 as *specialist consulting*; £597+ as *bespoke advisory*. Each jump is a categorical reframe, not a 2× friction.

## Decision

**Three-band SKU-based ladder for the Concierge audit. The £97 floor retires.**

| Band | Catalog size | Price | Operator hours | Deliverable |
|---|---|---|---|---|
| 1 | Up to 1,500 SKUs | **£197** | 3–5 | Full per-product audit (every SKU). 1,500-word letter. Per-product fix CSV with **worst 10** fully drafted. 30-day plan. GS1 path. 30-day re-scan. |
| 2 | 1,501–5,000 SKUs | **£397** | 5–7 | Full per-product audit (every SKU). 1,500-word letter. Per-product fix CSV with **worst 25** fully drafted. 30-day plan. GS1 path. 30-day re-scan. |
| 3 | 5,001+ SKUs | **From £597 — bespoke quote** | 7+ | Representative-sample audit (~100 SKUs across catalog variant patterns) plus structural data-model read. 1,500-word letter. Per-sample fix CSV with worst 25 fully drafted. 30-day plan. GS1 path. 30-day re-scan. |

The deliverable depth scales with price. A customer who pays £397 receives the depth specified for £397 — the worst-25 fully-drafted offers, not the £197-band worst-10. The band-deliverable contract is binding.

**Cohort fit:** Band 1 = artisan + small food brands. Band 2 = the BUSINESS.md target (£500K–£20M revenue UK food merchants). Band 3 = large food brands and Plus prospects.

**Refund treatment:**

- Bands 1 + 2: 30-day no-questions refund per BUSINESS.md (unchanged).
- Band 3: contracts itemise. Default position — 30-day no-questions refund if no work has started; pro-rated refund based on hours invested if work is in flight; no refund after the deliverable lands. Specific refund clause subject to Legal Council pass during Phase 5.

**Customer self-attestation, not platform verification.** The merchant declares their SKU band at checkout. Flintmere does not gate by API-verifying SKU count before payment — that's friction the funnel cannot afford. If a customer attests Band 1 and the public scan reveals >1,500 SKUs, the team contacts them within one working day of payment to either (a) upgrade to Band 2 with the £200 difference invoiced, (b) refund and re-scope, (c) honour Band 1 at Flintmere's discretion (one-off). The cohort-drift trigger below catches systematic mis-attestation if it emerges.

## Consequences

- **`apps/scanner/src/lib/audit-pricing.ts` (NEW) is the canonical price source.** All surfaces import band data + price strings from it; no hardcoded `£97` / `£197` / `£397` / `£597` figures elsewhere. Eliminates the 20-surface-drift risk that ADR 0022 inherits from the existing flat-£97 codebase.
- **DB schema gains `band` column** on `scanner_concierge_audits` (Prisma enum: `band_1 | band_2 | band_3 | bespoke`). Migration `add_band_to_scanner_concierge_audits` lands in Phase 1 via `write-migration` skill (operator-confirms generation per Autonomy Level 1).
- **API + webhook + email pipeline becomes band-aware in one atomic commit** (Phase 1). No mid-flight inconsistency window.
- **`/audit` page redesign in Phase 2 + 3.** The Saks-scale `[£97]` chord that anchored the page's brand-mark moment retires; new band-selector signature replaces it. Design before code.
- **Cascade across 12+ secondary surfaces in Phase 4** as one coordinated commit. `claim-review` agent pass before commit.
- **Plausible event `concierge_clicked` carries `band` prop** from Phase 1 onwards. Pre-band events have no band attribution; documented in this ADR as the analytics-backfill seam.
- **VAT-framing copy** on `/terms` and `/audit` Chapter 5 updates to reference the band ladder neutrally — *"Eazy Access Ltd is not VAT-registered, so the band price you select is the full price — no VAT is added."*
- **OG image** (`apps/scanner/src/app/audit/opengraph-image`) regenerated to remove `£97` reference.
- **No new Stripe Price IDs created.** Concierge audit is a PaymentIntent (one-off), not a Stripe Price (recurring). The `amount` on the PaymentIntent is computed server-side from the customer's stated band; the existing `STRIPE_CONCIERGE_PRICE_ID` env var is now misnamed and should be retired or repurposed in Phase 1.
- **Second-order anchor effect:** the £197 floor leaves clean gap to a future £349/mo Concierge retainer (per ADR 0016 §Launch ladder, currently `null` magnitude per ADR 0020). When the retainer ratifies its own magnitude, this gap holds.

## Rollout

| Phase | Date | Deliverable | Atomic-commit boundary |
|---|---|---|---|
| **0** | 2026-05-01 (this commit) | ADR 0022 landed; index updated. | One commit. |
| **1 — Stripe ground truth** | 2026-05-02 | `lib/audit-pricing.ts` constants; Prisma migration `add_band_to_scanner_concierge_audits`; band-aware checkout API + Stripe webhook + email templates + tests. | One commit (deploy applies migration before app code starts). |
| **2 — `/audit` design** | 2026-05-03 to 05-04 | `design-marketing-surface` dispatch with council pre-flight. Spec at `context/design/specs/2026-05-01-audit-bands.md`. | No code commit. Spec only. |
| **3 — `/audit` web-implementation** | 2026-05-05 | New `/audit` page + CheckoutCard + success page; Plausible band prop wired. | One commit. |
| **4 — Cascade** | 2026-05-06 to 05-07 (alongside Day 5 `/pricing` rebuild on different file set) | 12+ secondary surfaces updated; `BUSINESS.md` + `STATUS.md` + `CLAUDE.md` updated; `claim-review` pass. | One coordinated commit. |
| **5 — Council gates** | parallel with 2–4 | Legal Council (#9 + #23 + #24) on per-band refund + VAT framing + bespoke-band T&Cs. Copy Council on `/audit` copy. #38 Data intake engineer on Stripe-band → DB-band → email-band metadata flow. | Run as drafts land; gate vetos pre-ship. |
| **6 — Validation-week launch** | operator-gated on Coolify deploy + accounts | First cold outreach at £197 floor. Plausible tracks band-by-band conversion. Predeclared 5% trigger live. | Marketing only. |

## Re-open conditions

- **Validation-week conversion <5% across 30+ qualified prospects in the first 14 days.** Predeclared trigger. ADR amendment to drop Band 1 floor (e.g. to £147 or £167) if fired. Logged to `experiment-log.md` upfront so the threshold isn't moved post-hoc.
- **Cohort drift** — if validation week shows >70% of audits land in Band 1 (artisan side-hustles), self-selection isn't aligning with the £500K–£20M target. Investigate cold-outreach quality and marketing-channel posture *before* changing prices.
- **Operator throughput exceeded** — sustained >6 audits/week (~£82–95K/yr revenue at projected band mix) signals contracted-reader hire need. If hiring isn't viable, ADR amendment lifts Bands 1 + 2 to throttle intake by self-selection.
- **Customer-side pushback on Band 3** — if 3+ Band-3 prospects decline at the bespoke-quote framing, structural reason. Re-open and consider published Band 3 floor (£597 or £797 or £997).
- **Embedded ingestion engine ships earlier than 9 months.** Audit-price logic shifts from *only commercial product* to *lead-magnet for self-serve subscription*; potentially reverts Band 1 toward £97.
- **Anchor effect on Concierge retainer (`concierge-monthly`).** When the retainer ratifies its magnitude (separate ADR), the £197 audit floor must remain credibly below it. If retainer comes in below £349, this ADR re-opens.

## Council sign-off

Pricing Council convened 2026-05-01 (this session). Seats: #5 Industrial designer · #11 Investor · #22 Sales · #34 Founder/CEO (added for strategic-leverage lens) · #35 Customer voice · #36 COO (added for throughput-economics lens) · #37 Consumer psychologist. Two seats added beyond canonical Pricing Council per `feedback_process_add_missing_council_seats.md` — operator throughput and 12-month strategic-leverage are load-bearing for this decision.

- **#37 Consumer psychologist.** Pricing categories are categorical, not linear. £197 is the cleanest floor for what the deliverable actually is. Approves Option D.
- **#11 Investor.** Anchor inertia dominates. Validation-week conversion at £197 is more meaningful signal than at £97. Approves Option D; watch on conversion at 14-day mark.
- **#22 Sales.** £197 self-selects toward the £500K–£20M target cohort; the £97 floor was funnelling wrong-fit prospects (artisan side-hustles, hobbyist shops) at zero flywheel value. Approves Option D.
- **#35 Customer voice.** Higher prices generate higher engagement with the deliverable on receipt — payment-justification effect. Approves Option D **contingent** on deliverable-depth discipline (Band 1 worst-10, Band 2 worst-25, Band 3 representative-sample worst-25). Binding.
- **#5 Industrial designer.** Three-band structure with categorical gaps reads as confidence; four-band reads as fiddly. £97 entry floor reads as embarrassed; £197 floor reads as deliberate. Approves Option D — drop £97 entirely.
- **#34 Founder/CEO.** Audit is the product for the next 12 months. Price as a product. Approves Option D.
- **#36 COO.** Throughput economics make flat £97 unsustainable past three months. Option D weighted average ≈ £317/audit funds part-time engineer or contracted reader by month 6. Approves Option D.

**Vote: 7-0 ratify Option D. £97 floor retires.**

No vetoes. **Operator confirmed ratification 2026-05-01.**

## Notes for future amendment

When the Concierge retainer (`concierge-monthly`) ratifies its magnitude, audit-cohort retention should be analysed: of the customers who purchased a £197 / £397 / £597+ audit, what fraction converted to retainer within 30 days? If the conversion rate is below 20% on Band 2 + Band 3 (the BUSINESS.md target cohort), the audit→retainer copy on the Day-30 progress-report email is doing too little of the upsell work — re-open `concierge-email.ts` design, not this ADR.
