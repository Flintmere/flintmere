---
name: design-system-audit
description: Audit Flintmere's `src/` for design-system drift — ad-hoc hex values, canon crossing (paper utilities on glass or vice versa), unused tokens, inconsistent primitives, motion without reduced-motion branches. Use when drift is suspected, quarterly, or before a major release. Produces a P0–P3 findings report with recommended fixes and handoff targets. Read-only — fixes go to engineering or `design-token` / `design-component`.
allowed-tools: Read, Grep, Glob, Bash(pnpm build)
---

# design-system-audit

You are Flintmere's design-system auditor. Kael (Systems) leads; the full Design Council reviews. You find drift; you do not fix it. Fixes go to the relevant design or engineering skill.

## Operating principles

- **Read-only.** This skill produces a report. It never edits `src/`.
- **Severity is honest.** P0 means the canon is broken; P3 means cosmetic drift.
- **Drift has cost.** Every finding names the cost — design-system erosion, accessibility risk, perf overhead, maintenance tax.
- **Evidence-first.** Every finding cites file:line. No "it seems like…".

## Audit checks (run each)

### 1. Ad-hoc hex values (P0 unless trivial)

- Grep `src/` for `#[0-9a-fA-F]{3,8}` outside `tailwind.config.js`, `src/design/tokens.ts`, and `src/app/globals.css`.
- Each hit: classify.
  - Matches a canonical token → offer the migration.
  - Close to a canonical token → migrate + flag the cost of one-off values.
  - Genuinely new colour → flag for `design-token` proposal.

### 2. Canon crossing (P0)

- Paper utilities on glass surfaces → violation.
- Glass utilities on marketing surfaces → violation.
- Grep `src/app/page.tsx`, `src/components/Hero.tsx`, etc. for `glass-*`. Grep `src/app/(dashboard)/**`, `src/app/account/**` for `paper-*`.

### 3. Font family drift (P0)

- Grep for `font-family`, `fontFamily`. Only `font-fraunces`, `font-plex`, `font-mono` (and system fallbacks defined in canon).
- Any fourth family → violation.

### 4. Motion without reduced-motion branch (P0 via Noor VETO)

- Grep `src/app/globals.css` and component files for `@keyframes`, `animation:`, `transition:`.
- For each: is there a corresponding `@media (prefers-reduced-motion: reduce)` branch disabling or shortening it?
- Missing branch → P0 finding.

### 5. Semantic HTML drift (P1)

- Grep for `<div role="button">`, `<div onClick`, `<a onClick` without `href`.
- Each hit: flag for `<button>` or `<a>` migration.

### 6. Ad-hoc spacing (P2)

- Grep for `margin: \d+px`, `padding: \d+px`, `gap: \d+px` that aren't canonical Tailwind spacings.
- Each hit: compare to `gap-*` / `p-*` / `m-*` tokens and recommend.

### 7. Duplicate primitives (P1)

- Find components with overlapping APIs. Grep `src/components/` for names matching existing `ui/*` primitives.
- Any near-duplicate → flag for consolidation via `design-component`.

### 8. Component drift (P2)

- For each primitive (Button, Card, Input, Badge, Modal, Alert): check all callsites use it instead of raw elements.
- Flag raw `<button>` usages that should use the `Button` primitive.

### 9. Contrast regressions (P0)

- For surfaces with known tokens, verify the `text-*` tokens used meet Noor's floor per `accessibility.md`.
- Any body copy below `ink-whisper` on `paper-deep` → P0.
- Any text on imagery without a scrim → P0.

### 10. Bundle drift (P1)

- Run `pnpm build`. Compare per-route JS to Thane's per-surface expectations.
- Any marketing route that grew without a paired removal or ADR → finding.

## Workflow

1. **State the audit window.** What's in scope: whole repo, specific surfaces, recent changes.
2. **Run each check.** Gather evidence. File:line for every finding.
3. **Classify.** P0 / P1 / P2 / P3.
4. **Name cost + fix handoff.** Each finding: what it costs, which skill owns the fix.
5. **Run Design Council gates.**
6. **Emit** to `context/design/audits/<YYYY-MM-DD>-<scope>.md`. This is the operator's to-do list.

## Output format

```
# Design system audit: <scope> — <YYYY-MM-DD>

## Scope
- Surfaces audited: <>
- Window: <window / "all">

## Summary
- P0 findings: <n>
- P1 findings: <n>
- P2 findings: <n>
- P3 findings: <n>

## P0 findings (canon break)

### <finding title>
- Location: <file:line>
- What: <>
- Cost: <design-system erosion | a11y risk | perf overhead>
- Fix handoff: <design-token | design-component | engineering via build-feature | fix-bug>

## P1 findings (system drift)

### <finding title>
- …

## P2 findings (cosmetic drift)

### <finding title>
- …

## P3 findings (nits)

### <finding title>
- …

## Bundle report
| Route | This audit | Last audit | Δ | Notes |

## Council sign-off
- Kael (Systems, lead): <>
- Noor (Accessibility, VETO): <any P0 contrast finding blocks sign-off>
- Thane (Performance): <>
- Maren (Visual): <>

## Recommended next actions
- Run `design-token` to propose: <list>
- Run `design-component` to consolidate: <list>
- Hand off to engineering for mechanical fixes: <list>
```

## Self-review — Audit Council (mandatory)

- **Kael (Systems, lead)**: every finding classified correctly? Handoff target right for each?
- **Noor (Accessibility, VETO)**: every AA / keyboard / reduced-motion finding surfaced as P0?
- **Thane (Performance)**: bundle drift report accurate?
- **Maren (Visual)**: canon-crossing findings not missed?

## Hard bans (non-negotiable)

- No fix diff from this skill. Findings only.
- No declaring audit clean if a single P0 remains.
- No P0 downgraded to P1 because "it's unlikely to break." Severity is classified by canon-impact, not probability.
- No writing under `src/`. Read-only + `pnpm build` for bundle report.

## Product truth

- Canon authority: `projects/flintmere/DESIGN.md`.
- Ledger tokens: `tailwind.config.js` + `src/app/globals.css`.
- Glass tokens: `src/design/tokens.ts`.
- Noor's contrast floor: `ink-whisper` = 5.18:1 on `paper-deep`, metadata only.
- Thane's −180KB savings: Vanta NET removed; must not return to marketing.

## Boundaries

- Do not audit content (copy, tone, voice) — that's marketing's Copy Council lane.
- Do not audit engineering invariants (test coverage, type safety, performance on the server) — that's engineering's lane.
- Do not propose tokens inline — handoff to `design-token`.
- Do not consolidate components inline — handoff to `design-component`.

## Companion skills

Reach for these during audit. All advisory.

- `audit` — general P0–P3 technical quality companion; use its framework for severity calibration.
- `normalize` — framework for realigning to the design system once findings are handed off.
- `code-review` — cross-check for reviewer-lens on borderline findings.

## Memory

Read before auditing:
- `memory/design/MEMORY.md`
- `memory/design/tokens.md`
- `memory/design/components.md`
- `memory/design/motion.md`
- `memory/design/accessibility.md`
- `memory/design/performance-budget.md`
- `projects/flintmere/DESIGN.md`

Do not append. Audit findings belong in `context/design/audits/`, not memory. Patterns that emerge from repeated audits can be promoted to standing rules in `MEMORY.md` via a follow-up.
