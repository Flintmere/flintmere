# Flintmere — Design System

Visual canon pointers. Authoritative tokens and rules live in `../../memory/design/tokens.md`. This file is the three-surface map and the Flintmere-specific rules that span surfaces.

## TL;DR

**Neutral-bold hybrid with the legibility bracket.** Apple-bold structure (giant Geist display, warm near-white + near-black, generous whitespace, one demoted accent) carrying one Flintmere-specific signature — the **legibility bracket**: every surface has at least one key word set in Geist Mono inside 1px ink hairline brackets, as if extracted for agent inspection. See ADR `decisions/0003-canon-neutral-bold-bracket.md`.

## Surfaces

| Surface | URL | Chrome | Brand posture | Reference |
|---|---|---|---|---|
| Marketing | `flintmere.com` | Custom (Apple-bold) | Technical confidence, manifesto-scroll, zero sulphur | `wireframes/` + `memory/design/tokens.md` |
| Scanner | `audit.flintmere.com` | Custom (Apple-bold) | Diagnostic tool, sulphur appears for live-state readouts only | `wireframes/` scanner variants |
| Shopify app | `app.flintmere.com` | Polaris (host) + Flintmere island (ours) | Platform-native with Flintmere-brand moments | Below |

## The Shopify app island rule

The Shopify app embeds inside Shopify admin. Polaris is non-negotiable for Built for Shopify approval. Flintmere's brand survives inside that environment as a **Flintmere island inside a Polaris sea**:

### Polaris owns (no overrides)

- `Page`, `Layout`, `Card` chrome, top-of-page action buttons, navigation patterns
- `Button`, `Banner`, `Toast`, `Modal` components
- Form inputs, tables (standard Polaris tables for fix history etc.)
- Loading states, skeleton states, empty states
- Accessibility affordances (focus states, ARIA, tab order)

### Flintmere owns (the island)

- **Score card** — circular score-ring (conic-gradient), big numeral in Geist, `[ 64 ]/100` bracket treatment
- **Pillar cells** — 2×3 grid with bracketed pillar numbers, progress bars, locked-state pillars
- **Channel Health widget** — Geist display numbers for AI clicks / orders / revenue
- **Issue titles** — bracketed noun treatment ("Missing `[ GTIN ]` on 412 products")
- **Fix History table headers** — Geist Mono small-caps (overlaid on Polaris table)

### Crossing rules

- Polaris primitives stay pure Polaris. Do not restyle `Button`, `Banner`, etc.
- Flintmere island components have a 1px ink hairline border and sit on `--paper`, not Polaris's `#FAFBFB`.
- The only bracket moments in the app are on the score card, issue titles, and pillar numbers — not on Polaris CTAs.
- Sulphur accent permitted only on the score-ring fill (not on Polaris primary buttons — those stay Polaris green).

## The laws

Five rules that apply to every Flintmere surface. #8 Accessibility (Noor) holds veto on any breach of law 3.

1. **Type is the image.** No stock photography, no AI gradient hero, no decorative illustration. Large Geist display carries the visual weight.
2. **One accent per section.** On marketing: the bracket is the accent (no colour). On scanner + app: sulphur is permitted once per surface, only for live diagnostic state (score ring, severity-high dot).
3. **WCAG AA on every text surface. AAA on primary CTAs.** `--mute-2` is metadata only (below body-text contrast on paper). Noor veto on any regression.
4. **`prefers-reduced-motion` honoured everywhere.** Every animation has a reduced-motion branch that disables movement while preserving meaning.
5. **Sharp corners. No shadows. No glass.** Separation is 1px ink hairline. If a surface looks weak, it's the layout, not the missing shadow.

## The bracket (signature)

**Every page has at least one.** Specification lives in `../../memory/design/tokens.md` under §Signature. Summary:

- `[ word ]` — brackets in Geist Mono, word in Geist Mono weight 700, ambient text in Geist Sans.
- One bracket moment per section. Two per page maximum.
- Bracket only structural tokens (nouns, numbers, identifiers). Never verbs or filler.
- Screen-reader rule: on interactive elements, brackets wrapped in `aria-hidden`, clean text via `aria-label`.

If a designer or copywriter produces a section without a bracket moment, that section is unfinished.

## Components (map to `apps/*/src/components/` and `packages/`)

| Component | App(s) | Purpose |
|---|---|---|
| `ScoreRing` | scanner + shopify-app | The circular score visual. Conic gradient, Geist numeral, bracket above |
| `PillarCard` | scanner + shopify-app | Pillar cell with progress bar, bracketed number, locked state |
| `IssueRow` | scanner + shopify-app | Issue title (with bracket), severity dot, count, CTA |
| `EmailGate` | scanner | Dark-section email capture with ink-inverted palette |
| `Eyebrow` | all | Geist Mono 11px uppercase, optional sulphur dot prefix |
| `Bracket` | all | The primitive — wraps a word, handles aria-hidden variant |
| `StatNumber` | marketing + scanner | Giant Geist number for numeric callouts (15×, 40%, 5.6M) |
| `ContrastSection` | marketing | Two-column "Before / After agentic commerce" framing |
| `PricingRow` | marketing | Tier, price, blurb, row-per-tier with 1px ink dividers |
| `Manifesto` | marketing | Full-bleed ink section with Geist display quote |
| `ChannelHealthWidget` | shopify-app | Three stats (clicks / orders / revenue) + UTM status note |

Full component specs — prop APIs, variants, accessibility annotations — in `../../memory/design/components.md` (authored via `design-component` skill when implementation starts).

## Tokens (pointer)

Canonical: `../../memory/design/tokens.md`. Highlights for quick reference:

- **Fonts:** Geist Sans (body + display) + Geist Mono (micro, brackets). Self-hosted, SIL OFL.
- **Paper:** `#F7F7F4` (canvas), `#EDECE6` (secondary).
- **Ink:** `#0A0A0B` (text + dividers), `#141518` (lede).
- **Mute:** `#5A5C64` (body-safe muted), `#8B8D95` (metadata only).
- **Accent (sulphur, demoted):** `#D9E05A`. Scanner-surfaces only. Never on marketing.
- **Alert:** `#E54A2A`. True critical only.
- **Ok:** `#3F8F57`. Sparingly.

## Forbidden

- `bg-white`, `bg-slate-*`, `bg-gray-*` — canvas is `--paper`, not white.
- Gradients (except the one `conic-gradient` on score-rings).
- Drop shadows. Glassmorphism. Blur. Translucency.
- Caveat font, Fraunces font, Space Grotesk, IBM Plex Sans (all retired from earlier directions).
- Sulphur on marketing surfaces. Sulphur on Polaris chrome.
- Stock photography. AI-generated gradient heroes. Emojis as decoration.
- Drop-cap or other editorial ornaments that aren't the bracket.

## ADR pointers

- `decisions/0003-canon-neutral-bold-bracket.md` — why this canon, what was rejected
- `decisions/0001-single-repo-monorepo.md` — repo topology that this canon spans
