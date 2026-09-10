# ADR 0029 — The retail-gate pivot: from catalog readiness to supplier data onboarding

- **Status:** Accepted (ratified by operator 2026-09-06)
- **Date:** 2026-09-06
- **Number note:** Verified against `origin/main`, not the working tree — per the numbering-collision lesson recorded in ADR 0027 and repeated in ADR 0028, and reinforced by the index gap flagged in `decisions/README.md`. `origin/main` carries 0024–0028; 0029 is the next free number.
- **Source:** Full thesis re-examination, 2026-09-06. Five parallel research branches (Shopify platform, agentic commerce, Google Merchant Center requirements, competitive landscape, UK market sizing), a four-branch repository audit, live host verification, and direct reading of the `hello@flintmere.com` mailbox. Evidence and citations in `projects/flintmere/plans/2026-09-06-retail-gate-pivot-spec.md`.
- **Supersedes:** the dead-inventory wedge as the load-bearing commercial claim (`strategy/2026-04-26-final-report.md` §7, §10.4).
- **Amends:** ADR 0015 (food-first vertical — survives, but the buyer within it changes), ADR 0016 + ADR 0022 (pricing context, not the ladders themselves), ADR 0027 (two factual errors corrected below).
- **Closes:** ADR 0019's six-month citation gate as **Fail**. See §Consequences.
- **Affects:** `apps/scanner/src/app/page.tsx`, `apps/scanner/src/app/scan/**`, `apps/scanner/src/app/llms.txt/route.ts`, `packages/scoring/src/pillars/suppression-estimate.ts`, `README.md`, `projects/flintmere/{BUSINESS,STATUS}.md`, `memory/marketing/*`, `CLAUDE.md` §Product snapshot.
- **Existing customers:** none. Flintmere has never taken a payment from a third party. The three `ConciergeAudit` rows marked `paid` are operator test transactions against `allbirds.com`.

## Context

The thesis ratified on 2026-04-26 rested on eight load-bearing premises. Re-tested on 2026-09-06, five failed outright.

| # | Premise | Verdict | Evidence |
|---|---|---|---|
| 1 | AI agents select on structured-data quality | **Unmeasurable** | ChatGPT is 0.32% of referral traffic (SE Ranking, May 2026, 101,574 sites). No party — Google, Adobe, Shopify, Similarweb, Semrush — has published an absolute share of ecommerce sessions from AI surfaces. Every figure in circulation is a growth multiple off an undisclosed base. |
| 2 | Missing GTIN suppresses listings and costs revenue | **False** | Missing GTIN yields Google's `Limited` status — "showing on Google, but only in some instances." Relaxed from disapproval 2023-12-21. Only an *incorrect* GTIN disapproves. |
| 3 | UK food merchants are the right beachhead | **Mostly false** | Product data appears on no surveyed pain list. FDF business confidence −31%, ninth consecutive negative quarter; a third of manufacturers cutting marketing spend. |
| 4 | The moat is the ingestion workflow, not the taxonomy | **True, unbuilt** | Correct, and strengthened by this research. No PDF, spreadsheet or OCR dependency exists anywhere in the repo. Own estimate: 9–12 months full-time. |
| 5 | A published standard earns citations and inbound authority | **Failed** | Zero citations. ADR 0019's mandatory mid-window check 41 days overdue; ADR 0024's Gate 2 (2026-08-10) passed unlogged. |
| 6 | Merchants will pay £99–£499/month | **False** | Aserta Ltd (Romsey, Hampshire) does UK allergen scanning to Shopify metafields for $15/mo. Product IQ — the same product-data-score pitch — has zero reviews after 20 months. GS1 UK membership is £130–£450 *per year* at this brand size. |
| 7 | Shopify won't absorb this | **Mostly false** | Shopify shipped a free agentic-readiness scanner at `shopify.com/agentic-readiness` on 2026-04-28, two days after ratification. Its Standard Product Taxonomy carries the FSA/EU Big-14 allergen list on 721 of 764 food categories (v2026-05). |
| 8 | One person can build and sell this | **False** | At the operator's stated capacity of under 10 hours per week, a 9–12 month full-time build is four to five years — during which every premise above expires. |

Against those premises: nine real human scans in five months, thirty cold emails with zero replies (confirmed against the mailbox, not merely the application's own tracking), 28 platform transactions in a representative week, and £0 revenue against ~£130/month of hosting.

Three findings survived and strengthened:

1. **Schema without population.** Shopify's taxonomy carries the allergen slots, but Magic fills attributes *at product creation only*. There is no retroactive sweep, so legacy catalogues keep empty regulatory fields permanently.
2. **Nutrition and GTIN have no home.** Absent from Shopify's taxonomy, absent from Shopify Catalog, absent from Google Merchant Center. Google's nutrition fields exist only in Manufacturer Center, "only available in Canada and the United States."
3. **Regulatory liability is the one fear in this stack carrying budget.**

## Decision

### 1. The product is passage through the retailer product-data gate

Flintmere sells the preparation, structuring and submission of product data required by UK grocery retailers and wholesale data pools — not catalog-readiness scoring, and not AI visibility.

The anchor is verified primary source. Ocado's Supplier Manual (May 2026, 56pp) was diffed word-for-word against the September 2024 edition and is **substantively identical**; nothing has been automated. Page 16, verbatim:

> "Ocado will delay the launch of a new product until at least one image and comprehensive back of pack data have been provided and approved."

Subscribing to Nielsen Brandbank is mandatory before a product can go live on ocado.com. The manual mentions GDSN, productDNA and Syndigo **zero times** — the data pool has not absorbed the onboarding job.

### 2. What is actually being sold

Not data entry. The position, stated precisely:

> The expensive part is not the fees — it is that no retailer publishes the schema you are being judged against, and every one of them contractually assigns the accuracy liability to the supplier.

GS1 UK is £130–£450/year at this brand size; Erudus is free under £2M turnover. Being *data-ready* costs almost nothing in fees. Waitrose's WPP, Sainsbury's EVOLVE, Ocado's Pro-Forma and Whole Foods' ingredient screen all sit behind logins. Erudus' terms place "sole responsibility for the legality, reliability, integrity, accuracy and quality of the Customer Data" on the manufacturer, with an indemnity attached and Erudus' own liability capped at £100,000.

**Flintmere sells knowledge of an unpublished schema, plus carriage of a liability the brand is contractually stuck with.**

### 3. Distribution is partner-first

The operator has no warm network in UK food and under 10 hours per week. Approaching brands directly is a sale requiring a case study that does not exist. Approaching intermediaries is a supplier-to-supplier conversation whose risk to the counterparty is one client.

The intermediary population is ~20–50 firms nationally and is enumerable. The brand population is thousands, with no observable signal of who is at the gate. Partner-first is therefore both the higher-conversion and the lower-effort path.

### 4. Pricing is service-grade, and the published band ladder becomes an asset

Across the regulatory-consultancy category — Ashbury, Campden BRI, Leatherhead/Sagentia, RSSL, Food Alert, Nutritics, Erudus, Food Compliance Compass, SJW Technical — pricing is quote-only. The only published figures found were Campden BRI's £1,300 + VAT associate floor and one Eurofins line item at £243.30.

In the Shopify app market a published £197–£597 ladder sat five to twenty times above the ceiling. In this market a published price is a differentiator. ADR 0022's band *structure* survives; its magnitudes are re-opened for the new offer and will be set in a subsequent ADR, not this one.

### 5. What is retired

- The dead-inventory wedge as the commercial claim, and the `suppressionEstimate` model that computes it. All three of its signals — missing GTIN, ambiguous allergen text, missing GMC category — fail as suppression predictors.
- "Invisible to AI shopping" as positioning. Shopify merchants enter Catalog by default; the store *is* the feed. There is nothing for a Shopify merchant to be invisible to.
- The £99–£499/month subscription ladder as the forward offer.
- `llms.txt` as a scored pillar. Google, 2026-06-02: "none of the AI systems use it."
- The Shopify embedded app as a near-term deliverable. It has never compiled (`.dockerignore:41` excludes its own build context), has no billing code, and ships one working fix.

## Consequences

### ADR 0019 is closed as Fail

The six-month gate (2026-10-26) cannot pass: zero citations exist, the mandatory 2026-07-26 mid-window check was never logged, and trade-press pickup is documented in ADR 0019 itself as taking 60–90 days. Rather than let the date arrive undecided, it is recorded now as **Fail**, invoking the ADR's own documented path — "revert to consulting-led with SaaS support; standards positioning retired."

ADR 0019 describes that path as a viable business, not a failure mode. This ADR takes it deliberately.

For the record: `strategy/2026-04-26-final-report.md` §5 claims ADR 0019 was amended in place to a 30-day-retention condition. **That amendment was never executed** — the word "retention" does not appear in ADR 0019. The citation gate was the in-force condition throughout.

### ADR 0027 carries two factual errors

Both would now fail `claim-review`, and are corrected here:

1. *"Catalog standardises the FORMAT of data a merchant already holds; it does not create missing data."* — **False.** Shopify states Catalog "uses specialized AI models to categorize, enrich, and standardize product data" and labels the inferred fields in its own documentation. The correct boundary is that Shopify infers *general-merchandise* attributes (material, style, occasion, condition), not food-regulatory ones.
2. *"[Catalog] does not map to a food regulatory taxonomy (allergens, nutrition, EU 1169/2011, FSA)."* — **Half false.** The Standard Product Taxonomy carries attribute `1451 Allergen information` with the full Big-14 on 94% of food categories. Nutrition is genuinely absent; allergens are not.

ADR 0027's own monitor trigger — "revisit the moment Shopify ships food-specific catalog intelligence" — has fired. Release v2026-05 took food categories from 458 to 764 and food attributes from 78 to 483.

### Standing monitor

**UCP's Food vertical** is announced with specs "coming soon" (ucp.dev). A Google- and Shopify-authored open Food spec defining allergen, nutrition or ingredient fields is the single event that would collapse this position. Watch `github.com/Universal-Commerce-Protocol/ucp/releases`.

### Immediate remediation, independent of the pivot

1. `apps/scanner/src/app/llms.txt/route.ts:75` and `README.md:3` assert in the present tense that Flintmere performs multimodal extraction from supplier PDFs and back-of-pack photographs. That software does not exist. P0 under CLAUDE.md §Binding 2026-05-09.
2. The concierge SLA cron has emailed daily since May about three operator test orders, now 88 working days "late". Disable the job; do not delete the rows without a separate decision.

## Open questions this ADR does not settle

- **Ocado Roots.** Ocado offers micro and small brands bespoke onboarding, a dedicated team and faster payment terms, free, by invitation on winning a listing. Whether Roots covers the data work or only commercial support determines whether the first gate is contested. Establish before pricing. **Closed 2026-09-10 — see Amendment 1.**
- **Brandbank subscription pricing.** Not published anywhere; NielsenIQ has withdrawn supplier-facing commercial pages. This price sets the reference point for the whole gate.
- **Amazon UK's gate.** Never verified — the research branch exhausted its search budget. Treated as unknown, not as absent.

## Amendment 1 — 2026-09-10: Roots is commercial support only; the data work is unclaimed

Closes the first open question above. It asked whether Ocado Roots covers the
data work or only commercial support. That answer decides whether Ocado already
meets this need for free, and it blocked pricing.

A note on wording: the pivot spec uses "contested" for *a competitor already
serves this*, so a contested gate is bad for us. Readouts have used the same word
for *the gate is a real obstacle brands face alone*, which is the opposite. This
amendment avoids the word.

**Finding.** Roots covers the commercial side: bespoke onboarding that tells a
brand what the rules are, a named contact, faster payment terms, free analytics.
It does not do the data work. Four things remain the brand's own problem —
the Brandbank subscription and content upload, Pro-Forma master data on Olive,
compliant allergen and nutrition fields, and images prepared to Ocado's spec.

**Consequence 1 — the work is unclaimed, and pricing is unblocked.** A brand
arrives knowing the requirements and still faces the work alone. Nobody is doing
it for free. The band magnitudes this ADR re-opened and deferred can now be set;
that deferral was waiting on exactly this answer.

**Consequence 2 — Roots changes category.** It was filed as a retailer
accelerator worth noting. It is better read as a referral population with an
aligned incentive: the programme's own success measure is brands going on to do
other things elsewhere, so brands stalling at the data gate is the programme's
problem too. Pivot spec §6 promotes it from the adjacent list to a route in.

**What this does not change.** The binding constraint stands: under 10 hours a
week, no case study, no warm network in UK food. Confirming demand does not
create supply. One brand taken from listing chaos to Ocado live remains the only
unlock — and it *gates* the Roots introduction rather than following it. A
referral source with nothing to refer to is spent, not used.

**Sourcing.** Desk research, 2026-09-10; the readout reached this repo without
citations. The programme mailbox and any named contact must be re-verified
against a citable source before any outreach artifact uses them, and no named
individual is recorded here on an uncited claim. The standing constraint holds:
nothing about the retail-gate service appears on a public surface.
