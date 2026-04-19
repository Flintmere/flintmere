# accessibility.md

Accessibility gates for every design surface. Noor holds a **VETO** — nothing that violates AA ships, and nothing that degrades keyboard / screen-reader / motion safety ships.

WCAG AA is a floor. It is not the goal. The goal is usable for every reader.

## Contrast floors (Ledger)

See `tokens.md` for the full text token ladder. Short version:

- Body copy on `paper`, `paper-sub`: `text-ink-muted` or darker (≥ AA).
- Body copy on `paper-deep`: `text-ink-whisper` is the minimum (5.18:1).
- Metadata (labels, footnotes, dotted-leader right-hand values): `text-ink-whisper` permitted.
- Interactive elements (buttons, links): AA minimum; AAA preferred on primary CTAs.
- Error / destructive: accent red that holds AA on its container.
- Inverse block (oxblood CTABand): cream on oxblood; verified AA.

## Contrast floors (Glass)

- Canonical glass text tokens only. No custom low-contrast strings.
- No text placed directly over unblurred imagery. If imagery is behind text, a scrim brings contrast to AA.

## Keyboard

- Every interactive element reachable by Tab in a logical order.
- Every interactive element has a visible focus ring.
- Focus ring not removed in animation or transition states.
- Modal opens → focus moves to first focusable element inside; Esc closes and returns focus to trigger.
- Skip-to-content link on long pages (docs, blog post).

## Screen readers

- Semantic HTML first. `<nav>`, `<main>`, `<article>`, `<aside>`, `<footer>` — used correctly, not as div substitutes.
- Heading hierarchy: one `<h1>` per page, no skipping levels.
- Landmarks labelled when multiple exist (`aria-label="Primary navigation"`, etc.).
- Live regions (`aria-live`) used when content changes dynamically (toast, scan progress, rate-limit warning).
- Decorative SVG: `aria-hidden="true"`. Meaningful SVG: `aria-label` or title.
- Alt text on every image — literal for content images, empty (`alt=""`) for decorative.
- Icon-only buttons: `aria-label` mandatory.

## Motion safety

- `prefers-reduced-motion` honoured everywhere. See `motion.md` for the contract.
- No flashing content (>3Hz) — ever.
- Auto-advancing content (carousel) pauses on hover + focus.
- Infinite animations have an off-switch under reduced motion.

## Forms

- Every input has a label. Placeholder is not a label.
- Errors: announced via `aria-live="polite"` when they appear.
- Required fields marked with both `aria-required` and a visual indicator (asterisk is fine; colour alone is not).
- Error messages tied to the input with `aria-describedby`.
- Submit button text is a verb (Subscribe, Save, Delete) — never "Click here", never "Submit" alone.

## Colour + meaning

- No colour-only signalling. Every colour-coded signal has a second cue (icon, label, pattern).
- Risk badges (`RiskBadge`) pair colour with a symbol and a text label.
- Status dots pair colour with a label tooltip or adjacent text.

## Links + buttons

- Descriptive text. "Read the report" over "click here". "Cancel subscription" over "continue".
- Destination clear from the link text alone, no context required.
- Buttons are `<button>`. Links are `<a>`. No `role="button"` on a `<div>`.

## Zoom + reflow

- Supports 200% zoom without horizontal scroll on primary content.
- Supports text-only zoom (browser text-size) without breaking layout.
- Mobile reflow: 320px wide as the floor.

## Specific AG surfaces

- **Hero**: compass SVG watermark is decorative (`aria-hidden`); headline gets the `<h1>`.
- **CTABand**: protected crimson accent word stays inside a span that still meets AA. Its semantics are visual, not structural — no role.
- **ChainLogoCarousel**: under `prefers-reduced-motion`, auto-scroll halts; logos visible as a static row.
- **Modal**: focus trap tested on every new modal. Escape key closes.
- **Forms (subscribe, signup, Turnstile)**: labels explicit; Turnstile iframe is announced by its wrapper.

## How accessibility fails the council

- Noor VETOES: any AA contrast failure, any missing focus ring, any animation without a reduced-motion branch, any meaningful SVG without accessible name, any colour-only signal.
- Sable rejects: keyboard path that requires memorising non-standard order, focus ring that isn't visible.
- Maren rejects: text-over-image without scrim, overlapping content at 200% zoom.

## How to check before ship

1. Keyboard-only pass. Tab through the surface. Every action reachable? Focus visible?
2. Screen-reader pass. VoiceOver / NVDA. Does the page read in order? Are interactive elements announced?
3. Contrast pass. Verify tokens against the ladder in `tokens.md`. Any custom colours? Reject them or run through `design-token`.
4. Reduced-motion pass. Enable `prefers-reduced-motion` in devtools. Surface still functional?
5. Zoom pass. 200% browser zoom. No horizontal scroll on primary content?

If any check fails, Noor blocks emit.

## Canonical sources

- `projects/allowanceguard/DESIGN.md` — AA rules, Noor's veto authority.
- `tokens.md` — contrast floors.
- `src/components/ui/*` — primitives with built-in a11y (Modal focus trap, Alert `aria-live`).
- `src/components/TurnstileWidget.tsx` — accessible widget wrapper pattern.
