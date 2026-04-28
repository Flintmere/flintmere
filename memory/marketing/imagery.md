# imagery.md — Imagery canon + prompt library

> **2026-04-28 reconciliation note.** This file's earlier framing — "type is the image, no stock ever" — was retired by the 2026-04-26 Standing Council canon shift documented in `memory/design/tokens.md` §Imagery. Photoreal Adobe Stock + product/agent screenshots + line-art are now the three permitted image modes on marketing surfaces, governed by a rotation rule (emotion → photoreal, proof → screenshot, supporting line-art on diagrams). The canonical statement of imagery rules lives in `memory/design/tokens.md` §Imagery; this file holds the marketing-side prompt library + sourcing patterns.
>
> When this file and `tokens.md` §Imagery conflict, **`tokens.md` wins** per CLAUDE.md precedence. Operator-licensed photoreal AVIFs at `apps/scanner/public/marketing/{hero,verticals}/*.avif` are the live canonical examples (landed 2026-04-28; sourcing brief at `context/decisions/2026-04-27-homepage-redesign-operator-locks.md` §M).

Three permitted imagery modes per `tokens.md` §Imagery:

1. **Photoreal** (Adobe Stock, warm-treated, ≤100KB AVIF/WebP) — emotion-zone moments, hero photography, vertical content blocks. Ratified 2026-04-26 (lifts the prior line-art-only mandate).
2. **Product / agent screenshots** — proof-zone moments, "how it works" sections, results/scan moments. Annotated callouts in Geist Mono.
3. **Line-art / inline SVG** — diagrams, hairline illustration, technical schematics. Permitted as a second option, not the only mode, per ADR 0021 axis 5.

Council gates at `memory/PROCESS.md` — #25 AI image director, #26 Visual brand photographer, #27 photorealism, #28 brand systems, #29 Art Director (veto on set cohesion), #8 Accessibility (veto on alt text + contrast), Design Council (Maren / Noor / Thane). Plus **#9 Lawyer (binding on Adobe Stock licence clause 4.7 — trademark clearance is operator legal exposure).**

## Standing rules (post-2026-04-26 canon shift)

1. **Type leads, imagery proves.** (Replaces "type is the image, photography rare.") Display typography still carries hero rhythm; photoreal anchors emotion, screenshots demonstrate proof.
2. **Adobe Stock photoreal permitted** with operator licence. Source unbranded products only — Adobe Stock licence clause 4.7 excludes trademark clearance, so every visible third-party brand mark is operator legal exposure (#9 Lawyer binding).
3. **No AI-generated imagery on marketing surfaces.** Photoreal, gradient, illustrative — all banned. Trust risk on a security-adjacent product.
4. **Palette is closed.** See tokens in `memory/design/tokens.md`. No new hues without `design-token` proposal.
5. **Every asset has alt text.** No meaning conveyed by colour alone. **#8 Accessibility veto.**
6. **Set cohesion beats per-image cleverness.** #29 Art Director rejects any asset that breaks the set's temperature, materiality, lighting direction, or colour grade.
7. **No identifiable humans without releases.** Banned per `tokens.md` §Imagery + reaffirmed in operator-locks §M (homepage hero brief).
8. **Banned tropes** per `tokens.md` §Imagery — team-in-glass-office, abstract-handshake, hands-typing-laptop, three-monitor-desk, hex-grid-with-neon-data-flow, robot-hand-meets-human-hand, server-room-with-blue-LED, post-purchase-shopper-with-paper-bag, box-on-doorstep-with-cute-dog. Reject without further review.
9. **Bracket co-occurrence binding.** Every photoreal moment carries the legibility-bracket signature within the same viewport — overlay typography or adjacent display heading. The image alone never carries the brand; the bracket does. (#1 Hina + #8 Noor binding.)

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
