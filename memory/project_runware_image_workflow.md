# project_runware_image_workflow.md — Flintmere AI-imagery (Runware) workflow

> **Reconstructed 2026-06-13.** This file was referenced by shipping code
> (`apps/scanner/src/app/research/components/BodyBottom.tsx:10–11`) and by the
> `/audit/connect` imagery brief, but was **never written** — a documentation
> gap that made the canon read as an absolute AI-imagery ban when the real
> rule is a *per-surface operator override*. Reconstructed from the
> `/audit/connect` brief (`context/imagery/2026-05-06-audit-connect-hero-runware.md`,
> which used this same template) and commit `3971dcf` (the live `/research`
> still-lifes). Any agent that read only `tokens.md` §Imagery concluded
> "banned, no exceptions" — that was the drift this file closes.

## Governance — when AI imagery may ship

Default canon (`tokens.md` §Imagery): **no AI-generated imagery on marketing
surfaces** — trust-risk on a security-adjacent product, pattern-staleness,
copyright-defensibility. **That default still stands.**

AI imagery ships **only under an explicit, logged per-surface operator
override.** Trust-critical surfaces — data-access, auth, payment, the audit
deliverable — never override; they stay type-only.

### Override ledger (source of truth — append on every decision)

| Date | Surface | Decision | Model | Status |
|---|---|---|---|---|
| 2026-04-30 | `/research` vertical cards (food / beauty / apparel) | **ALLOWED** | Flux Dev | LIVE — `public/marketing/research/*.webp` (commit `3971dcf`) |
| 2026-05-06 | `/audit/connect` hero | **REJECTED** — *"type only, we stick to it"* | — | type-only |
| 2026-06-13 | Instagram carousels (via the `maters` carousel engine) | **ALLOWED** | Flux Dev | in build |

## Model + dimensions

- **Model:** Flux Dev (Runware) is the default. Flux Pro / Pro Ultra only for Plus-tier cinema — not warranted for procurement-grade-warm editorial.
- **Dimensions:** per surface. `/research` + `/audit/connect`: 1024×768 (4:3). IG carousel plates: 1080×1350 (4:5), or a background plate sized to the slide.
- NB the `maters` engine's default Runware models are Kontext `bfl:4@1` + FLUX schnell `runware:100@1`; for Flintmere output, pin **Flux Dev** to match the established `/research` look.

## The editorial-still-life template

Single subject. Warm afternoon daylight from upper-left, soft directional.
Generous negative space (upper-right). Camera ~35° oblique overhead (not
straight-down). Rule-of-thirds, horizon below centre. Tonality: warm-cream
paper, ink-dark, brass-warm highlight, honey-amber wood grain — **no saturated
colour, no brand marks, no readable text.** Mood register: *Apartamento /
Margaret Howell archive / Aesop journal* — restrained, considered, near-quiet,
procurement-grade. NOT staged-stock, NOT clip-art, NOT cluttered.

### Prompt skeleton (copy-paste; swap the Subject line per surface)

```
Editorial still life photograph, single subject, warm afternoon daylight from upper-left, soft directional light, generous negative space upper-right.

Subject: <ONE subject on a warm-toned reclaimed wooden desk surface; one small accent object catching a single soft highlight; nothing else on the desk>.

Tonality: warm cream paper, ink-dark surfaces, brass-warm highlight, honey-amber wood grain. No saturated colour. No brand marks.

Composition: subject occupies lower-left two-thirds of frame. Upper-right empty / soft-focus desk surface. Strong negative space. Camera angle ~35 degrees overhead, slightly oblique not straight-down. Rule-of-thirds horizon below centre.

Mood: Apartamento magazine / Margaret Howell archive / Aesop journal — restrained editorial still life, considered, near-quiet. NOT cluttered, NOT clip-art, NOT staged-stock-photo. Single warm light source from upper-left.

Render: photoreal, fine paper grain, fine wood grain, soft shadow, no text artefacts, no readable lettering anywhere.
```

### Anti-prompt (verbatim — use on every generation)

```
text overlays, lettering, words, brand marks, logos, readable type, neon, gradients, oversaturated colour, busy desk, clutter, multiple subjects, people, hands, body parts, digital screens, computers, phones, AI-stylized look, illustration, render, plastic surfaces, modern office, fluorescent lighting, vintage filter, sepia, tilt-shift, bokeh-blur background, watermark
```

## Treatment + encoding

- **Treatment:** `--image-treatment-warm` — `filter: saturate(0.85) contrast(1.02) sepia(0.04)` (mirrors `marketing/hero/*.avif`).
- **Encode:** AVIF q~70 (≤120KB) primary, WebP q~80 (≤160KB) fallback.
- taskUUID → slug mapping; drop at `apps/scanner/public/marketing/<surface>/`.

## Bans that persist even under override

No faces / people / hands. No readable text or logos. No SaaS-stock tropes
(see `tokens.md` §Imagery). No AI-stylized / illustration look — output must
read as photoreal editorial. **Bracket co-occurrence binding:** every AI image
moment carries the `[ ]` legibility signature within the same viewport
(`tokens.md` §Imagery). The image never carries the brand; the bracket does.
