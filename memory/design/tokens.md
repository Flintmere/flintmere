# tokens.md

Token summary for the unified Ledger canon. Canonical values live in `tailwind.config.js` + `src/app/globals.css`. This file is the reminder + council's floors, not the source of truth.

## Ledger canon (every AllowanceGuard surface)

**Use where:** every surface. Homepage, blog, pricing, docs, dashboard, account, auth flows, modals, toasts. Post-ADR 0007 there is no "app-only" or "marketing-only" — one canon covers the whole product.

### Surface tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-paper` | `#F7F5F0` | Default page surface |
| `bg-paper-sub` | `#EFECE3` | Subtle divider / secondary section / table alternate row |
| `bg-paper-deep` | `#E6E2D5` | Tertiary section / embedded card / code block background |
| `bg-oxblood` | `#2D0A0A` | Inverse moments — homepage CTABand, destructive confirms, critical error modals |
| `bg-cream` | `#F7F5F0` | Type colour on oxblood |

### Text tokens

| Token | Contrast on paper | Usage |
|-------|-------------------|-------|
| `text-ink` | 17:1 | Body default, headings |
| `text-ink-soft` | ~12:1 | Secondary body, lede text |
| `text-ink-muted` | ~7.4:1 | Tertiary copy, captions, quiet supporting text |
| `text-ink-whisper` | 5.18:1 on paper-deep | Metadata only — **Noor's floor** |

### Accents (all AA on paper)

| Token | Hex | Where |
|-------|-----|-------|
| `text-amber-deep` | `#854F08` | Display emphasis, inline signature, link base colour, list-marker signature |
| `text-crimson-paper` | `#B3151F` | **Protected** — the word "approved." on the homepage and equivalent headline accents. Also: inline error text, destructive-action labels. |
| `text-ink-blue` | `#0B2545` | Strong citations, data-table emphasis |

### Rules + hairlines

- `border-ink-rule` = `rgba(15,17,21,0.14)` — default hairline on any Ledger surface.
- `.ledger-rule` — strong ink hairline + amber hairline (signature divider). Use sparingly — the signature move earns its place.
- `.ledger-rule-short` — short variant for section intros.
- `.dotted-leader` — "label ………… value" editorial row. Works on marketing stat rows and app-side metadata rows equally.

### Type

| Token | Family | Usage |
|-------|--------|-------|
| `font-fraunces` | Fraunces (italic) | Display — signature move is oversized italic numerals / roman numerals |
| `font-plex` | IBM Plex Sans | Body, UI chrome, form labels, button text |
| `font-mono` | JetBrains Mono | Metadata, code, addresses, tx hashes |

### Utilities (`src/app/globals.css`)

- `.paper` / `.paper-sub` / `.paper-deep` — section surfaces.
- `.paper-card` — light card with letterpress drop shadow, no blur. Use on every surface — including authenticated dashboards.
- `.paper-card-raised` — elevated variant for featured content.
- `.paper-pill` / `.paper-button` — chips and secondary CTAs.
- `.grain` — inline SVG noise overlay (printed-paper texture).
- `.deckle-top` / `.deckle-bottom` — torn-paper transitions.
- `.font-display-tight` / `.font-display-black` — Plex display tuning.
- `.rule-amber-vert` — vertical amber column rule.
- `.prose.prose-ink` — editorial prose theme for long-form HTML content (blog, docs). Theme defined in `tailwind.config.js` §`theme.extend.typography.ink`.

### Protected moments (never change without Council + operator approval)

- The word **"approved."** (or an equivalent headline accent) in `text-crimson-paper`. Everything else is ink on paper.
- **Inverse moments are purpose-scoped.** Homepage CTABand uses oxblood. Authenticated surfaces may use oxblood for destructive confirms / critical error modals / fatal interstitials. Each surface gets at most one inverse moment per purpose.
- **The signature move.** Oversized Fraunces italic numerals / Roman numerals as margin notation paired with `.ledger-rule`. One per major section. Earning it is the point.

### State ramps (canon-agnostic utility palettes)

Tune state colour; they are not a second surface system. Use freely on Ledger surfaces.

- `semantic-success-*` — success affirmations. Prefer `semantic-success-500` on paper for text, `-400` for icons, `-50` for tinted backgrounds with a `500` border.
- `semantic-warning-*` — yellow/amber warnings. The tints overlap with Ledger's amber-deep accent — prefer `text-amber-deep` when the signal is "attention" rather than "caution," and reserve `semantic-warning-*` for operational states (past-due, trial-ending).
- `semantic-error-*` — red error states. Prefer `text-crimson-paper` for inline error text inside editorial body copy; use `semantic-error-*` tints for destructive icons + form-field error chrome.
- `semantic-info-*` — blue informational tint. Use sparingly; prefer `text-ink-blue` for inline citations.
- `crimson-*`, `amber-*`, `sky-*` — utility ramps. Free to use when a semantic ramp doesn't fit exactly.

## Retired: Glass / Midnight Amber (ADR 0007, 2026-04-17)

The following tokens, utilities, and scales are **retired**. Do not use on new work. Existing consumers are being migrated per ADR 0007 Phases B–E.

- **Deleted utilities** (Phase C): `.glass-card`, `.glass-pill`, `.glass-button`, `.glass-drift` and their reduced-motion branches.
- **Deleted file** (Phase C): `src/design/tokens.ts` (Midnight Amber palette).
- **Retired legacy scales** in `tailwind.config.js` (Phase E, after consumer migration): `primary-*`, `secondary-*`, `neutral-*`, `background-*`, `text-*` keys (the nested `text.primary/secondary/tertiary/inverse/muted` ones — not `text-ink` etc.), `border-*` keys (the nested `border.primary/secondary/tertiary` ones — not `border-ink-rule`), `surface-*`.
- **`dark:` variants** — no job on a single-canon product. Strip when encountered.
- **`bg-white`, `bg-slate-*`, `bg-gray-*`, `bg-neutral-*`** — never appropriate on a Ledger surface.

If you encounter any of these in code, that code predates ADR 0007 and needs migrating to Ledger.

## Contrast + accessibility floors (Noor)

- Body copy on `paper`, `paper-sub`: `text-ink-muted` or darker (≥ AA).
- Body copy on `paper-deep`: `text-ink-whisper` is the minimum (5.18:1). Metadata only at that level.
- Interactive elements: AA for focus ring, AA for text, AAA preferred on primary CTAs.
- Error text: `text-crimson-paper` or `text-semantic-error-700+` (verify AA on the container surface).
- No text on image without a scrim that brings contrast to AA.
- No colour-only meaning. Every colour-coded signal has a second cue (icon, label, pattern).

## Performance floors (Thane)

Full budget in `performance-budget.md`. Token-level notes:

- Icons inline as SVG. Import from a file only if reused in ≥3 components.
- Fonts: three families only (Fraunces, IBM Plex Sans, JetBrains Mono). Subset where possible.
- `.grain` is an inline SVG, not a raster. Do not swap for a PNG.
- No WebGL / heavy canvas on any surface.

## Proposing a new token

Every new token goes through `design-token`. The proposal carries:
- Name + proposed value
- Surface(s) + use case
- Contrast check at all sizes
- Canon fit (Ledger; there is no other canon)
- Replaces what (if anything)
- Migration plan for existing usage

Council review: Maren (visual), Kael (systems), Noor (AA VETO). If approved, the token ships in `tailwind.config.js` / `src/app/globals.css` and this file is updated to name it. Ad-hoc hex values do not ship.
