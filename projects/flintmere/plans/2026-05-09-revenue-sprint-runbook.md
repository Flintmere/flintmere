# Revenue sprint runbook — 2026-05-09 → 2026-05-23

> Two-week test. Goal: bank first £197 audit + ideally land 1-2 £349/mo
> Concierge retainers. Defers everything else.

## The sequence

### Day 1 (today, 2026-05-09)

- [x] Magic-link PR open: https://github.com/Flintmere/flintmere/pull/1
- [ ] **Operator: review + merge PR** (additive migration, 463/463 tests green)
- [ ] **Operator: confirm Coolify auto-deploy lands** (watch dashboard)
- [ ] **Operator: visit `https://audit.flintmere.com/admin/login`, submit
      `info@eazyaccess.org`, click magic link in inbox within 10 min,
      confirm landing on `/admin/audit-draft`** — only path the test suite
      can't prove
- [x] Concierge audit deliverable spec frozen (all bands) → `2026-05-09-concierge-audit-deliverable-spec.md` (replaces v1 `2026-05-09-revenue-sprint-197-deliverable-spec.md` which was Band-1-only and under-specced)
- [x] UK food candidate seed CSV written → `data/benchmark/candidates-uk-food-2026-05-09.csv` (69 brands)
- [x] Cold-email template + follow-up drafted → `data/recruitment/cold-email-template-2026-05-09.md`
- [x] Outreach cohort CSV (US + UK food, Band-1 fit) → `data/recruitment/cohort-food-outreach-2026-05-09.csv` (117 merchants)

### Day 2 (2026-05-10)

- [ ] **Operator: dry-run the £197 deliverable on `matersandco.com`**.
      Generate audit-draft. Edit. Copy markdown. Send to operator's own
      inbox via Resend. Read it as a stranger would. Iterate the prompt
      or the edit pass until the output reads as worth £197. Time the
      end-to-end: target ≤45 min after one calibration run.
- [ ] **Operator: validate UK seed CSV** —
      `cd apps/scanner && pnpm tsx scripts/compile-store-list.ts \
       --input ../../data/benchmark/candidates-uk-food-2026-05-09.csv \
       --output ../../data/benchmark/stores-uk-food-2026-05-09.csv`
- [ ] **Operator: batch-scan the validated UK list** —
      `pnpm tsx scripts/batch-scan.ts \
       --input ../../data/benchmark/stores-uk-food-2026-05-09.csv \
       --output ../../data/benchmark/scans-uk-food-2026-05-09.jsonl`
      (ETA ~2-3 hours; PACE_MS throttle keeps the kindness contract.)

### Day 3-4 (2026-05-11–12)

- [ ] **Operator: enrich UK cohort with first-name + email per merchant.**
      No code can do this — needs LinkedIn / About-page hand-research per
      merchant. Target 30-50 merchants enriched. Block ~3 hours.
- [ ] **Operator: send first 30 cold emails.** From operator personal
      inbox (not `hello@`). One personalised line per email — first email
      that sounds like a templater gets blocked. Cap 30/day.

### Day 5-9 (2026-05-13–17)

- [ ] **Operator: continue outreach.** Spread remaining 70-90 emails across
      4 days (max 30/day per inbox).
- [ ] **Operator: monitor inbox + Plausible.** A `scan_started` event with
      a domain matching a recipient = warm lead, even without reply.
- [ ] **Operator: respond to replies same-day where possible.** Cold-email
      reply momentum decays in hours, not days.
- [ ] **Operator: when reply asks for the audit, run audit-assist within
      24 hours.** Generate → edit → send via the v1 deliverable flow.

### Day 10-14 (2026-05-18–23)

- [ ] **Operator: send +5-day follow-up to non-repliers.** Single follow-up
      max. Uses the second template in `cold-email-template-2026-05-09.md`.
- [ ] **Operator: deliver any audits sold.** Target turnaround ≤5 days.
- [ ] **Operator: pitch retainer (£349/mo) to every audit recipient on
      delivery.** The audit is the lead magnet; the retainer is the revenue.

## Decision points (operator owns)

- **Reply-to inbox.** Operator personal address vs `hello@flintmere.com`.
  Recommendation: personal (cold-email reply rate to shared inboxes is
  ~1/3 of personal). Spec assumes personal.
- **PDF vs HTML body for delivery.** v1 spec says HTML body. If a merchant
  asks for PDF, operator can copy the markdown into Notion / Pages /
  Word and export. Don't build a PDF pipeline yet.
- **Retainer billing.** No Stripe subscription wired yet. v1 retainer
  invoicing: manual Stripe Invoice from the dashboard (operator creates,
  £349 monthly recurring). v2: subscription product on `/audit` page.

## Success thresholds (review at end of day 14, 2026-05-23)

- **Floor (failure)**: 0 sales across 80+ emails sent. Re-evaluate the
  GTM thesis — is cold-email-to-food-merchants the wrong wedge? Pivot to
  inbound (SEO + content) or warmer channels (Shopify Partner network).
- **Acceptable**: 2-3 audits sold (£394-591 banked). Continue outreach
  at the same cadence; calibrate prompt + pitch from real-merchant feedback.
- **Strong**: 5+ audits sold OR 1+ retainer signed. The thesis works.
  Scale outreach (hire VA for personalisation), build v2 deliverable
  (one-click send, PDF, hosted report).
- **Breakthrough**: 2+ retainers signed (£698+/mo recurring). Stop
  sprinting on outreach, redirect to retainer-fulfilment workflow + the
  embedded Shopify app build (Gate-1 retention clock starts here).

## What this defers

Per the strategic conversation 2026-05-09:

- Embedded Shopify app deploy
- Bulk catalog sync against real merchant
- Tier 2 LLM enrichment in production
- Fix History UI + revert endpoint
- Share-for-trial loop
- App Store submission
- Standards subdomain (Phase 4)
- The full ingestion engine (9-12 month build)
- Marketing site polish
- /pricing tier-strip rebuild

All of these resume after the 14-day signal lands. If the test fails the
next strategic conversation is whether the GTM is wrong, not whether to
keep building.

## Council pre-flight (binding)

This runbook ratified by the standing council seats most relevant to the
constraint:

- **#15 GTM/Strategy** — the 117-cohort + UK-seed-scan parallel run is
  the right move; UK-only would have been too narrow given the data.
- **#18 Sales** — retainer-first / audit-as-trial structure is correct;
  £197 is too small to be the revenue thesis at this volume.
- **#5 Product** — defining the deliverable as "rendered markdown body
  via Resend" with no new code unblocks today; the v2 build is post-signal.
- **#36 Conversion** — data-intake hook ("we already scored you") is the
  load-bearing line; without it cold email at this volume converts at
  noise levels.
- **#11 Founder voice** — British, calm, no exclamation marks; the
  legal footer is non-negotiable but not apologetic.
- **#37 Consumer psychology** — single-decision-maker UK indie food
  brands (the 6 UK-signal merchants + the 69-strong UK seed) are the
  right buyer profile; corporate-brand sites with tiny catalogs are
  filtered out by the Band-1 SKU range.
- **#38 Data intake** — the scan re-run path on the cold email is the
  conversion mechanic; static cold pitches without it are noise.
- **#4 Engineering/Operations** — zero new code needed for week-1
  delivery; the audit-assist console + Resend dashboard + manual send
  is the right minimum-viable revenue path.
