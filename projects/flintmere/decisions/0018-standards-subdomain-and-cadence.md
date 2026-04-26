# 0018 — Standards publication: standards.flintmere.com + half-yearly food cadence + AI-assisted diff log

- **Status:** Accepted
- **Date:** 2026-04-26
- **Source:** `projects/flintmere/strategy/2026-04-26-final-report.md` §7, ratified per `projects/flintmere/strategy/2026-04-26-final-report-council-review.md` Q2 (operator-confirmed) + Q3 council decision (recalibrated 2026-04-26 under £0-cash constraint).
- **Council seat:** #39 Regulatory Affairs (added to `memory/PROCESS.md` 2026-04-26 with veto on standards publication accuracy) owns ongoing accuracy review.
- **Affects:** new Coolify service, new DNS A-record, new `apps/standards/` (or `standards.flintmere.com` route within `apps/scanner/`, deferred to Phase 2 IA), repo-root `STANDARDS-CHANGELOG.md`, `STATUS.md` Infra state.

## Context

The strategic report identifies the standards publication as the **single most important strategic move** because nothing else creates a citable third-party reference. Without the publication, the 12-month gate (ADR 0019) cannot pass — there is no canonical document for an external party to cite.

The earlier critique correctly refined "open-source the standard" into "publish schemas and definitions, keep scoring logic and remediation proprietary." The maintenance commitment is the moat, not the snapshot.

Two operator constraints surfaced during ratification:

1. **Subdomain over path** (Q2 operator-confirmed). `standards.flintmere.com` reads as institutional; trade press cites domains over paths.
2. **£0-cash budget for regulatory contractor.** The original Q3a (quarterly + ~£20–25k/yr contractor) is infeasible. Council recalibrated to Q3c (half-yearly + AI-assisted public diff log + Tier-1 outreach for unpaid named reviewer).

## Decision

### Subdomain

`standards.flintmere.com` — new Coolify service, new Traefik route, Let's Encrypt cert, daily 03:00 UTC backup to DO Spaces (matches the scanner's 3-2-1 posture per `STATUS.md`).

Architectural choice between standalone `apps/standards/` Next.js app vs. route within `apps/scanner/` deferred to Phase 2 `grill-requirement` + `design-information-architecture`. Default position: standalone app for clean separation of concerns, slower cadence, lower dependency on scanner releases — but Phase 2 may decide otherwise if scanner colocation reduces ops surface.

### Open vs. proprietary split

**Published (open):**
- The *definition* of the Flintmere Food Catalog Standard as a versioned, dated, machine-readable document.
- Field definitions: every Shopify metafield with regulatory mapping (UK FSA Big-14, ISO 3166-1, PDO/PGI registry, certifications taxonomy).
- Examples: structured JSON examples of "good" products by archetype.
- Migration notes: dated diffs when the standard changes (e.g., FSA precautionary allergen rule update).
- Public changelog (W3C-style: dated, signed, stable URLs).

**Proprietary (NOT published):**
- The scoring rubric (how each gap maps to a points deduction).
- The remediation prompts (how Flintmere generates the fix CSV).
- The benchmark dataset (who scored what).
- The fix-quality LLM evaluation harness.

### Surface architecture

- `standards.flintmere.com/` — index of published standards.
- `standards.flintmere.com/food/v1/` — human-readable food standard, dated, versioned, with prominent disclaimer.
- `standards.flintmere.com/food/v1/spec.json` — machine-readable JSON-LD with stable schema URL, immutable v1 contract.
- `standards.flintmere.com/food/diff-log/` — append-only public ledger of regulatory changes. Each entry: date, regulator, regulation reference, change summary, status (`tracked` → `merged into v1.x`).
- Repo-root `STANDARDS-CHANGELOG.md` — git-tracked mirror of the diff log, signed via commit history.

### Cadence — Q3c

**Half-yearly food-only formal publication.** Calendar dates set in Phase 4 IA; default proposal is April + October aligned to FSA's typical alert quarters.

**Continuous AI-assisted monitoring** between publications:
- Nightly Vertex AI cron (`apps/standards/src/jobs/regulatory-monitor.ts` or equivalent) on FSA / FSS / EU Official Journal RSS feeds.
- Gemini 2.5 Pro reads alerts → outputs structured JSON: `{ source, regulation_ref, change_summary, citation_url, relevance_score }`.
- Reviewed weekly under #39 Regulatory Affairs discipline (~30 min). All citations must resolve to real `gov.uk` / `food.gov.uk` / `eur-lex.europa.eu` URL — 404 check enforced; #39 verifies that the linked text matches the LLM-extracted claim before merge into the standard.
- Tracked items appear immediately on the public diff log with status `tracked`.
- Items merged into the standard at half-yearly publication promote to `merged into v1.x`.

### Disclaimer (load-bearing)

Every standard page carries: *"Informational guide aligned with regulator guidance as of [date]. Not legal or compliance advice. Verify against [primary source link] for your specific situation."*

This is non-optional. Every regulatory citation links to the primary regulator URL. The disclaimer + citation discipline is what allows publication without a paid regulatory professional in the QC seat.

### Outreach (Tier 1)

Phase 3 launches a cold outreach campaign to ~30–50 UK food regulatory consultants offering **pre-publication review credit + backlink + reviewer attribution**. Aim: 1–2 named volunteer reviewers by Month 3.

If a volunteer reviewer lands → Q3c upgrades to **Q3d (quarterly cadence + named reviewer attribution)** via supersede ADR.

### Cost commitment

- Cash: **~£200/yr** (Vertex AI nightly cron only; absorbed into existing LLM budget).
- Council operating time: ~12 days/yr standard authoring (#39 + operator) + ~3 days/yr Tier-1 outreach refresh (#12 ecosystem strategist + operator coordination).
- Tier 6 annual paid spot-review (£500–1,400/yr): **deferred** until first paid food customer revenue clears it.
- Trade-body partnership (Tier 2: FDF, FSB, SFIB, Allergen Bureau UK) and university capstone (Tier 3: Reading, Surrey, Queen's Belfast food law / food science): pursued opportunistically. Academic citation = direct gate proof condition.

## Consequences

- New Coolify service `standards-flintmere-com` (Phase 4 deploy).
- DNS A-record `standards.flintmere.com → 134.122.102.159` (Namecheap, Phase 4 prep).
- New repo path `apps/standards/` OR new routes under `apps/scanner/src/app/(standards)/` — Phase 2 IA decision.
- `STANDARDS-CHANGELOG.md` at repo root.
- `STATUS.md` Infra state row added: `Coolify standards.flintmere.com: ⏸ pending Phase 4 deploy.` + `Regulatory affairs (food): Q3c — half-yearly publication + diff log + AI-assisted monitoring. Tier-1 outreach for Q3d upgrade scheduled Phase 3.`
- `BUSINESS.md` positioning section + `CLAUDE.md` product snapshot reference the standards subdomain.
- `decisions/README.md` index updated.
- `vendor-register.md` adds Vertex AI new use case (regulatory monitoring); no new sub-processor since Vertex is already listed.

## Rollout

- **Phase 1 (this commit):** ADR landed; `STATUS.md` row added.
- **Phase 2:** `grill-requirement` on standards surface (separate app vs. scanner colocation, versioning convention, deep-link contract from `/for/food-and-drink`); `design-information-architecture` on subdomain shape.
- **Phase 3 (Month 1):** Coolify service provisioned, DNS A-record added, scaffold deployed (placeholder until v1 ready).
- **Phase 4 (Month 2):** v1 publication. Diff log live. AI cron operational. `STANDARDS-CHANGELOG.md` initial commit.
- **Phase 5 (Month 3):** Tier 1 outreach campaign launches via `outreach` skill. Trade-press pitch via `outreach` references the live standard.

## Re-open conditions

- Volunteer reviewer lands → Q3c upgrades to Q3d (quarterly + named reviewer) via supersede ADR.
- First paid food customer revenue clears Tier 6 budget → annual paid spot-review added; ADR amendment, not supersede.
- Trade-body partnership lands → trade-body co-credit ADR.
- University capstone agreed → academic review co-credit ADR.
- Citation arrives unprompted before window closes (ADR 0019) → does not affect cadence; gate evaluation handled separately.
- Shopify ships its own catalog mapping covering food before v1 publishes → defensive pivot to deeper layer (regulatory-citation density + diff-log frequency) to differentiate.
- LLM-cited regulation 404-checks fail >5% of the time → manual monitoring fallback; founder time investment increases.
