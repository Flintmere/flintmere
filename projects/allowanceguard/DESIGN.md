# AllowanceGuard — Design System

## TL;DR

One canon: **Ledger**. Warm paper, ink body, single oxblood beat per purpose. Fraunces italic + IBM Plex Sans + JetBrains Mono. Paper utilities in `src/app/globals.css`. Used on every surface — homepage, blog, pricing, docs, dashboard, account, auth flows, modals.

Glass / Midnight Amber is formally retired (ADR 0007, 2026-04-17). Do not restore it.

## Authority

The design system is governed by the redesign specs in `docs/` and by the ADR trail.

### Design spec documents (source of truth)

- `docs/allowanceguard-1-strategy-spec (3).md` — Part 1: Strategy & Design Language (Phases 1–4)
- `docs/allowanceguard-2-build (3).md` — Part 2: Build specifications (Phases 5–7)
- `docs/design-tokens-handbook.md` — Design Tokens Handbook (§11 Ledger is canonical; §10 Glass is historical and non-normative)
- `projects/allowanceguard/decisions/0005-ledger-aesthetic.md` — original Ledger ADR (superseded)
- `projects/allowanceguard/decisions/0007-unified-ledger-canon.md` — current canon decision

## The Five Laws

1. **Saturation Over Safety** — whatever the colours, OWN them. Push saturation. Push contrast.
2. **Strip, Then Amplify** — kill everything that doesn't earn space. Make what survives impossible to ignore.
3. **Materiality** — surfaces feel crafted. Subtle grain, engineered depth, tactile quality. Not flat.
4. **One Signature Move** — one recurring visual element that brands every page without a logo.
5. **Confidence in the Departure** — break clean from the legacy Glass system. Own the new identity.

## Design directives

- **Type.** Display = declarations. Aggressive scale contrast. Body with backbone.
- **Colour.** Every colour earns its place. Accent = punctuation (rare, powerful). Council decides palette.
- **Motion.** Sharp easing, choreographed entrances, scroll as revelation. `prefers-reduced-motion` mandatory.
- **Imagery.** Editorial, not stock. Bold cropping. No filler.
- **Layout.** Break the grid with purpose. Whitespace as confidence. Density contrast.

## Design Council process

Colours, typography, spacing, and component specs are produced through the Design Council process (see `memory/PROCESS.md` for members). Output is a **Design Tokens Handbook** with CSS custom properties that becomes the implementation spec.

## Ledger — the one canon

> **"Editorial financial publication."** — warm bone paper, ink body, a single oxblood beat per purpose.

Ledger is used on every AllowanceGuard surface. It establishes a light → dark → light rhythm where dark is *intentional punctuation*, not a separate canon. The homepage's oxblood CTABand is one example of that punctuation; authenticated surfaces may use the same inverse treatment for destructive confirms or critical errors (see §Inverse moments below).

### Tokens (Tailwind)

- **Surfaces.** `bg-paper` (#F7F5F0), `bg-paper-sub` (#EFECE3), `bg-paper-deep` (#E6E2D5), `bg-oxblood` (#2D0A0A), `bg-cream` (#F7F5F0 — type on oxblood).
- **Text.** `text-ink` (17:1), `text-ink-soft` (~12:1), `text-ink-muted` (~7.4:1), `text-ink-whisper` (5.18:1 on paper-deep — metadata only, Noor's floor).
- **Rules.** `border-ink-rule` (rgba(15,17,21,0.14)) for hairlines.
- **Accents.** `text-amber-deep` (#854F08, AA on paper), `text-crimson-paper` (#B3151F, AA on paper), `text-ink-blue` (#0B2545).
- **Type.** `font-fraunces` (display italic), `font-plex` (IBM Plex Sans body + UI chrome), `font-mono` (JetBrains Mono metadata).
- **State ramps** (canon-agnostic utility palettes, not surface systems): `semantic-success-*`, `semantic-warning-*`, `semantic-error-*`, `semantic-info-*`, `crimson-*`, `amber-*`, `sky-*`.

### Utilities (`src/app/globals.css`)

- `.paper` / `.paper-sub` / `.paper-deep` — section surfaces.
- `.paper-card` — light card with letterpress drop shadow, no blur.
- `.paper-card-raised` — elevated variant for featured content.
- `.paper-pill` / `.paper-button` — chips and secondary CTAs.
- `.grain` — inline SVG noise overlay for printed-paper texture.
- `.ledger-rule` — double separator (strong ink hairline + amber hairline).
- `.ledger-rule-short` — short variant for section intros.
- `.dotted-leader` — editorial "label ………… value" table row.
- `.deckle-top` / `.deckle-bottom` — torn-paper transitions between sections.
- `.font-display-tight` / `.font-display-black` — Plex display tuning.
- `.rule-amber-vert` — vertical amber column rule.
- `.prose.prose-ink` — editorial typography for long-form content (blog, docs); wired in `tailwind.config.js` under `theme.extend.typography.ink`.

### Rules

1. **One canon.** Every AllowanceGuard surface — marketing, app, auth, modals — uses Ledger tokens + `.paper-*` utilities. No alternative system. No `.glass-*` utilities (they are deleted from the codebase as of ADR 0007). No third-party CSS resets that reintroduce neutral-gray prose or rounded-full container pills.
2. **The signature move** is oversized Fraunces italic numerals / roman numerals as margin notation, paired with `.ledger-rule`. One per major section. Not every section — earning it is the point.
3. **Inverse moments are purpose-scoped, not brand-scoped.** The homepage CTABand uses oxblood. Authenticated surfaces may use oxblood (or another saturated dark) for destructive-action confirms, fatal error modals, or critical interstitial warnings. Each surface gets at most one inverse moment per purpose — the dark is always the climax, never the canvas.
4. **Protected crimson moment.** The word "approved." (or an equivalent headline accent) stays `text-crimson-paper`. Everything else is ink on paper.
5. **Noor's floor (accessibility VETO).** `ink-whisper` is the lowest-contrast text token allowed; on `paper-deep` it's 5.18:1. `ink-muted` and above are required for body copy. Interactive elements AA minimum, AAA preferred on primary CTAs.
6. **Performance (Thane).** Vanta NET has been removed. Do not re-introduce WebGL or heavy canvas on any surface. No GSAP ScrollTrigger pinning / scroll-jacking anywhere.
7. **Motion.** All entrance animations, hover transitions, and amber-glow effects respect `prefers-reduced-motion`. `.ledger-rule::after` amber glow is disabled under that query.
8. **No `bg-white`, `bg-slate-*`, `bg-gray-*`, `bg-neutral-*`, or `primary-*` / `secondary-*` / `neutral-*` / `background-*` / `text-*` / `surface-*` legacy scales on any surface.** They're either neutral palettes that break the canon or the retired Midnight Amber scales. Tokens only.
9. **Dark-mode variants (`dark:`)** have no job on Ledger surfaces. Strip them when you see them. AllowanceGuard is a single-theme product.

### Where Ledger lives

#### Marketing surfaces

- `Hero.tsx` — `.paper .grain .deckle-bottom`, compass SVG watermark, Fraunces/Plex headline, `.paper-card-raised` connected-wallet panel.
- `HowItWorks.tsx` — `.paper .grain`, featured + compact steps in `.paper-card` / `.paper-card-raised`, ink line-art icons.
- `FeaturesPreview.tsx` — `.paper .grain`, alternating editorial rows with ink line-art diagrams in `.paper-card-raised`.
- `StatisticsSection.tsx` — `.paper-sub`, giant Fraunces italic display metric, `.dotted-leader` supporting rows.
- `CTABand.tsx` — `bg-oxblood` (the homepage's inverse moment).
- `Testimonials.tsx` — `.paper .grain`, featured Fraunces pull-quote + grid of `.paper-card` quotes.
- `ChainLogoCarousel.tsx` — `.paper-sub` closing bookend.
- `/pricing` — `.paper .grain` hero, `.paper-card-raised` tier cards, amber-deep-on-paper-sub comparison table.
- `/blog` + `/blog/[slug]` — `.paper .grain` shell, `.paper-sub` article canvas, `prose prose-ink` for dangerouslySetInnerHTML content (theme at `tailwind.config.js` §`theme.extend.typography.ink`).
- `/docs` — Ledger marketing landing; authenticated docs content pages match.

#### App surfaces (post-ADR-0007)

- `/account` + all `/account/**` routes — Ledger paper canvas, `.paper-card` / `.paper-card-raised` for panels, ink body, amber-deep accents, `text-crimson-paper` reserved for destructive-path warnings.
- Dashboard (`/revoke`, `/team`, etc. — audit and migrate per Phase D of ADR 0007) — same canvas.
- Auth flows (login, signup, SIWE) — same canvas.
- Modals (shared `ui/Modal`) — Ledger paper panel on a `.paper-deep`-with-alpha scrim; destructive confirms use the oxblood inverse treatment.
- Toasts + alerts (`ui/Alert`) — Ledger tokens throughout; `semantic-*` ramps tune state colour, not surface.

### Historical note

Prior to ADR 0007, dashboard / docs / account ran on the Glass / Midnight Amber canon (dark canvas, `.glass-card` utilities, `src/design/tokens.ts` tokens). That canon is retired; all utilities, tokens, and `dark:` branches authored for it are being removed. If you encounter code that still references it — `bg-background-primary`, `text-secondary-*`, `glass-card`, `bg-primary-500` — that code predates ADR 0007 and needs migrating to Ledger. See the phased rollout in ADR 0007 §Rollout phases.

## Component library

Located in `src/components/ui/`:

- `Button.tsx` — CVA variants: primary, secondary, ghost, destructive, outline. All Ledger-tuned.
- `Card.tsx` — With `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`. Base is Ledger (`bg-paper-deep text-ink`); Glass variants (`variant="glass"`, `variant="glass-accent"`) are being removed per ADR 0007 Phase C.
- `Input.tsx` — Labels, error states, icons. Ledger.
- `Badge.tsx` — `StatusBadge`, `RiskBadge`, `ChainBadge`. Ledger with `semantic-*` state tints.
- `Modal.tsx` — Accessible dialogs with focus trap. Ledger paper panel.
- `Alert.tsx` — Semantic alerts + auto-dismiss toasts. Ledger chrome with `semantic-*` accents.

### Rules for `ui/*`

- Tokens only. No ad-hoc hex, no ad-hoc spacing. If the token doesn't exist, propose it via `design-token`.
- Focus-ring visible on paper — tested at AA contrast against every background utility.
- Every interactive element has a keyboard path.
- `dark:` branches — stripped when encountered. No purpose on a single-canon product.

## Changelog

- 2026-04-14: Split from `CLAUDE.md`. Design Council members deduplicated (now lives only in `memory/PROCESS.md`).
- 2026-04-17: **Unified Ledger canon.** Glass / Midnight Amber retired per ADR 0007. Rule #1 rewritten from "never mix" to "one canon." "Single inverse moment" rewritten from brand-scoped to purpose-scoped. `dark:` variants deprecated. Legacy `primary-*` / `secondary-*` / `neutral-*` / `background-*` / `text-*` / `surface-*` scales marked for retirement after Phase D migration. `.glass-*` utilities + `src/design/tokens.ts` marked for deletion in Phase C.
