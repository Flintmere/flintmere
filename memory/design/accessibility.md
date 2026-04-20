# accessibility.md

Accessibility gates for every Flintmere surface. **Noor (#8, veto)** blocks any AA failure, any missing focus ring, any animation without a reduced-motion branch, any meaningful SVG without an accessible name, any colour-only signal.

WCAG AA is the floor. The goal is usable for every reader.

## Contrast floors (Flintmere canon — neutral-bold hybrid)

Tokens defined in `tokens.md`. Contrast table computed against the real palette:

### On `--paper` (`#F7F7F4`)

| Text token | Hex | Contrast | Use |
|---|---|---|---|
| `--ink` | `#0A0A0B` | **19.1:1** | Body default, headings, bracket tokens |
| `--ink-2` | `#141518` | **17.2:1** | Lede, card body after lede |
| `--mute` | `#5A5C64` | **6.3:1** | Secondary body, pillar-row `.desc`, captions — **AA body-safe** |
| `--mute-2` | `#8B8D95` | **3.5:1** | **Metadata only.** Eyebrows, mono labels, timestamps. Never body. Noor's floor. |
| `--alert` | `#E54A2A` | 4.6:1 | Inline error text, P0 dot colour |
| `--ok` | `#3F8F57` | 4.5:1 | Success states, resolved issues |

### On `--paper-2` (`#EDECE6`)

Slight drop from `--paper` — all tokens above still pass AA with margin except `--mute-2`, which drops to 3.2:1. Keep `--mute-2` off `--paper-2` surfaces.

### On `--ink` (`#0A0A0B`) — inverted sections

| Text token | Hex | Contrast | Use |
|---|---|---|---|
| `--paper` | `#F7F7F4` | 19.1:1 | Body + headings on dark sections |
| `--mute-inv` | `#A8AAB2` | **7.4:1** | Secondary text on ink (body-safe) |
| `--mute-2` | `#8B8D95` | 5.1:1 | Metadata on ink |
| `--accent` amber | `#F8BF24` | **≈ 11:1** | Accent word, score-ring fill, severity-high dot, warn-row marker on ink — all AAA. |

### On `--accent` (amber `#F8BF24`)

Only `--ink` (`#0A0A0B`) renders on amber. Contrast ≈ 11:1 (AAA). Never white, never `--ink-3`, never `--mute*`.

### Amber on `--paper` — text is not allowed

Amber on `#F7F7F4` paper is ≈ **1.7:1** — insufficient for any text role. Amber on paper is permitted only as:

- Graphic fills (score-ring, dots, bars, icon fills, focus-ring shapes)
- Display type ≥ 48px (glyph thickness compensates)
- Bracket under-tick hairlines (1px)
- Amber-fill CTAs where the text on top is `--ink` (ink-on-amber passes AAA)

Amber is never body (14–16px), never meta text, never eyebrow text on paper, never inline link text on paper. See ADR 0007 for the full rule.

## Keyboard

- Every interactive element reachable by `Tab` in a logical, left-to-right top-to-bottom order.
- Every interactive element has a visible focus ring — 2px `--ink` outline with 2px offset on paper surfaces; 2px `--accent` outline on ink surfaces.
- Focus ring not removed during animation, hover, or transition states.
- Modal opens → focus moves to first focusable element inside; `Esc` closes and returns focus to trigger.
- Skip-to-content link on long pages (blog, docs, full marketing home).
- `Tab` order across the embedded Shopify app follows Polaris's expectations (Polaris handles most of this; Flintmere islands must not break it).

## Screen readers

- Semantic HTML first. `<nav>`, `<main>`, `<article>`, `<aside>`, `<footer>` — used correctly, not as `<div>` substitutes.
- One `<h1>` per page. No skipped heading levels.
- Landmarks labelled when multiple exist (`aria-label="Primary navigation"`, `aria-label="Scan results"`).
- Live regions (`aria-live="polite"`) for scan progress, rate-limit warnings, toast notifications.
- Decorative SVG: `aria-hidden="true"`. Meaningful SVG: `role="img"` + `aria-label` or `<title>`.
- Alt text on every image — literal for content, empty (`alt=""`) for decorative.
- Icon-only buttons: `aria-label` mandatory.

### The legibility bracket (signature) — screen reader rules

The bracket `[ word ]` is a visual signature that must not become a screen-reader noise generator.

- **On headings and body prose**: the brackets are part of the sentence. Screen readers announce `left bracket word right bracket`. Acceptable because the bracket adds meaning ("this token is what the agent would extract").
- **On interactive elements (buttons, links, tabs)**: wrap brackets in `<span aria-hidden="true">[&nbsp;</span>` / `<span aria-hidden="true">&nbsp;]</span>` and provide a clean `aria-label` on the parent. E.g., `<button aria-label="Scan my store">Scan <span aria-hidden>[</span> my store <span aria-hidden>]</span></button>`.
- **On eyebrows and micro-labels**: brackets may be decorative here — wrap the full bracket in `aria-hidden` if the bracketed word is redundant with surrounding content.
- **Never bracket an entire CTA** — only the noun within it.

## Motion safety

- `prefers-reduced-motion: reduce` honoured everywhere. See `motion.md` for the explicit contract.
- No flashing content (>3Hz) ever.
- Auto-advancing content pauses on hover + focus. Under reduced motion, no auto-advance at all.
- Infinite animations have an off-switch under reduced motion. Flintmere avoids them entirely by preference.

## Forms

- Every input has a label. `<label>` or `aria-label`. Placeholder is never a label.
- Errors announced via `aria-live="polite"` when they appear.
- Required fields marked with `aria-required` and a visible indicator (asterisk or "required" text). Colour alone is not.
- Error messages tied to inputs via `aria-describedby`.
- Submit button text is a verb: "Scan my store", "Send the report", "Apply fix". Never "Click here" or bare "Submit".

## Colour + meaning

- No colour-only signalling. Every colour-coded signal has a second cue (icon, label, pattern, shape).
- Severity dots on issue lists pair colour with the text label adjacent ("Critical", "High", "Medium").
- Pillar progress bars pair colour with numeric percentage and status label.
- Status pills pair colour with uppercase text.

## Links + buttons

- Descriptive text. "Read the report" over "click here". "Cancel subscription" over "continue".
- Destination clear from link text alone.
- Buttons are `<button>`. Links are `<a>`. No `role="button"` on a `<div>`. No anchor without `href`.

## Zoom + reflow

- Supports 200% zoom without horizontal scroll on primary content.
- Supports browser text-size zoom without breaking layout.
- Mobile reflow floor: 320px wide.
- The Shopify app embeds inside an iframe; verify the app's own reflow inside Shopify admin's iframe sizing.

## Specific Flintmere surfaces

- **Scanner hero** — the bracketed word in the H1 is announced (`aria-hidden` not used on prose). `StatNumber` components (15×, 40%) use `aria-label` with descriptive text: "15 times year-over-year growth."
- **Score ring** — `role="img"` with `aria-label="AI-readiness score: 64 out of 100, grade C"`. Decorative conic-gradient hidden.
- **Pillar cards (locked state)** — locked cards have `aria-disabled="true"` and an `aria-describedby` pointing at the "Install to unlock" explanation.
- **Email gate** — form inputs labelled; success state announced via live region; newsletter-style consent language explicit (see `memory/marketing/brand.md` when it exists).
- **Fix preview modal** — focus trap tested. Before/after diff legible with screen reader (each change announced in `role="region"` with `aria-label="Proposed change N of 5"`).
- **Channel Health widget** — numeric metrics with `aria-label` giving context ("142 AI-agent clicks in the last 30 days, up from 108").
- **Polaris chrome in the Shopify app** — inherit Polaris's a11y. Flintmere island overrides (the score card + pillar grid + Channel Health) must match or exceed Polaris's floor.

## How accessibility fails the Council

- **Noor (#8, veto)** — any AA contrast failure, missing focus ring, missing reduced-motion branch, meaningful SVG without accessible name, colour-only signal, broken semantic structure.
- **#13 UX writer** — unclear button labels, inaccessible error messages, microcopy that confuses screen-reader output.
- **#17 Performance** — animations causing layout thrash, animations running offscreen, animations that delay INP.

## Pre-ship checklist (every surface)

1. **Keyboard-only pass.** `Tab` through the surface. Every action reachable? Focus visible? Modal traps + returns focus correctly?
2. **Screen-reader pass.** VoiceOver (macOS) or NVDA (Windows). Does the page read in order? Are interactive elements announced?
3. **Contrast pass.** Every text token verified against the ladder above. Any ad-hoc hex? Reject or route through `design-token`.
4. **Reduced-motion pass.** Enable in devtools. Surface still functional? End states visible?
5. **Zoom pass.** 200% browser zoom. No horizontal scroll on primary content.
6. **Bracket-announce pass.** If the surface uses bracket tokens on interactive elements, verify screen reader announces a clean label without bracket noise.

Any failure, Noor blocks emit.

## Sources

- `tokens.md` — palette + contrast ladder (authoritative)
- `motion.md` — reduced-motion contract
- `components.md` — primitive-level a11y specs
- `../../projects/flintmere/DESIGN.md` — three-surface island rules
