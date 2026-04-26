# Council review — 2026-04-26 final strategic report

**Convened:** 2026-04-26
**Subject:** Adoption ratification of `2026-04-26-final-report.md`
**Decision required:** Operator ratify / amend / reject before any execution begins.
**Location override:** Report's suggested path was `memory/strategy/`. Per `CLAUDE.md` triage (memory/ = how I work; projects/flintmere/ = what we're building), filed under `projects/flintmere/strategy/` instead. No content change.

## Lenses convened

Standing Council: #1 editor, #5 product marketing, #9 lawyer, #10 DevOps, #11 investor voice, #12 ecosystem strategist, #15 staff engineer, #17 performance, #20 brand copy, #21 technical copy, #22 conversion copy, #23 regulatory, #34 debugging, #35 product analyst, #36 operations, #37 consumer psychologist.
Sub-councils: Copy Council (full), Legal Council (full), Design Council — Noor (#8 accessibility) + Sable (UX) standing by for Phase 2.
Vetoes active: Noor (#8), #24 data protection, #11 voice, Legal Council (#9 + #23 + #24).

**Seat gap flagged:** No standing seat for regulatory-affairs / vertical taxonomy maintenance. Per `PROCESS.md` rule 5 ("Adding a new council member is allowed and encouraged when a domain isn't represented"), proposing seat **#39 — Regulatory affairs (food / beauty / apparel taxonomy)** with veto on standards publication accuracy. Operator confirms the seat addition before standards page ships.

## Where the lenses converge

1. **Vertical-first IA is sound.** #5, #12, #37 read the homepage's seven-pillar lead as commodity-shaped. Vertical picker reads as specialist-shaped to the same target buyer.
2. **The Plus tier needs honest framing.** #11, #23, #1 all flag that listing a tier the conversion path can't reach is a credibility gap visible to any sophisticated reader. Beta-gate is the right move.
3. **The standards publication is the strategically loadbearing artifact.** #12, #15, #35 agree: nothing else in the report creates a citable third-party reference. Without it, the 12-month gate cannot pass.
4. **Companies House + LinkedIn alignment is a procurement gate, not a marketing gate.** #9, #23, #36 converge that this is cheap-to-fix and high-leverage.
5. **600-line limit holds.** Report is 439 lines. This review targets ≤300. Both within `projects/flintmere/strategy/`.

## Where lenses diverge — operator decisions required

### Q1 — Pricing magnitudes
The report's illustrative ladder (Food single £49/mo; Food+Beauty bundle £89/mo) is *lower* than the current floor (£59 in `BUSINESS.md` / £79 per the report's read of `pricing.ts`).

- #11 investor voice: lower starting price = longer payback unless conversion lifts >2x.
- #22 conversion copy: vertical specialisation usually justifies *higher* price, not lower. The report may under-price its own moat.
- #35 product analyst: §13 of the report explicitly flags numbers as illustrative pending willingness-to-pay study with 20+ food merchants.

→ **Q1: Hold current £59/£79 floors with the new vertical axis applied, or commit to the report's lower numbers and treat the WTP study as confirmation/correction?**

### Q2 — Standards subdomain vs path
- #12 ecosystem strategist: `standards.flintmere.com` reads as institutional. Trade press cites domains over paths.
- #10 DevOps + #15 staff engineer: subdomain = new Coolify service + Traefik route + cert + nightly DO Spaces backup. Non-trivial but tractable.
- #36 operations: subdomain = additional ops surface to maintain.

→ **Q2: Subdomain `standards.flintmere.com` for institutional weight, or `flintmere.com/standards/food/v1` for shipping speed (revisit subdomain at month 6)?**

### Q3 — Quarterly cadence FTE backing
Per §11 of the report: 0.5–1.0 FTE per vertical for regulatory taxonomy maintenance. Three verticals × quarterly = 1.5–3.0 FTE ongoing. Currently zero.

- #36 operations + #15: cadence drift on a "Standard" with regulatory references invites stale-data exposure (#23 amplifies).
- #11 investor voice: public commitment to a cadence we can't keep is worse than half-yearly we can.

→ **Q3: Commit quarterly with regulatory-affairs contractor pipeline confirmed before Month 2, or half-yearly until that hire lands?**

### Q4 — 12-month gate calendar
- #35 product analyst: binary date is sharper measurement; quarter-window is more honest given strategic timelines.
- #11 investor voice: binary deadline forces real review; quarter-window invites slippage rationalisation.
- #1 editor: report pre-commits "April 26 2027". If operator wavers, the date becomes pseudo-committed and the gate loses force.

→ **Q4: Lock 2027-04-26 exactly, or window 2027-04 → 2027-06?**

### Q5 — Plus public price floor
- #5 product marketing: removing the £1,500+ display = cleaner positioning.
- #22 conversion copy: "from £1,200/mo on enquiry" preserves an anchor without committing.
- #11 investor voice: no number visible reads as if Plus has no price; confuses pipeline.
- #15 staff engineer: any number visible while tier is beta-gated risks fulfilment mismatch.

→ **Q5: Drop the public Plus price entirely (cleanest), or "from £1,200/mo on enquiry" as anchor?**

## Veto pre-flight (no execution starts without these clearing)

- **Noor (#8) — accessibility.** No veto on the strategy itself. Reactivates when vertical picker is specced in Phase 2 (`design-information-architecture` + `design-marketing-surface`). Vertical picker keyboard-navigation pattern, focus order, and `prefers-reduced-motion` contract must clear before Phase 3 build.
- **#24 data protection.** No veto on strategy. Will reactivate if `/about` page surfaces founder personal data beyond what's in Companies House public record.
- **#11 voice.** Soft flag on proposed h2 "Pick the standard your catalog needs. We maintain it." Passes on first read; "We maintain it" is a maintenance promise tied directly to Q3. If Q3 = half-yearly, the line needs softening.
- **Legal Council.** Removing public Plus price requires `claim-review` pass on every existing surface before homepage ships — outbound emails, signed PDFs, ad creatives. If anything still quotes £1,500+, that surface updates first or the homepage doesn't ship.

## Recommendation

**Ratify the report subject to Q1–Q5 resolution.** None of the five can be answered by Claude alone; each commits the company in a way that's an operator call.

Once Q1–Q5 are answered:

1. ADRs 0011–0015 are authored capturing the resolved decisions.
2. `BUSINESS.md`, `STATUS.md`, `PROJECT.md`, `CLAUDE.md` updated in lockstep.
3. Phase 2 (`grill-requirement` × 3 + design surfaces) begins.
4. No `apps/scanner/src/` writes until design surfaces clear `design-critique`.

## What this document is not

- Not an ADR. ADRs come *after* Q1–Q5 resolution.
- Not a `STATUS.md` update. The 12-month gate enters STATUS.md only after Q4 locks.
- Not a `CLAUDE.md` update beyond the strategy/ cross-link added this session.

## Decisions log — 2026-04-26 (operator session)

| Q | Decision | Resolved by |
|---|---|---|
| Q2 — Standards location | `standards.flintmere.com` (subdomain) | Operator |
| Q5 — Plus public price | "from £1,200/mo on enquiry" anchor | Operator (council ratified) |
| Q6 — Council seat #39 | Confirmed; Regulatory Affairs added with veto on standards publication accuracy. PROCESS.md updated. | Operator |
| Q1 — Pricing magnitudes | Council launch ladder (see below). Lift over report's numbers. WTP study Month 1–2 calibrates. | Council |
| Q3 — Cadence | **Q3c (revised under £0-cash constraint)** — half-yearly food-only publication + public AI-assisted diff log + Tier-1 outreach for unpaid named reviewer. Beauty/apparel pages stay live but no public standard cadence. Cash cost ~£200/yr (Vertex AI cron only). Upgrades to Q3d (quarterly + named reviewer) when first volunteer reviewer lands. | Council, recalibrated 2026-04-26 |
| Q4 — Gate window | **6-month window, evaluating 2026-10-26.** Latest-by, not not-before — earlier citation passes the gate early. | Operator |

### Q1 launch ladder (council recommendation, operator may amend post-WTP)

```
Free                                                £0/mo
Food single store                                   £99/mo
Food agency (5 stores @ £70/store)                  £349/mo
Food + Beauty bundle (single)                       £159/mo
Food + Beauty bundle (agency)                       £499/mo
Concierge food audit + 30-day re-scan               £97 one-off (existing)
Concierge monthly retainer (1 vertical)             £349/mo
Embedded enterprise                                 from £1,200/mo on enquiry
```

Anchors: Yotpo Reviews £15–150/mo (entry SaaS), Klevu £250–1k/mo (specialist), Plytix PIM £300/mo, current Flintmere Growth £79. Council placed launch entry at £99 to read as "tool" (not "Shopify app"), preserving headroom for the post-Phase-3 specialist surface. WTP study with 20+ food merchants in Month 1–2 calibrates downward only if 60%+ refuse at £99.

### Q3 cadence + FTE — **revised 2026-04-26 under £0-cash constraint**

Original Q3a (quarterly + ~£20–25k/yr contractor) infeasible. Council reframed: the contractor was bundling five jobs (monitoring, interpretation, authoring, QC, merchant Q&A); only QC genuinely needed paid expertise, and only at the publication checkpoint.

**Q3c — Half-yearly food-only publication + AI-assisted public diff log + Tier-1 outreach.**

- `standards.flintmere.com/food/v1` published twice yearly (calendar dates set in Phase 1).
- `standards.flintmere.com/food/diff-log` — append-only public ledger. Each entry: date, regulator, regulation reference, change summary, status (`tracked` → `merged into v1.x`). Honesty signal between publications.
- Nightly Vertex AI cron on FSA / FSS / EU Official Journal RSS. Gemini 2.5 Pro reads alerts → structured queue. Reviewed weekly under #39 Regulatory Affairs discipline (~30 min). All citations must resolve to real `gov.uk` / `food.gov.uk` / `eur-lex.europa.eu` URL (404 check enforced). #39 verifies that the linked text matches the LLM-extracted claim before merge into the standard.
- Prominent disclaimer on every standard page: *"Informational guide aligned with regulator guidance as of [date]. Not legal or compliance advice. Verify against [primary source link] for your specific situation."*
- Tier-1 outreach in Phase 3: ~30–50 cold emails to UK food regulatory consultants offering pre-publication review credit + backlink + reviewer attribution. Aim: 1–2 named reviewers by Month 3.
- Upgrade trigger: first volunteer reviewer lands → Q3c upgrades to **Q3d (quarterly + named reviewer attribution)**.

**Cash cost:** ~£200/yr (Vertex AI only). Council operating time ~12 days/yr authoring (#39 + operator) + ~3 days/yr outreach refresh (#12 + operator coordination).

**Tier 6 annual spot-review** (1–2 days at £500–700/day = £500–1,400/yr) deferred until revenue clears it. Council reactivates this once first paid food customer lands.

**Trade-body partnership (Tier 2)** + **university capstone (Tier 3)** pursued opportunistically — high credibility upside, weeks-long relationship-building cost. University capstone is particularly attractive because an academic citation of the standard *is* the gate proof condition.

**STATUS.md Infra state at Phase 1:** `Regulatory affairs (food): Q3c — half-yearly publication + diff log + AI-assisted monitoring. Tier-1 outreach in progress for Q3d upgrade.`

### Vetoes — clearance status

- **#11 voice:** clears (no banned phrases in pricing copy or cadence framing).
- **#23 regulatory:** clears (≤90-day lag on active vertical at quarterly cadence).
- **#39 regulatory affairs (newly seated):** clears the cadence + contractor scoping; will reactivate at standards-page draft to validate FSA/EU citations.
- **#9 lawyer:** clears ("in development" framing on beauty/apparel avoids implied cadence commitment).
- **Noor (#8) accessibility:** dormant — reactivates at Phase 2 design surfaces.
- **#24 data protection:** dormant — reactivates if `/about` surfaces founder data beyond Companies House public record.

## Changelog

- 2026-04-26: Council convened on the final report. Lenses listed above. Q1–Q6 surfaced for operator. Seat #39 (Regulatory affairs) proposed pending operator confirmation.
- 2026-04-26 (same session): Operator confirmed Q2, Q5, Q6. Council decided Q1 (pricing ladder above) + Q3 (originally quarterly food-only). Q4 still pending. PROCESS.md updated to add seats #38 + #39.
- 2026-04-26 (Q3 recalibrated): Operator surfaced £0-cash budget — Q3a (~£20–25k/yr contractor) infeasible. Council reframed by decomposing the contractor's bundled jobs (monitoring / interpretation / authoring / QC / merchant Q&A) into separate tiers — only QC genuinely needs paid expertise, and only at the publication checkpoint. New decision: **Q3c — half-yearly food publication + public AI-assisted diff log + Tier-1 outreach for unpaid named reviewer**. Total cash ~£200/yr (Vertex AI cron). Tier 6 paid spot-review (£500–1,400/yr) deferred until first paid food customer revenue. Upgrade trigger to Q3d (quarterly + named reviewer) on first volunteer reviewer landing. ADR 0018 captures full reasoning.
- 2026-04-26 (Q4 locked): Operator locked **6-month window, evaluating 2026-10-26**, latest-by — earlier citation passes early. Mid-window check 2026-07-26. ADR 0019 captures.
- 2026-04-26 (Phase 1 landed): All five strategic ADRs (0015 food-first, 0016 pricing axis, 0017 Plus beta gate, 0018 standards subdomain + Q3c cadence, 0019 6-month gate) committed under `projects/flintmere/decisions/`. `BUSINESS.md` rewritten (positioning food-first, Decision-making framework section added, Plus row reframed, Tiers transition note). `STATUS.md` Infra state extended (standards subdomain pending Phase 4, regulatory monitoring cron pending, Q3c cadence row), `## Strategic gates` section added, changelog entry appended. `CLAUDE.md` product snapshot updated (food-first, vertical ladder transition). `decisions/README.md` ADR index resynced (added 0010 + 0011 + 0013 + 0015–0019; marked 0012 + 0014 as reserved). PROCESS.md updated to add seats #38 + #39 (council size 36 → 39). Public-framing rule adopted council-wide — customer-facing surfaces never use single-named-individual framing; "we" / "the Flintmere team" / specific seats by function. Procurement and `/about` surfaces will name Eazy Access Ltd + John Morris + the council operating model in the same paragraph (Phase 2 deliverable). Phase 2 begins on operator go: `grill-requirement` × 4 (homepage IA, pricing axis, standards surface, diff-log surface) + `design-information-architecture` on the standards subdomain.

- **2026-04-26 evening (v2 ratified — moat reframe).** Operator delivered v2 of the strategic report with a substantive moat reframe: workflow > taxonomy. Standing Council convened on v2 (39 seats; relevant lenses #15 + #18 + #4 + #24 + #11 + #22 + #39 + #37 + #7 + #5 + #36 + #34 + #38 + #1). Verdict: **ratify v2 with 5 binding adjustments + 2 architectural conflicts resolved**. Adjustments: (1) #15+#18 timeline correction — ingestion engine 9–12 months solo, not 5–7; (2) #4+#24 VETO — Phase 2 cannot ship without parallel `legal-page-draft` skill pass on DPA addendum + upload-bucket retention + photo-PII handling + Shopify scope disclosure; (3) #22+#11 — pricing magnitudes are HYPOTHESES until WTP study lands per ADR 0016; (4) #11+#1 — "Plaid of commerce data" tagged ASPIRATIONAL; (5) #39 VETO — standards remain operationally first-class despite "marketing artifact" framing demotion. Architectural conflicts: Conflict A (#5 Kael) — v2 §9.5 standards-in-`apps/scanner` contradicts ADR 0018; resolved by honouring ADR 0018 standalone-app architecture. Conflict B (#5 Kael) — v2 §9.6 `/company` route duplicates already-specced `/about`; resolved by retiring `/company`. ADR amendment chain: ADR 0020 (NEW per-channel pricing axis layer on top of ADR 0016); ADR 0019 amended in place (gate proof-condition: citation → retention ≥ 70%). Sequencing decision (council 5-2-2): finish HOMEPAGE-only Phase D web-implementation sequentially; dispatch dead-inventory wedge engineering in parallel; `/pricing` tier-strip rebuild DROPPED; `/about` + `/methodology` + `/for/plus` surface composition DEFERRED. v2 written to `projects/flintmere/strategy/2026-04-26-final-report.md` (overwriting v1; v1 visible via git history). CLAUDE.md product snapshot updated to reflect ingestion-engine centrality. STATUS.md changelog entry. Phase D-homepage + wedge engineering agents dispatched.
