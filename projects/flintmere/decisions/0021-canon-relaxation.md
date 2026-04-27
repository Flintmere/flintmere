# 0021 — Canon relaxation: visual variation expands within neutral-bold

- **Status:** Accepted
- **Date:** 2026-04-27
- **Layers on:** ADR 0003 (canon — neutral-bold + legibility bracket) and ADR 0007 (amber portfolio signature). Does NOT supersede them. The structural posture (Apple-bold + Geist + warm paper + amber + bracket signature) holds. This ADR only enlarges the toolbox the canon allows, so the implementation can finally express the *bold* half of *neutral-bold*.

## Context

Operator visceral feedback 2026-04-27 after a screenshot review of the live homepage and `/scan` results: *"the site is so plain I fall asleep looking at it."* The canon as drafted in ADR 0003 + 0007 is intellectually clean — Apple-bold structure, Geist, warm paper, single amber accent, single bracket signature, no shadows, no gradients, no second face — but the implementation in `apps/scanner/src/` is using only a small fraction of what the canon already permits (display-scale numerals at `clamp(88px, 14vw, 220px)`, photoreal imagery, asymmetric composition, the amber accent itself). Combined with constraints that were tighter than they needed to be (≤2 brackets per page, no shadows of any kind, no gradients of any kind, single accent), the surface reads bland-quiet where Apple-bold means confident-quiet. Different things.

Standing Council convened the same day (#7 Maren · #6 Idris · #5 Kael · #8 Noor VETO · #17 Thane · #1 Editor · #11 Investor · #37 Consumer psychologist). Verdict 7-0 to relax under Noor's accessibility conditions. Operator confirmed "relax, not retire" and elected option (ii) on the second-accent question — sage as a **decorative** second brand colour, not a semantic-state token (revisit if still too dull).

## Decision

Relax (not retire) eight axes within the existing neutral-bold posture. New tokens land in `memory/design/tokens.md` and `apps/*/globals.css`. Existing surfaces designed under the stricter canon stay valid — this is relaxation, not retraction; no migration mandated.

### Axis 1 — Second brand accent: sage (decorative)

New token `--accent-sage` (`#5A6B4D` — calibrated to hit AA on `--paper` for text use; ~5.5:1 contrast). Used as a **decorative** second brand colour: section dividers, eyebrow underlines, hairline rules below display numerals, decorative borders, secondary-CTA hover state, ink-slab section accent, header bottom-rule. **Forbidden** on score rings, severity dots, status pills, suppression-engine output, pillar weight bars — any UI element carrying *meaning*. Sage on those would mis-cue merchants who bring the conventional "green = passing" mental model. Amber stays the diagnostic-warning accent; sage stays the brand-decorative accent.

Operator override on the originally-recommended (i) "sage as positive state": (ii) decorative-only ratified — higher visual variety, weaker semantic discipline, revisit if still too dull.

### Axis 2 — Single disciplined elevation shadow

New token `--shadow-paper-1`: `0 1px 0 rgba(20,18,16,0.04), 0 8px 24px -12px rgba(20,18,16,0.08)`. A tonal wash, not a crisp drop shadow. Used on: cards (vertical-picker tiles, pillar-row containers, modals/popovers), button hover-state, elevated content blocks. **Forbidden** on body type, paragraphs, headings, inline elements. **No second shadow level. No glassmorphism. No backdrop-filter blur.**

### Axis 3 — Two atmosphere-only gradients

- `--gradient-paper-warmth`: `linear-gradient(180deg, var(--color-paper) 0%, var(--color-paper-2) 100%)` — barely perceptible, vertical, atmospheric. Used as section background fill on hero zones, callout sections.
- `--gradient-amber-radial`: `radial-gradient(circle at center, rgba(248,191,36,0.12) 0%, transparent 70%)` — used behind display-scale focal numerals (StatTriad focal stat, hero score-ring backdrop).

Atmosphere only. **Never** on text, borders, CTAs, status indicators. **No** rainbow, multi-hue, or saturated gradients.

### Axis 4 — Bracket budget per section, no page cap

Existing rule: ≤2 brackets per page (Noor's veto from ADR 0003). Replaced by: **≤1 bracket per section, no page-wide cap.** Brackets must still be structural markup (noun, number, identifier, URL, score) per the §Signature §Rules of `tokens.md`. Never decoration. The new rule unlocks `[ 01 ]–[ 07 ]` pillar IDs + content-block keywords + audit-deep CTA bracket without starving the hero/lede zones.

### Axis 5 — Line-art / diagrammatic illustration as a second imagery mode

Re-allow line-art / diagrammatic illustration as a second imagery mode **paired with** the photoreal Adobe Stock + product-screenshot rotation already documented in `tokens.md` §Imagery (added 2026-04-26). Line-art is for: technical diagrams, exploded-view product schematics, scanner-result annotation overlays, data-flow illustrations. Hairline strokes, warm ink, optional amber accent, optional sage hairline. **Still banned**: AI-generated imagery on marketing surfaces, identifiable humans without releases.

### Axis 6 — Display-weight 700 at display scale

Existing rule (ADR 0003): display weights lean on 500; weight 700 reserved exclusively for the bracketed word. Updated rule: **weight 700 permitted at display scale (≥80px) for hero numerals + display headlines** in addition to bracketed words. Body stays 400/500. The `clamp(88px, 14vw, 220px)` numerals the canon already specifies but the implementation under-uses now have explicit licence to hit 700 weight when the moment is the type itself.

### Axis 7 — Ink-slab promoted to documented surface variant

Currently ink-slab is used implicitly by StatTriad (`surface="ink-slab"`). Promoted to a documented marketing-surface variant with paired text token `--paper-on-ink` (`var(--color-paper)` over `var(--color-ink)` background). Used for: numbers strips, callouts, mid-page emphasis-flip beats. **Forbidden** on body content >800px tall (the surface is for moments, not pages).

### Axis 8 — Motion vocabulary expanded

Existing motion token set (`--ease-sharp`, `--ease-signature`, etc.) gains three new patterns, all behind the soft `prefers-reduced-motion` contract on marketing/scanner (Shopify-app strict contract for BFS retained):

- **numerals-count-up**: display numerals count from 0 to value on viewport entry
- **hover-lift**: cards lift via `translate3d(0, -2px, 0)` + `--shadow-paper-1` on hover (paired)
- **subtle parallax**: hero photography moves at 0.5× scroll velocity, optional, single instance per page

All three respect `prefers-reduced-motion: reduce` via the existing `globals.css` block (markers/scanner) or strict per-component contract (Shopify app).

## What stays sacred

- Geist Sans + Geist Mono (no second face — typography is the strongest brand spine).
- Warm near-white paper (`#F7F7F4`) + warm near-black ink (`#0A0A0B`).
- Amber `#F8BF24` as the portfolio signature + diagnostic-warning accent.
- Asymmetric composition + generous whitespace.
- AA contrast floor — Noor's veto holds. Every new token gets a contrast check.
- Soft `prefers-reduced-motion` contract on marketing/scanner; strict contract on Shopify app for BFS.
- AI-generated imagery — banned.
- Identifiable humans without releases — banned.
- The legibility bracket as the brand signature device.

## Noor's binding conditions (#8 VETO)

- `--accent-sage` must hit AA on `--paper` and `--paper-2` for any text use. Decorative hairlines (≤1px, no meaning) get a relaxed floor (visual perceptibility, not 4.5:1). Verified at token-add time.
- Positive-state info **never** conveyed by colour alone — always paired with text label or icon. Even though sage is decorative-not-semantic, do not regress the implicit pattern.
- Ink-slab pairs with `--paper-on-ink` text token (~12.7:1 contrast — AAA). Documented.
- All new motion patterns ship with a reduced-motion variant in the **same** commit. The `globals.css` block already covers numerals-count-up, hover-lift, parallax via `transition-duration: 0.01ms !important;` — confirmed during implementation.
- Shadows and gradients **never** carry meaning critical to comprehension. They are atmosphere or elevation cues only.

## Consequences

- **`memory/design/tokens.md`** — updated with new tokens + new axes documented.
- **`apps/scanner/src/app/globals.css`** — adds `--color-accent-sage`, `--shadow-paper-1`, `--gradient-paper-warmth`, `--gradient-amber-radial`, `--color-paper-on-ink` to the `@theme` block.
- **`apps/shopify-app/app/styles/globals.css`** — same token additions where applicable (Shopify-app island uses Polaris primarily; sage + shadow may be optionally adopted on island components, not on the Polaris chrome).
- **`CLAUDE.md`** — canon line updated to reference the eight-axis relaxation.
- **Existing components** — no migration mandated. StatTriad, VerticalRadiogroup, PickerDrivenContentBlock, pillars list, hero, etc. stay valid as-shipped. The next design pass (`design-marketing-surface` + `web-implementation`) adopts the relaxed canon lazily on a per-surface basis.
- **Bracket count audit** — pages currently shipped under the ≤2-per-page cap remain valid. New surfaces can use up to one bracket per section.

## Trade-offs accepted

- **Sage as decorative not semantic** — operator accepted weaker semantic discipline (industry-conventional "red/orange/green" for severity loses the green anchor) in exchange for visual variety. Council recommended (i) semantic-positive; operator overrode to (ii) decorative.
- **More tokens = more decisions per surface** — Maren's design pass and Kael's component implementations now have more knobs. Mitigated by clear allowed/forbidden lists per axis.
- **Shadow drift risk** — `--shadow-paper-1` is one elevation; nothing prevents future `--shadow-paper-2`, `--shadow-paper-3` creep. Not in this ADR. Re-opening requires a new ADR.
- **"Plaintive plain" risk persists if implementation stays timid** — the ADR doesn't *force* surfaces to use the new tokens. Operator's "revisit if still too dull" clause is the safety net: if the design pass under the relaxed canon still reads dull, retire-not-relax (option (b) from the convene) becomes the next council move.

## Rollout

- **Phase A (this commit):** ADR 0021 written + index updated + `tokens.md` updated + `globals.css` tokens added + `CLAUDE.md` canon line updated. Foundation only — no surface redesigns yet.
- **Phase B (next dispatch):** `design-critique` skill runs against the live `audit.flintmere.com/` homepage under the new relaxed canon. Produces a P0–P3 findings report on what to redesign first.
- **Phase C (parallel):** `design-marketing-surface` skill drafts redesigns for: StatTriad (display-700 + amber-radial backdrop + numerals-count-up), pillars list (`[ 01 ]–[ 07 ]` IDs + amber weight bars + ink-slab section + hover-lift), VerticalRadiogroup (sage hairline accent + shadow elevation), PickerDrivenContentBlock (line-art data-flow diagram + jargon translation), Hero (paper-warmth gradient backdrop + subtle parallax on jar.avif).
- **Phase D:** `web-implementation` lands the spec.
- **Phase E (post-deploy):** operator gut-check. If still reads dull, escalate to retire-some-rules ADR.

## Council vote

| Seat | Verdict |
|---|---|
| #7 Maren (Visual designer) | GREEN. The bold half of neutral-bold finally has expression room. |
| #6 Idris (Motion) | GREEN. Three new motion patterns, all behind reduced-motion contract. |
| #5 Kael (Architect) | GREEN. Token additions, not architectural changes. Each new token is one CSS custom property; no component refactoring beyond adoption sites. |
| #8 Noor (Accessibility VETO) | YELLOW with binding conditions (above). Conditions met → ratified. |
| #17 Thane (Performance) | GREEN. New shadows + gradients are CSS-only (no images, shaders, WebGL). Bundle-budget impact: zero. |
| #1 Editor | GREEN. None of these are typographic — Geist Sans + Geist Mono untouched. Bracket discipline preserved (still structural markup; just per-section budget). |
| #11 Investor / founder voice | GREEN. Brand cohesion intact (warm paper/ink/amber palette stays the spine). Procurement-friendly. |
| #37 Consumer psychologist | GREEN with caveat (sage decorative, not semantic — caveat overridden by operator option-(ii) selection). Visual variation reduces monotony, helps cognitive parsing under skim. |

7-0-0 with Noor's conditions binding. Ratified.

## Re-open conditions

This ADR can be re-opened (new ADR superseding) under any of:
- Operator gut-check after Phase D ships still reads dull → retire-some-rules option (b).
- Sage as decorative confuses merchants in the wild (e.g. they read sage as "passing" anyway → mis-cue) → flip to (i) semantic-positive or retire.
- BFS submission rejects any of the new motion patterns or shadow on the Shopify-app island → the affected axis is rolled back on Shopify-app surfaces (marketing/scanner unaffected).
- A second-accent need emerges that conflicts with sage's decorative role (e.g. a true positive-state colour for `/scan` engine output) → add `--accent-positive` separately; sage stays decorative.

## Cross-references

- ADR 0003 — canon: neutral-bold + legibility bracket (foundation, not retracted).
- ADR 0007 — amber portfolio signature (foundation, not retracted).
- `memory/design/tokens.md` §Palette + §Corners-surfaces-motion-floors + §Imagery — updated in lockstep.
- `memory/design/accessibility.md` — Noor's contrast floors apply to every new token.
- `memory/design/motion.md` — three new motion patterns to be documented.
- `CLAUDE.md` §Canon hygiene — updated retired list (none retired here; the eight axes are *additions*).
