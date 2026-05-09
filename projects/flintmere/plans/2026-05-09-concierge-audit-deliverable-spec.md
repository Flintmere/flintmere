---
canon_sources:
  - apps/scanner/src/app/audit/page.tsx#deliverables
  - apps/scanner/src/app/audit/success/page.tsx
  - apps/scanner/src/lib/concierge-email.ts#deliverableLineForBand
  - apps/scanner/src/lib/audit-pricing.ts#AUDIT_BANDS
  - apps/scanner/src/lib/copy.ts#conciergeDeliverableListForBand
  - projects/flintmere/decisions/0022-audit-band-pricing.md
canon_audit_run: 2026-05-09
binding: CLAUDE.md §Binding 2026-05-09 (canon protection)
---

# Concierge audit deliverable — v1.1 spec (all bands)

> 2026-05-09. Replaces `2026-05-09-revenue-sprint-197-deliverable-spec.md`
> (Band-1-only, under-specced) after the buy-side surface walk caught the
> contradiction between the v1 spec (single markdown body) and the
> three customer-facing surfaces — `/audit`, `/audit/success`, and the
> Stripe-webhook-triggered `concierge-email.ts` Resend body — which have
> all promised the five-item deliverable since 2026-05-04.
>
> Frozen until first 5 audits delivered. Pricing is not changing; the v1
> spec under-stated the deliverable, not the price. ADR 0022 priced the
> band ladder against the five-item deliverable from the start.

## Why this rewrite exists

The 2026-05-09 buy-side walk caught a launch-blocking contradiction. The
prior £197 spec promised a single markdown HTML body. The three
customer-facing surfaces — `/audit` (deliverables list), `/audit/success`
(post-purchase confirmation), and `concierge-email.ts` (Resend body sent
on `payment_intent.succeeded`) — all promise a richer five-item
deliverable. A merchant who reads the live page, pays £197, and receives
the v1-spec deliverable has been short-changed.

Resolution: this spec aligns to the customer-facing canon. The
contradiction was in the spec, not the page.

The 2026-05-09 canon-protection binding fired on `prompt.ts` (catching
the four v2.1 corrections) but missed the v1 spec because the binding was
added the same day the spec was drafted. Guardrails are tightened
alongside this rewrite: hook coverage now fires on
`projects/flintmere/plans/*spec*.md`, the canon-audit skill now runs a
deliverable-parity check, and `canon-source-register.md` §A2 names the
three in-code truth surfaces explicitly.

## What every band ships (the five items)

The band ladder shares the same five-item deliverable shape. Bands
differ on (a) catalog scope, (b) audit depth, (c) worst-N drafted, and
(d) operator hours. Same shape, scaled by band:

1. **A written audit letter** — ~1,500-word letter (HTML body via
   Resend). Points at specific products by name with annotated context.
   Voice: declarative, evidence-first, British, one load-bearing claim
   per paragraph, occasionally aphoristic. Reference voice
   `flintmere.com/methodology`. Sections in order:
   - Executive summary (deterministic-anchor headline, partial-coverage
     caveat for free-scan audits per the v1.1 prompt)
   - Estimated revenue impact (£-band where computable; "not modelled"
     where not — never invented)
   - Top priorities (5 ranked, each with what / which / why / how)
   - Per-pillar findings (7 pillars; install-gated pillars carry the
     placeholder line on free-scan audits)
   - **30-day fix sequence** — Day 1 / Week 1 / Week 2 / Week 3-4
     phasing of the priorities + structural cleanup
   - **GS1 UK barcode path** — for UK merchants the templated GS1 UK
     paragraph; for non-UK merchants `[OPERATOR_VERIFY: jurisdiction]`
   - Retainer + re-scan CTA — natural next step framing, not sales
     bolt-on
2. **A per-product fix CSV** — every affected product, its problems,
   and the recommended fix. For the worst N (10 / 25 / 25 by band),
   we draft the full replacement copy — title, description, metafield
   values — ready to paste into Shopify.
3. **A 30-day fix sequence** — extracted from the audit letter as a
   one-page plan. What to do Day 1 / Week 1 / Week 2 / Week 3-4 —
   ranked by how many products each fix unblocks first.
4. **A GS1 UK barcode path** — the right GS1 office for the merchant's
   jurisdiction (UK default), what to buy, how to import the codes
   into Shopify without breaking the theme. Not affiliated with GS1.
5. **A 30-day re-scan** — included with every band. The scanner re-runs
   on day 30 and emails a progress report so the merchant knows
   whether the fixes moved the score. Operator-owned manual workflow
   for v1 (calendar reminder + scanner re-run + 1-paragraph progress
   email); automated post-five-sales.

These five line up exactly with `apps/scanner/src/app/audit/page.tsx`'s
deliverable list (sourced from `CONCIERGE_DELIVERABLE_LIST` in
`copy.ts`), the `/audit/success` body, and `concierge-email.ts`'s
`deliverableLineForBand`. Single source of truth lives at
`apps/scanner/src/lib/concierge-deliverable.ts` (introduced this PR).

## Per-band specifics

### Band 1 — £197 (≤1,500 SKUs, 3–5h operator time)

- **Audit scope**: full per-product read.
- **Worst-N fully drafted**: 10 products with full replacement title +
  description + metafield values.
- **CSV row count**: every affected product (typically 30–80% of the
  catalog at scores below 70).
- **Operator-time mix**:
  - 30–45 min — generate audit-draft, edit per the calibration checklist
  - 30–45 min — read the catalog product-by-product to verify drafted
    findings; pull the worst-10 specifics
  - 30–60 min — build the per-product CSV (handle, title, problems,
    recommended_fix one-liner, plus drafted replacement copy on the
    worst-10 rows)
  - 10 min — GS1 UK paragraph (UK default; pivot manually for non-UK)
  - 10 min — 30-day plan (derived from top priorities; minor edits)
  - 5 min — Resend send + day-30 calendar reminder
- **Total**: ~3 hours typical, 5 hours if catalog is unusually messy or
  vertical-blind. Aligns with `audit-pricing.ts` `hoursEstimate`.
- **Net £/h at midpoint**: ~£49/h. Loss-leader pricing — the audit is
  the lead magnet for the £349/mo Concierge retainer per the runbook
  Council pre-flight #18 Sales.

### Band 2 — £397 (1,501–5,000 SKUs, 5–7h operator time)

- **Audit scope**: full per-product read. With 5,000 SKUs, the per-
  product read is more cursory than Band 1 — the scanner's
  deterministic output flags the issues; operator reads each flagged
  product to verify, doesn't read clean ones.
- **Worst-N fully drafted**: 25 products with full replacement copy.
- **CSV row count**: every affected product (typically 3× more rows
  than Band 1 at the same score band).
- **Operator-time mix**:
  - 45–60 min — generate audit-draft, edit per checklist
  - 60–90 min — verify the larger flagged-product list, pull worst-25
    specifics
  - 60–120 min — build the larger CSV with worst-25 drafted copy
  - 10 min — GS1 UK paragraph
  - 10 min — 30-day plan
  - 5 min — Resend send + day-30 calendar reminder
- **Total**: ~5 hours typical, 7 hours for unusually messy catalogs.
- **Net £/h at midpoint**: ~£66/h. Operator-hours-justified premium
  over Band 1.
- **What Band 2 buys over Band 1**: 15 more drafted fixes, ~3× larger
  CSV, ~2 more hours of operator attention. Same letter / plan / GS1
  path / re-scan shape.

### Band 3 — from £597 (5,001+ SKUs, 7+h operator time, bespoke)

- **Audit scope**: representative sample across catalog variant patterns
  + the structural data model (entity-relationship review of products /
  variants / metafields / collections / GMC category mapping at the
  taxonomy level). At 5,001+ SKUs no individual-product audit is
  meaningful; the win is at the model layer.
- **Worst-N fully drafted**: 25 products with full replacement copy
  (drawn from the sample plus the most-impactful structural fixes).
- **CSV row count**: every sampled product that has a problem; the
  operator-letter explains the sampling methodology so the merchant can
  apply the patterns across the unsampled remainder.
- **Bespoke quoting**: 5,001 SKUs lands near the £597 floor; 50K+
  scales upward via enquiry inbox (`hello@flintmere.com`). Stripe
  checkout is not exposed for Band 3 per `audit-pricing.ts`
  `isBespoke: true`.
- **Operator-time mix**:
  - 60–90 min — generate audit-draft, edit per checklist
  - 90–120 min — review the catalog's data architecture (variants,
    metafields, collections, GMC category mapping, taxonomy
    consistency)
  - 60–120 min — sampled per-product verification + worst-25 drafts
  - 60 min — write the structural-recommendations section (the
    deliverable shape that differs from Band 1 / Band 2)
  - 15 min — GS1 UK paragraph + 30-day plan + send + day-30 reminder
- **Total**: 7+ hours; scales with complexity for very large catalogs.
- **What Band 3 buys over Band 2**: a structurally different
  deliverable — architecture review at the model layer, not just
  product-level fixes. The £200+ floor premium tracks the deliverable
  shape change, not just more of the same.

## Voice + canon discipline (every band)

Every band's deliverable runs through the
`2026-05-09-day2-calibration-checklist.md` send-check before send.
Non-negotiable items (excerpts; full list in checklist):

- Pillar names match canon exactly (`Identifiers`, `Attributes`,
  `Titles`, `Mapping`, `Consistency`, `Checkout eligibility`,
  `Crawlability`).
- Voice register: declarative, load-bearing-claim-per-paragraph,
  occasionally aphoristic per `flintmere.com/methodology`.
- British English throughout.
- No exclamation marks, no emojis, no banned adjectives (per
  `BANNED_JARGON` in `copy.ts` + the v1.1 prompt's banned list).
- Every product title quoted in the doc verbatim-exists in the catalog.
- Every regulation cited appears in `regulatory-citations.ts` with its
  source URL on first reference.
- Every numerical claim traces to source data; no
  `[OPERATOR_VERIFY:...]` placeholders left in the body.
- Free-scan audits open the executive summary with the partial-
  coverage caveat: "This is a free-scan audit covering four of the
  seven pillars (55% of the composite score)."

## Delivery flow (operator runbook)

1. **Generate the draft** at `/admin/audit-draft` → enter shop URL +
   band + vertical → Generate. Audit-draft schema produces 7 pillar
   findings + 5 top priorities + executive summary + revenue impact.
2. **Edit through the calibration checklist** — five passes
   (hallucination → voice → canon → operator-adds → final read).
3. **Build the per-product CSV** from the deterministic scan results
   + audit-draft fix recommendations:
   - Columns: `handle`, `title`, `vendor`, `problems`,
     `recommended_fix`, `new_title`, `new_description`,
     `new_metafields`
   - Worst-N rows get `new_title` / `new_description` /
     `new_metafields` filled (operator hand-drafts; v2 will draft via
     prompt extension).
   - Save as `<shop>-flintmere-audit-fixes.csv`.
4. **Click "Copy as markdown"** in `/admin/audit-draft`. The export
   includes the executive summary, revenue impact, top priorities,
   per-pillar findings, **30-day plan section** (auto-derived from
   top priorities), and **GS1 UK barcode path section** (templated
   for UK; placeholder for non-UK).
5. **Open Resend dashboard** → New email →
   - To: merchant address
   - Subject: `<shop name> — your Flintmere AI-readiness audit`
   - Reply-to: operator personal address
   - Paste markdown body
   - Attach the per-product CSV
   - Send
6. **Mark sent** in `/admin/audit-draft` (`sentAt` set; status
   advances to `sent`).
7. **Set day-30 calendar reminder** for the re-scan + progress email.
8. On day 30: re-run the scanner on the same shop, write a
   1-paragraph progress note ("score moved from X to Y; pillars A and
   B improved; pillar C needs follow-up"), Resend the progress note
   from the same thread.

## Pricing → deliverable mapping

| Band | Price | SKUs | Audit scope | Worst-N drafted | Operator hours |
|---|---|---|---|---|---|
| Band 1 | £197 | ≤1,500 | Full per-product | 10 | 3–5 |
| Band 2 | £397 | 1,501–5,000 | Full per-product | 25 | 5–7 |
| Band 3 | from £597 | 5,001+ | Sample + structural | 25 | 7+ |

Pricing canonical source: `apps/scanner/src/lib/audit-pricing.ts`.
Deliverable copy canonical source:
`apps/scanner/src/lib/concierge-deliverable.ts` (introduced this PR;
imported by `copy.ts` + `concierge-email.ts`).

VAT: Eazy Access Ltd is not VAT-registered (per
`/audit` page line 384). Band price is the full price.

## What this defers to v2 (post first-5 audits)

1. **`draftedReplacement` schema field** in `audit-draft/schema.ts` —
   the audit-draft prompt produces the new title / description /
   metafield values for the worst-N products in-band. Saves operator
   30–60 min per audit. Defers because adding to schema requires
   prompt v1.2 + a second canon-audit on prompt this same week, and
   the operator can hand-draft the worst-N within the canonical
   3–5h Band 1 budget.
2. **CSV export endpoint** at
   `/api/admin/audit-draft/[id]/csv` — auto-generates the per-product
   CSV by joining scanner_scans per-product issues with the
   audit-draft fix recommendations. Defers because the join needs a
   per-product issue schema lift; for first-5 the operator hand-builds.
3. **One-click send button** in `/admin/audit-draft` — replaces the
   Resend-dashboard manual paste.
4. **Hosted report page** with tokenised URL — replaces the email
   markdown body. Per `feedback_trust_load_bearing_surfaces_type_only.md`
   this stays type-only when it lands.
5. **Day-30 re-scan automation** — cron job + auto-emit progress
   note. Operator-owned manual until the 5-audits gate.
6. **Retainer Stripe subscription wiring** — manual Stripe Invoice in
   v1; subscription product on `/audit` page in v2.

## Council pre-flight (binding)

This rewrite ratified by:

- **#1 Editor** — voice register matches `flintmere.com/methodology`;
  pillar names exact; British throughout.
- **#4 Engineering** — single source of truth at
  `concierge-deliverable.ts`; renames preserve git history; tests
  guard parity.
- **#5 Product** — five-item deliverable matches the conversion-page
  promise; bands differ on scope + worst-N + structural review at B3.
- **#9 Lawyer / #24 Data Protection** — VAT framing preserved;
  operator-verify placeholders for non-UK GS1; no outcome promises.
- **#11 Founder voice** — team voice ("we" / "the team"); no
  founder-personal claims in deliverable copy.
- **#15 GTM / #18 Sales** — Band 1 framed honestly as
  retainer-acquisition vehicle; the 6.4:1 LTV/CAC ratio is the
  thesis.
- **#36 Conversion** — page promise = post-purchase email promise =
  delivered artefact; no expectation-mismatch on receipt.
- **#37 Consumer psychology** — band differentiation legible
  (worst-N + scope + structural review at B3); £197 floor reads as
  "filter for serious buyers, not toy price."
- **#39 Regulatory Affairs** — GS1 UK paragraph defaults to UK
  jurisdiction with explicit pivot for non-UK; non-affiliation note
  preserved.
