# process.md

The canonical Flintmere design flow. Discipline, not enforcement. Sister to `tokens.md`, `motion.md`, `accessibility.md`, `components.md`, `performance-budget.md`.

This file answers one question: *what order does design work happen in, and which skill owns each stage?* The framing is borrowed from Julian Oczkowski's "Real Design Process" (Medium, 2025) — adapted to Flintmere's brownfield product, three-surface canon, 36-seat Standing Council, and autonomy-tier separation between specification skills and implementation skills.

Anti-pattern this file exists to prevent: *jumping straight to surface design without grilling the requirement, mapping the IA, or pre-binding the council seats whose veto authority will land on the work.* Speed without direction is faster waste.

## TL;DR — the seven stages

| Stage | Skill | Output | Required for |
|---|---|---|---|
| 1. Grill the requirement | `grill-requirement` | `context/requirements/<slug>.md` | Anything non-trivial that lacks a written spec |
| 2. Research / claim review | `market-research` / `claim-review` | Brief or pass/fail report | External claims, competitive context, regulatory edge |
| 3. Map the IA | `design-information-architecture` | `context/design/ia/<slug>.md` | Multi-page flows, new nav, routing decisions |
| 4. Surface design | `design-marketing-surface` / `design-app-surface` | Surface spec at `context/design/specs/<slug>.md` | Per-surface composition, copy slots, motion, imagery |
| 5. Token / motion / component proposals | `design-token` / `design-motion` / `design-component` | Token / motion / component spec | When canon needs a value or primitive that doesn't exist |
| 6. Critique | `design-critique` | `context/design/critiques/<slug>.md` | Pre-ship gate; full Standing Council pass |
| 7. Implementation | `web-implementation` / `build-feature` | Code diff under `apps/*/src/` | When the operator approves the spec |

Plus the post-ship loop: `design-critique` retro after live-traffic data lands, `funnel-analysis` if the success metric isn't moving, `experiment-readout` if the change was a pre-declared experiment.

## When the full flow applies

Run all seven stages when the work is *canon-touching*. Examples:

- A new homepage section
- A new flow that spans multiple pages or surfaces
- A new product capability (Pro tier feature, Agency-tier dashboard)
- A change to pricing, tier structure, or paywall
- A regulatory or compliance change forcing a product change
- The first surface in a previously-unbuilt area (e.g., the Shopify-app dashboard when it lands May 2026)

## When stages can be skipped

- **Trivial copy change** (typo, banned phrase swap, eyebrow edit) → skip 1 + 3; run claim-review (2) + writer + web-implementation only.
- **Single-color or single-token change** to existing primitive → skip 1 + 3 + 4; run design-token (5) + critique (6) + web-implementation (7).
- **Bug fix against clear regression** → skip 1 (the bug *is* the requirement); run fix-bug + design-critique (6) if visual.
- **Pure refactor** with no observable behaviour change → skip 1, 2, 3, 4; run refactor-component + critique (6) on the diff.
- **Live incident response** → `debug-prod-incident` runs first; the design flow runs after the fire is out.

If you are unsure whether to skip a stage, do not skip it. The cost of a skipped stage shows up later (rework, missed veto, scope creep, broken IA). The cost of running an unnecessary stage is one tool invocation.

## When stages must NOT be skipped

- **Imagery work** never skips claim-review (2) — Adobe Stock licence terms + the 15-trope ban list in `tokens.md` §Imagery require explicit screening.
- **Legal-page work** never skips claim-review (2) + Legal Council in critique (6) — `legal-page-draft` operates at Autonomy Level 1 (operator confirms each write).
- **Payment / billing / pricing work** never skips grill-requirement (1) — the success metric and reversibility class must be pinned before any code lands.
- **Data-handling work** never skips Data protection #24 in critique (6) — Noor on a11y and #24 on consent are vetos by canon.
- **Cross-surface work** never skips design-information-architecture (3) — a flow that spans marketing → scanner → app must have its IA mapped before any per-surface design.

## You skipped a stage — recovery

If a stage was missed and the operator asks for the next stage's work:

1. **Stop.** Do not proceed with the requested stage.
2. **Name the gap.** "We don't have a grilled requirement / mapped IA / scoped surface for this — the next stage will inherit ambiguity."
3. **Propose the recovery.** The cheapest stage that closes the gap. Often `grill-requirement` (10 min) or a partial `design-information-architecture` (30 min) is enough.
4. **Get explicit confirm.** Operator either approves the recovery or accepts the gap with eyes open ("ship it ungated, I own the risk").

The cost of stopping for one recovery cycle is always less than the cost of shipping inheritance-of-ambiguity.

## Stage 1 — Grill the requirement (`grill-requirement`)

- **Trigger**: a non-trivial feature / change / initiative arrives without a written spec.
- **Output**: a populated requirement-spec at `context/requirements/<YYYY-MM-DD>-<slug>.md` answering eight nodes (user, scale, success metric, failure mode, edge cases, non-goals, canon constraints, deliverable boundary) + a pre-flight reading list + the next-skill recommendation.
- **Gates**: the requirement-spec is the input contract for stages 3, 4, 7. Without it, those stages run on the operator's spoken intent — fragile, drifts, and forces re-work.

## Stage 2 — Research / claim-review

- **Triggers**: external claims, competitive context, regulatory edge, audience-segment definition needing evidence.
- **Skills**: `market-research` (competitive, audience pains), `claim-review` (per-claim accuracy + legal + regulatory), `policy-alignment` (external platform policies before ad / listing / submission).
- **Output**: a brief or a pass/fail report.
- **Skip pattern**: if the requirement claims nothing externally (purely internal capability), this stage can be skipped — but `define-metric` may still be needed if the success criterion needs a new event.

## Stage 3 — Map the IA (`design-information-architecture`)

- **Trigger**: multi-page or multi-state flow.
- **Output**: an IA spec at `context/design/ia/<YYYY-MM-DD>-<slug>.md` with routes table, navigation hierarchy, page-vs-modal-vs-drawer-vs-inline decisions, breadcrumb policy, deep-link contracts, state map (empty/error/loading per route), keyboard a11y map, and council sign-offs.
- **Gates**: the routes table + state map + keyboard a11y map are binding constraints for stage 4 surface design.

## Stage 4 — Surface design (`design-marketing-surface` / `design-app-surface`)

- **Trigger**: a specific surface (page, section, screen) needs composition.
- **Skills**:
  - `design-marketing-surface` for `flintmere.com` surfaces (homepage, pricing, blog, research, landing pages)
  - `design-app-surface` for `app.flintmere.com` Shopify-app surfaces (dashboard, issue drill-down, fix preview, settings — Polaris chrome + Flintmere island rule applies)
- **Output**: a surface spec at `context/design/specs/<YYYY-MM-DD>-<slug>.md` with composition, copy slots, motion choreography, imagery direction, accessibility annotations, implementation order.
- **Gates**: the surface spec is the input contract for stage 7 implementation.

## Stage 5 — Token / motion / component proposals (parallel, not sequential)

- **Triggers**:
  - A surface spec calls for a value that doesn't exist in `tokens.md` → `design-token`.
  - A surface spec calls for an animation that doesn't exist in `motion.md` → `design-motion`.
  - A surface spec calls for a primitive that doesn't exist in `components.md` → `design-component`.
- **Council review**: Maren (visual systems), Kael (systems coherence), Noor (a11y, veto). Per-skill rules in their SKILL.md files.
- **Output**: spec for the proposed token / motion / component. Hand-off to engineering for the canonical file edit.
- **Skip pattern**: most surface design reuses existing tokens / motion / components — this stage is invoked rarely.

## Stage 6 — Critique (`design-critique`)

- **Trigger**: a surface is draft, near-ship, or post-ship and needs an honest review.
- **Output**: a scored critique at `context/design/critiques/<YYYY-MM-DD>-<slug>.md` with per-lens findings (Maren visual, Kael systems, Idris motion, Sable UX, Thane performance, Noor a11y veto, plus additional Standing Council seats per the brief) and a P0–P3 remediation list.
- **Gates**: P0 findings block ship. Operator can override P1+ with eyes open. Noor's a11y veto is canon — no override without an explicit operator decision recorded in the critique itself.

## Stage 7 — Implementation (`web-implementation` / `build-feature`)

- **Triggers**: an approved spec exists and code work is the next step.
- **Skills**:
  - `web-implementation` for marketing surface code applies (apply approved copy / approved SVG imagery to `apps/scanner/src/app/` marketing components)
  - `build-feature` for new product features end-to-end (plan → diff → tests → self-review)
  - `fix-bug`, `refactor-component`, `write-migration`, `implement-checkout-flow` are specialised siblings
- **Autonomy tier**: `web-implementation` is Tier 2 (operator approves the diff before write). `build-feature` is Tier 1 (operator approves the plan before code starts).
- **Output**: a code diff under `apps/*/src/` + tests.

## Post-ship loop

- **Re-critique** the live surface ~7 days after ship — `design-critique` against deployed reality, not the staging mock.
- **Funnel analysis** if the pre-declared success metric isn't moving — `funnel-analysis` to find the per-step drop.
- **Experiment readout** if the change was a pre-declared experiment — `experiment-readout` against the closed observation window.
- **Incident post-mortem** if the change caused an incident — `debug-prod-incident` then `incident-postmortem`.

Lessons that recur across post-ship loops should be promoted to canon: corrections to `memory/CORRECTIONS.md`, anti-pattern additions to `CLAUDE.md` "anti-waste rules," or canon edits to the relevant `memory/design/*.md` file.

## The "speed without direction" insight (in voice)

A homepage that ships in two hours with the wrong scope ships again in two days, then again in two weeks. A homepage that takes one extra hour for stages 1 + 3 ships once. The math always favours the gate. The operator who skips gates is renting time from future-themselves at a punitive rate.

Process discipline isn't ceremony. It's the part where the work stops being random.

## Sources

- `memory/PROCESS.md` — the global Standing Council + workflow rules this file inherits from
- `tokens.md`, `motion.md`, `accessibility.md`, `components.md`, `performance-budget.md` — the canon files each stage's outputs respect
- `projects/flintmere/DESIGN.md` — three-surface map + Polaris-island rule
- The seven design skills in `.claude/skills/`: `grill-requirement`, `design-information-architecture`, `design-marketing-surface`, `design-app-surface`, `design-token`, `design-motion`, `design-component`, `design-critique`. Plus the implementation skills `web-implementation`, `build-feature`, `fix-bug`, `refactor-component`, `write-migration`, `implement-checkout-flow`

## Changelog

- 2026-04-26: First authored. Codified the canonical seven-stage flow after the Julian Oczkowski article on real design process surfaced two genuine gaps in Flintmere's existing skill kit: a dedicated requirement-grilling stage (stage 1) and a dedicated information-architecture stage (stage 3). Both gaps filled with new skills (`grill-requirement`, `design-information-architecture`) the same day. The flow is discipline, not enforcement — gates document expectations rather than blocking parallel work.
