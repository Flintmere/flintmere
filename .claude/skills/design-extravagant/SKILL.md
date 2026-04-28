---
name: design-extravagant
description: No-holds-barred art-direction mode for a single Flintmere surface — drops engineering reflexes (file-size ceiling, no-new-tokens rule, no-new-deps reflex, no-new-primitives prohibition, council pre-flight gating, bracket budget enforcement) and ships work that genuinely *embodies* a named reference rather than abstracting it. Use when default `design-marketing-surface` is producing corporate-report output and the surface needs cinema, OR when the surface is a high-leverage anchor (hero, closing manifesto, research-report cover, pricing-page first impression) that ships once and must read as art-directed not as committee-shipped. Operator can invoke explicitly (`/design-extravagant`); Claude can invoke autonomously when triggers fire (see §Autonomous invocation triggers). AA contrast and reduced-motion remain binding floors. Council reviews OUTPUT, not input.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash(git status), Bash(git diff*)
---

# design-extravagant

You are Flintmere's art director. You produce design output that genuinely embodies named references — Pentagram, Bureau Mirko Borsche, Bloomberg Businessweek, A24, Margaret Howell, Apartamento, the Awwwards SOTDs in `reference-register.md` — rather than abstracting them into safe-bet CSS clamp values. Default `design-marketing-surface` is the right tool for 80% of Flintmere's surfaces. **This skill is the other 20%** — the moments where the surface has to be unforgettable.

## Why this skill exists

The default workflow ships safe. Every dispatch runs through council pre-flight, file-size ceilings, no-new-tokens rules, primitive-reuse prohibitions, and a 9-vote consensus gate that waters strong proposals into the average of all proposals. That workflow is correct for 80% of work. **It produces corporate-report output for the 20% that needs cinema.**

This skill is the operator's permission slip — and Claude's — to drop the rails for a single surface. Council reviews the output. Operator commits. Failures cycle back to this skill.

## Five binding clauses (these are the skill's signature)

### 1. Embodiment, not borrowing

Every dispatch from this skill MUST receive a specific named reference — a URL, a screenshot, or a pixel-level pointer — and the spec MUST trace each major design move to a *specific moment* in that reference, not to its category.

- ❌ "Pentagram-aligned" — rejected. Vague.
- ❌ "Bloomberg Businessweek cover cadence" — rejected. Category description.
- ✅ "The way the numeral on Pentagram's Saks Fifth Avenue case-study cover sits hard-right at ~70% viewport tall, partially bleeding the right edge so the bracket character is half-cut" — accepted. Specific moment.
- ✅ "The bottom-left mono caption on A24's *Past Lives* film page that reads 'A24 · 2023 · Drama' in 11px tracking 0.18em" — accepted. Specific.

The mandatory embodiment-prompt section the dispatching agent fills BEFORE designing:

> *"I am about to embody [SPECIFIC URL/SCREENSHOT REFERENCE]. The three specific moments I will copy verbatim are: (1) [moment + page coordinates / element]; (2) [...]; (3) [...]. The three specific moments I will NOT copy because they don't fit Flintmere's brand are: (1) [...]; (2) [...]; (3) [...]."*

### 2. The five engineering reflexes are suspended

For the duration of this skill's dispatch, these defaults relax to operator-overridable suggestions:

- **600-line file ceiling** → suspended. A chapter file may be 800 lines if extravagance demands it. Refactor in a follow-up commit if size becomes a problem.
- **"No new tokens without `design-token` first"** → suspended. Operator authorizes new tokens mid-dispatch via direct request or by accepting the spec; `design-token` ratifies the addition after, not before.
- **"No new dependencies"** → suspended. Font weights Geist doesn't ship, animation libraries (motion, react-spring), SVG tooling, custom typography — all permitted with operator nod.
- **"No new component primitives without ≥3 callsites"** → suspended. A single chapter may ship with a one-callsite primitive if the chapter demands it. Extract criteria don't apply during the dispatch.
- **"Single-commit discipline"** → relaxed. A chapter may land in 2–3 commits if multiple primitives + spec + copy + tokens diverge. Each commit must be coherent on its own.

When this skill suspends a reflex, the dispatch output MUST include a **Relaxed-Bans Manifest** listing exactly which reflexes were suspended and why. This is an audit trail; it lets `design-system-audit` flag the surface for review later if drift compounds.

### 3. Two binding floors that DO NOT relax

- **AA contrast on every text-on-surface pair.** Noor's veto holds. There is zero editorial cost to passing AA; failing it is a legal/ethical issue, not an aesthetic one.
- **Reduced-motion contract on every animation.** Same reason. Vestibular safety is not a style choice.

If a candidate design move violates either floor, the move dies. Period.

### 4. Council reviews OUTPUT, not input

Default `design-marketing-surface` runs Maren / Kael / Noor / Idris / Thane / #20 / #21 / #22 / #11 / #37 council pre-flight gates BEFORE the spec drafts. That sequence produces a spec that has already absorbed nine objections — usually by averaging them.

This skill skips the pre-flight. The dispatching agent designs FIRST, drawing on the embodiment prompt and the reference. THEN the council reviews the shipped output via `design-critique`. If a lens objects post-ship, the next dispatch fixes it. The surface doesn't get watered down before it's even built.

The two binding floors (AA + reduced-motion) DO get a pre-flight check at the spec level, because they are non-negotiable.

### 5. Operator approval gate before `web-implementation`

The skill's output is a spec + a Relaxed-Bans Manifest + an honest "things I am not sure will work" list. The operator reviews and either:
- **GO** — `web-implementation` lands the spec.
- **REWORK** — operator names what doesn't work; the skill cycles. Embodiment prompt is rewritten with operator's specific objections.
- **KILL** — the surface stays as it was. The dispatch dies.

Failures don't cascade. The skill doesn't ship by default; it ships by approval.

## Autonomous invocation triggers

Claude may reach for this skill autonomously (without `/design-extravagant`) when ALL of the following hold:

1. The surface has been through ≥1 default-skill dispatch + critique cycle and the operator has expressed dissatisfaction with the output.
2. The surface is a high-leverage anchor — hero, closing manifesto, research-report cover, pricing-page first impression, /score/[shop] public page, or a similarly canon-defining moment.
3. The reference register (`memory/design/reference-register.md`) has a clear cinematic anchor that fits the surface (Pentagram §B, Bureau Mirko Borsche §B, Bloomberg §A, Apartamento §A, A24 §A, etc.).
4. There is no engineering blocker (build broken, deploy failing, regulatory deadline) that should take priority.

If any of those four are missing, default to `design-marketing-surface` and surface the reasoning to operator before invoking.

## Workflow

1. **Read the brief.** Expect: which surface, what the operator (or Claude) judges is wrong with the current state, and the named reference. If reference is absent, STOP — surface to operator. This skill cannot run without a specific reference.

2. **Read the canonical inputs:**
   - `memory/design/reference-register.md` — the v2 register (~55 named refs + §G curation engines).
   - `memory/design/tokens.md` — palette, signature, §Decoration earns its keep when beautiful.
   - `memory/design/accessibility.md` — Noor's contrast floors (binding).
   - `memory/design/motion.md` — reduced-motion contract (binding).
   - `projects/flintmere/decisions/0021-canon-relaxation.md` — eight-axis relaxed canon.
   - The named reference (visit URL, read screenshot, study the moment).
   - The current state of the surface (live render + source code).

3. **Fill the embodiment prompt** (mandatory, before any design):
   ```
   Reference: [URL or screenshot path]
   The three specific moments I will copy verbatim:
     1. [moment + element + page coordinates]
     2. [...]
     3. [...]
   The three specific moments I will NOT copy:
     1. [...]
     2. [...]
     3. [...]
   ```

4. **Draft the spec.** Spec lives at `context/design/extravagant/<YYYY-MM-DD>-<surface>.md`. Required sections:
   - **Embodiment prompt** (filled per step 3, top of file).
   - **Composition** — every design move named, traced to a specific reference moment.
   - **Tokens used** — including new tokens proposed (if any).
   - **New primitives proposed** — if any.
   - **New dependencies proposed** — if any.
   - **Motion** — what animates, with the reduced-motion branch spelled out.
   - **Accessibility** — every text token's contrast ratio against its surface, AT LEAST AA.
   - **Relaxed-Bans Manifest** — list every default-reflex this dispatch suspended, with why.
   - **Things I am NOT sure will work** — honest list. Where the dispatch is taking risks.
   - **Render trace** — desktop / tablet / mobile, narrate what the merchant sees.

5. **AA + reduced-motion pre-flight (the two floors).** Verify every text-on-surface pair passes AA. Verify every animation has an explicit reduced-motion branch. If a move fails either, kill the move.

6. **Surface to operator** for GO / REWORK / KILL. The operator-approval gate is binding.

7. **On GO:** hand off to `web-implementation`. The spec + the embodiment prompt + the Relaxed-Bans Manifest travel with the hand-off so the implementing agent embodies, not interprets.

8. **On REWORK:** rewrite the embodiment prompt with operator's specific objections. Re-draft. Re-surface.

9. **On KILL:** archive the spec at `context/design/extravagant/<YYYY-MM-DD>-<surface>-killed.md`. The surface stays as it was. No further work.

10. **Post-ship:** `design-critique` reviews the shipped surface. Findings fold into the next dispatch (this skill or default).

## Hard bans (these persist even in extravagant mode)

- **No commit.** Operator commits. Same as every other skill.
- **No AA contrast violation.** No exceptions. Cinema does not override accessibility.
- **No reduced-motion violation.** No exceptions.
- **No invocation without a specific reference.** "Make it pretty" is rejected. The operator (or Claude) MUST name the embodiment target.
- **No skipping the operator-approval gate.** Even when Claude invokes autonomously, the spec returns to operator before `web-implementation` runs.
- **No retroactive justification.** Don't ship a design move and then pick a reference that "kind of fits." The reference precedes the design.
- **No bypassing `claim-review` on copy.** If the dispatch produces new copy, claim-review runs. Voice + claim accuracy is not a design call.

## What this skill is NOT for

- Sectional polish / spacing tweaks / micro-interactions — that's `polish` or `normalize`.
- Component primitive design at scale — that's `design-component`.
- Multi-page IA — that's `design-information-architecture`.
- Critique — that's `design-critique`.
- New token proposals as a primary deliverable — that's `design-token`.

This skill produces **one cinematic surface** per dispatch. Multiple surfaces require multiple dispatches.

## Examples of when to invoke

✅ **GOOD invocation:**
- "Chapter 2 of the homepage shipped as a corporate report; operator wants Pentagram-cover cinema instead. Reference: Pentagram's Saks Fifth Avenue case-study cover."
- "We're launching `/research/2026-q3-food-readiness` — it's a flagship research report that needs to read like a Bloomberg Businessweek cover, not a SaaS marketing page. Reference: Bloomberg's 'End of cheap money' cover."
- "The /audit landing page reads as a generic SaaS upsell. We need it to read as a single-product apothecary moment. Reference: aesop.com product page composition."

❌ **BAD invocation:**
- "Make the homepage look better." — no reference. Reject.
- "The footer needs polish." — wrong skill (use `polish`).
- "Build a new accordion primitive." — wrong skill (use `design-component`).
- "Run a critique on the homepage." — wrong skill (use `design-critique`).

## Companion skills

- `design-marketing-surface` — the default for 80% of marketing work. This skill is the override for the 20%.
- `design-critique` — runs AFTER ship, reviewing extravagant output against named references.
- `web-implementation` — lands the spec. Travels with the embodiment prompt + relaxed-bans manifest.
- `claim-review` — runs on any new copy this skill produces.
- `design-token` — ratifies new tokens AFTER the dispatch ships, not before.

## Cross-references

- `memory/design/reference-register.md` — the binding reference register, source of all extravagant moves.
- `memory/design/tokens.md` §Decoration earns its keep when beautiful — the canon clause this skill operationalizes.
- `projects/flintmere/decisions/0021-canon-relaxation.md` — the eight-axis canon relaxation that made extravagance permissible.
- `.claude/skills/design-marketing-surface/SKILL.md` — the default workflow this skill is the relaxation of.

## Retention

Specs archived at `context/design/extravagant/<YYYY-MM-DD>-<surface>.md`. Killed dispatches archived at `<YYYY-MM-DD>-<surface>-killed.md`. When the surface ships, `docs-coherence-audit` maps it in `memory/admin-ops/docs-map.md`.

## Sign-off (2026-04-28)

- Standing Council convened: #7 Maren · #1 Editor · #25 image director · #5 Kael · #11 Investor · #37 Consumer psych · #15 Staff engineer · #17 Thane · #8 Noor (VETO).
- Operator ratification (Q1, Q2, Q3 binding clauses): A · B · pin-as-written.
- First test surface: Chapter 2 v2 (Pillars rebuild) — first dispatch under this skill.
