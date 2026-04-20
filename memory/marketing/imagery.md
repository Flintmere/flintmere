# imagery.md — Type-as-image canon + prompt library

Flintmere's default imagery mode is **type-as-image**: large Geist display carries the visual weight. Photography and illustration are rare, deliberate exceptions. No stock photography, no AI-gradient heroes, no decorative illustration.

Council gates at `memory/PROCESS.md` — #25 AI image director, #26 Visual brand photographer, #27 photorealism, #28 brand systems, #29 Art Director (veto on set cohesion), #8 Accessibility (veto on alt text + contrast), Design Council (Maren / Noor / Thane).

## Standing rules

1. **Type is the image.** Hero visuals are typography first. Photography only where a merchant-facing moment genuinely requires it (testimonial portraits, very occasionally).
2. **No stock.** Flintmere does not use stock photography. Ever.
3. **No AI-gradient heroes.** No "liquid" abstract gradient backgrounds; no "glass" / frosted product shots.
4. **Palette is closed.** See tokens in `memory/design/tokens.md`. No new hues without `design-token` proposal.
5. **Every asset has alt text.** No meaning conveyed by colour alone. **#8 Accessibility veto.**
6. **Set cohesion beats per-image cleverness.** #29 Art Director rejects any asset that breaks the set's temperature, materiality, lighting direction, or colour grade.

## Type-as-image canon (primary mode)

### When type is the image

- Marketing hero — giant Geist display with one bracket word. No illustration. Optional hairline line-art background.
- Scanner hero — same. The type does the work; no product photography.
- Pillar numbers, stat numbers, pricing prices — massive Geist numerals.
- Manifesto sections — full-bleed ink with oversized Geist quote.

### The legibility-bracket visual

The signature from `tokens.md` §Signature. Renders as `[ word ]` in Geist Mono inside 1px ink hairline brackets. When used at display scale on a hero, it becomes the primary visual anchor of the composition.

Rules for imagery that surrounds a bracket moment:

- Keep the rest of the composition quiet — the bracket is the punctuation.
- Do not place decorative illustration adjacent to a bracket.
- If a hero has both a bracket and a supporting illustration, the illustration is subordinate.

## Line-art canon (secondary — process diagrams only)

Used sparingly for process / flow diagrams (the "Audit → Fix → Monitor" three-step, the pillar enumeration). Never for decoration.

### Stroke convention

- `stroke="currentColor"` — icon inherits ink colour.
- `strokeWidth="1"` for all strokes. (Thinner than allowanceguard's 1.5 — Flintmere runs more restrained.)
- `strokeLinecap="round"`, `strokeLinejoin="round"`.
- `fill="none"` unless filling a paper interior.

### Palette (from `tokens.md`)

- Paper — `#F7F7F4`
- Paper-2 — `#EDECE6`
- Ink — `#0A0A0B`
- Ink-2 — `#141518`
- Mute — `#5A5C64` (body-safe)
- Mute-2 — `#8B8D95` (metadata only)
- Accent (Glowing Amber — portfolio signature) — `#F8BF24` (all surfaces; never small text on paper — see ADR 0007)
- Alert — `#E54A2A`
- Ok — `#3F8F57`

All AA on `--paper`; see `accessibility.md`.

### Size grid

| Use | viewBox | Rendered size |
|---|---|---|
| Inline icon | 24×24 | 16–24px |
| Three-step diagram | 80×80 | 56–80px |
| Feature diagram | 200×200 | 120–200px |
| Hero ambient SVG | 1200×600 | Full-width, opacity 0.25 (decorative) |

### Bundle budget (enforced by Thane)

- Inline icon SVG < 2KB gzipped.
- Process diagram SVG < 6KB gzipped.
- Hero ambient SVG < 18KB gzipped.
- Inline SVG in JSX — do not add separate `.svg` asset files unless reused across three or more components.

### Motion

- Respect `prefers-reduced-motion`. No auto-play animation on imagery.
- No parallax. No scroll-driven SVG morphing. Static or reveal-on-mount only.

## Photography (rare exception)

Used for: testimonial portraits only (when a named merchant provides their photo). Not for heroes, not for product imagery, not for decoration.

If a testimonial photo is used:

- Square crop, minimum 480×480.
- Black-and-white treatment to match the neutral-bold canon (colour photography clashes with the palette).
- Always paired with the person's name + role + company below.
- Permission + quote approval documented before use.

## No-photography heroes — how to replace a stock hero with type

When a brief calls for a hero and the instinct is "grab a merchant-at-laptop photo":

1. Write the headline first. Find the one-word anchor for the bracket.
2. Let the typography do what the photo would do. Geist at `clamp(88px, 14vw, 220px)` is more attention-grabbing than a stock smile.
3. Add a hairline ambient SVG behind the type only if the composition feels empty (rare).
4. If you still want a photo, question the whole approach. Flintmere's look is specifically different from other SaaS landing pages.

## Prompt library (photography pipeline — for testimonial portraits only)

Columns: `Date | Asset | Subject | Treatment | Rendered path | Alt text`.

| Date | Asset | Subject | Treatment | Rendered path | Alt text |
|---|---|---|---|---|---|
| <!-- seeded empty; add entries only for testimonial portraits --> | | | | | |

## What NOT to do

- No stock photography of merchants smiling at laptops.
- No AI-generated photorealistic product shots.
- No gradient mesh backgrounds.
- No frosted-glass overlays.
- No "3D rendered abstract shapes" (popular in SaaS, wrong for Flintmere).
- No emojis in imagery (unless the user explicitly requests).
- No decorative line-art when type would do the same work.
- No photorealistic hero imagery at all (testimonials excepted).

## Changelog

- 2026-04-19: Rewritten for Flintmere. Replaced allowanceguard canon (Ledger line-art with 1.5px strokes, compass watermark, amber/crimson accents, Runware photoreal pipeline for blog headers) with Flintmere canon (type-as-image primary, restrained 1px line-art for process diagrams, no photography except testimonials, neutral-bold palette).
