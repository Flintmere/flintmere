# imagery.md — Line-art canon + photoreal canon + prompt library

Allowance Guard's marketing imagery has two active modes. Line-art is the default for icons, diagrams, and editorial motifs. Photoreal is used for blog headers only.

Council gates live at `memory/PROCESS.md` — #25 AI image director, #26 Visual brand photographer, #27 photorealism, #28 brand systems, #29 Art Director (effective veto on set cohesion), #8 Accessibility (VETO), Design Council (Maren / Noor / Thane).

## Standing rules

1. **Editorial, not stock.** Bold cropping. No filler. `DESIGN.md:35`.
2. **Hairline strokes only for line-art.** 1.5px, `strokeLinecap="round"`, `strokeLinejoin="round"`, `fill="none"` unless filling a paper surface.
3. **Palette is closed.** Do not introduce new hues. See palette block below.
4. **Every asset has alt text.** No meaning conveyed by colour alone. #8 Accessibility veto.
5. **Set cohesion beats per-image cleverness.** #29 Art Director rejects any asset that breaks the set's background, materiality, lighting direction, or colour grade.

## Line-art canon

### Stroke convention (match existing exemplars)

- `stroke="currentColor"` — the icon inherits ink colour from its container.
- `strokeWidth="1.5"` for primary strokes; `strokeWidth="2"` for protected accents (scan-line, bracket, warning bar).
- `strokeLinecap="round"` and `strokeLinejoin="round"` everywhere.
- `fill="none"` unless filling a paper-surface interior.

### Palette (all hex values AA on paper `#F7F5F0`)

- Paper surface — `#F7F5F0`
- Paper sub — `#EFECE3`
- Paper deep — `#E6E2D5`
- Ink body — `#141210`
- Oxblood (single inverse beat only) — `#2D0A0A`
- Amber accent — `#F59E0B`
- Amber deep (AA on paper) — `#854F08`
- Red accent — `#DC2626`
- Crimson paper (AA, protected headline word) — `#B3151F`
- Ink blue — `#0B2545`
- Hairline rule — `rgba(15, 17, 21, 0.14)`

### Size grid

| Use | viewBox | Rendered size |
|---|---|---|
| Compact icon | 72×72 | 56×56 |
| Featured icon | 72×72 | 72×72 |
| Featured diagram | 200×200 | 120×120 |
| Hero watermark | 400×400 | 400×400 at opacity 0.14 |

### Bundle budget (enforced by Thane)

- Icon SVG < 6KB gzipped.
- Hero illustration SVG < 20KB gzipped.
- Inline the SVG in JSX — do not add separate `.svg` asset files unless reused across three or more components.

### Motion

- Respect `prefers-reduced-motion`. No autoplaying animation on imagery.
- The `.ledger-rule::after` amber glow is already reduced-motion safe — do not re-introduce motion that bypasses it.

### Canonical exemplars (read these before drafting anything)

- Icons — `src/components/HowItWorks.tsx:149-193` (`ScanIcon`, `RiskIcon`, `RevokeIcon`).
- Diagrams — `src/components/FeaturesPreview.tsx` (`NonCustodialDiagram`, `DashboardDiagram`, `RiskDiagram`, `BatchDiagram`).
- Watermark — `src/app/page.tsx:72-87` (compass, opacity 0.14).

## Photoreal canon

Used for blog header images only. Pipeline already exists.

- **Tooling**: `scripts/generate-blog-images.py`.
- **Model**: Runware API, `google:2@1` (Nano Banana 2).
- **Dimensions**: 1408×768, `.webp`.
- **Prompt rules** (enforced by #27 + #28):
  - Concrete subject. Name the material, the lighting, the background.
  - Warm amber + cream tones. Cream or ivory surface.
  - Max 30 words.
  - Editorial product photography, not stock.
  - Shallow depth of field, soft studio light unless the subject calls for directional.
- **Negative prompts** (append to every call): `no hands, no faces, no text, no logos, no reflections of cameras, no neon, no cyberpunk, no meme`.

Skills do not call Runware directly. They append entries to the prompt library below; the user runs the script to render.

## Prompt library

Columns: `Date | Asset | Mode | Subject | Prompt | Negative | Rendered path | Alt text`.

| Date | Asset | Mode | Subject | Prompt | Negative | Rendered path | Alt text |
|------|-------|------|---------|--------|----------|---------------|----------|
| <!-- seeded empty; image-direction skill appends --> | | | | | | | |
