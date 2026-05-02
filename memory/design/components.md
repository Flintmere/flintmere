# components.md

Component inventory for Flintmere. Canonical source for what exists, where it lives, and what tokens it consumes. Implementations live under `apps/*/src/components/`; shared primitives under `packages/ui/` (when extracted — inline in apps until a second consumer emerges).

## The signature primitive — `Bracket`

**File (future):** `packages/ui/src/Bracket.tsx` (or inline in each app until extracted).

The legibility-bracket treatment from the canon. Every surface uses this. See `tokens.md` §Signature.

```tsx
<Bracket>invisible</Bracket>               // renders [ invisible ] with Geist Mono
<Bracket size="display">64</Bracket>       // giant bracket on score
<Bracket aria-hidden>01</Bracket>          // decorative variant for pillar numbers
<Bracket interactive>Scan my store</Bracket>// wraps inside a CTA with aria-label handling
```

Props:

- `children: string` — the word to bracket (single token; enforce at build time via a lint rule)
- `size?: 'default' | 'display' | 'micro'`
- `interactive?: boolean` — when inside a button/link, hides brackets from AT via nested `aria-hidden` spans
- `aria-hidden?: boolean` — for purely decorative uses (pillar numbers, eyebrow treatments)

Rules:

- Word MUST be a single token. No spaces. No phrases. (Enforce via prop-type refinement.)
- Brackets + word render in Geist Mono; word weight 700; brackets match word weight.
- `0.25em` space inside brackets. No space outside.
- Colour inherits from parent text context (handles paper and ink surface inversion automatically).

## UI primitives — shared across apps

Marketing, scanner, and Shopify app (within the Flintmere island) consume these. Polaris primitives are **not** wrapped — they stay pure Polaris.

| Component | Purpose | Token consumption |
|---|---|---|
| `Bracket` | Signature token (see above) | Geist Mono, `--ink` / `--paper` |
| `Button` | Primary, secondary, ghost CTAs | `--ink`, `--paper`, Geist Mono; 1px ink border; sharp corners |
| `Input` | Text, URL, email inputs | `--paper`, `--ink` border, Geist Mono for placeholders |
| `Eyebrow` | Mono uppercase micro-label | Geist Mono 10–11px, `--mute-2`, optional `Dot` prefix |
| `Dot` | Small accent marker (amber on paper or ink — passes everywhere as a graphic fill) | Used inside `Eyebrow` only, not freestanding |
| `Chip` | Small bordered label | `--line` border, `--mute` text; `--accent` variant inverts |
| `Pill` | Filled label (higher visual weight than `Chip`) | Variants: `default`, `filled`, `accent`, `alert` |
| `ScoreRing` | Circular score visual | `conic-gradient(--accent 0 Nx%, --line-soft 0)`, Geist display numeral |
| `PillarCard` | Pillar-breakdown cell | 1px `--line` border, optional locked state with dashed pattern |
| `IssueRow` | Ranked issue list item | Severity dot, bracketed noun in title, count, CTA link |
| `StatNumber` | Giant Geist numeric callout | Geist 52–84px, `-0.04em` tracking, optional amber highlight (display ≥48px passes amber-on-paper, per ADR 0007) |
| `FrameBar` | Ink-surface status strip | Geist Mono labels on `--ink`, dot-cluster left indicator |
| `ContrastSection` | Two-column "before / after" | 1px vertical `--line` divider, paper and inverted halves |
| `Manifesto` | Full-bleed ink section | Geist display quote on `--ink`, optional trademark line |

### Site navigation — `SiteHeader`

The marketing-site nav is a comma-list (Batch B redo, 2026-04-29). Item-count discipline (council ruling 2026-05-02 after operator query "is five too many"):

- **Target shape: 3–5 destinations + 1–2 right-aligned actions.** Industry standard — Stripe, Linear, Vercel, Notion, Figma all sit in this band. Tempo at 4+1 (single-pager).
- **Five is the ceiling, not the target.** Hick's Law adds ~9% decision time at 5→6, ~7% at 6→7. #11 investor voice reads shorter nav as more confident; #3 editorial holds a 4-beat comma-list as cleaner clause than a 5-beat. Miller's 7±2 does NOT apply here (it's a recall limit, not a visible-list limit).
- **No duplicate destinations.** If two items resolve to the same URL, the second isn't navigation — it's marketing. Move it to body content (homepage, /audit, /pricing). The "App" item was retired 2026-05-02 because it pointed at the same `app.flintmere.com` as "Sign in".
- **Mobile sheet ceiling: 5–6 items max.** Beyond that, route to footer.
- **Past five on desktop:** new items go to the mobile sheet only, never extend the desktop comma-list.
- **Editorial register:** sentence-case, comma-delimited, no pills, no chrome bar. Hover ink → amber.
- **Current set (locked 2026-05-02):** Audit, Standards, Pricing, Sign in.

### Rules for primitives

- **Tokens only.** No ad-hoc hex, no ad-hoc spacing. Propose new tokens via `design-token`.
- **Sharp corners.** No `border-radius` except circles (score ring, Polaris-native elements we don't style).
- **No shadows, no gradients** except the score ring's conic-gradient.
- **Every interactive primitive** has a visible focus ring (2px `--ink` on paper, 2px `--accent` on ink).
- **Accessibility built in.** `Button` has label discipline; `Input` requires a label prop; `Modal` traps focus; `Pill` renders with `aria-label` when colour carries meaning.
- **Primitives stay in one place.** If a primitive is used by both apps, it lives in `packages/ui/`. Until a second app needs it, inline in the using app. Do not pre-extract.

## Marketing components — `apps/scanner/src/components/marketing/`

The marketing site lives at `flintmere.com` and (initially) is served from the same Next.js app that hosts the scanner. Split when traffic patterns diverge.

| Component | Purpose | Canon notes |
|---|---|---|
| `Hero` | Landing hero with manifesto headline | One `Bracket` on the key noun; no imagery; ambient SVG line-art optional |
| `PillarTimeline` | Numbered pillar walkthrough (01–06) | Bracketed numbers; no icons; copy-forward |
| `ContrastFraming` | "Before agentic commerce / After agentic commerce" | Uses `ContrastSection` primitive |
| `NumbersStrip` | 15× / 40% / 5.6M / 3–4× stats row | 4× `StatNumber` + `--line` dividers |
| `Testimonials` | Named quotes from merchants and agencies | No photos — typography carries it |
| `ComparisonList` | "Others / The Flintmere way" two-column | Struck-through vs ink-positive |
| `PricingRows` | Five tiers in a row | 1px `--line` dividers, no cards |
| `ManifestoBlock` | Full-bleed ink moment near footer | Uses `Manifesto` primitive; optional trademark line |

## Scanner components — `apps/scanner/src/components/scanner/`

Surfaces specific to the public scanner at `audit.flintmere.com`.

| Component | Purpose | Canon notes |
|---|---|---|
| `ScannerHero` | URL input form with trust micro-copy | Bracketed placeholder in input; submit triggers overlay |
| `ScanProgressOverlay` | Full-screen modal during scan | Terminal aesthetic — Geist Mono log lines, amber `prompt` marker (on ink canvas, AAA) |
| `ResultsScorecard` | Big score + pillar grid + issues | `ScoreRing` + 6× `PillarCard` (3 locked) + `IssueRow` list |
| `EmailGate` | Dark ink section with email capture | Inverted palette, bracket on "report", amber bullet markers (amber on ink is AAA) |
| `ShareableBadge` | Post-email share-for-trial moment | Preview graphic + LinkedIn/X/copy-link actions |

## Shopify app components — `apps/shopify-app/src/components/`

These render inside Polaris-wrapped pages. The Flintmere island is drawn with our primitives; Polaris owns everything else.

| Component | Purpose | Canon notes |
|---|---|---|
| `FlintmereScoreCard` | Score + pillar mini-grid on dashboard | `ScoreRing` + 6 mini pillars; 1px ink hairline border; sits on `--paper` inside Polaris `<Card>` |
| `ChannelHealthWidget` | AI-traffic attribution metrics | `StatNumber`s for clicks / orders / revenue; UTM status line |
| `IssueListIsland` | Critical issues with bracketed nouns | `IssueRow`s on `--paper`; CTA link opens Polaris-flavoured modal |
| `FixHistoryTable` | Audit trail with revert buttons | Polaris `<IndexTable>` with Geist Mono column headers |
| `GTINGuidanceCard` | Geography-aware GS1 path | `--paper-2` embedded card, bracket on country code, disclaimer footer |
| `SLAStatusCard` | Queue + enrichment progress | Geist Mono status rows, mini progress bars |

### The island rule (restated for code)

- Polaris components stay untouched. Do not restyle `<Button>`, `<Banner>`, `<IndexTable>`.
- Flintmere island components sit inside Polaris `<Card>` or `<Layout.Section>` but render their own internals in Flintmere canon.
- The island has a 1px `--ink` hairline border (where Polaris card borders are softer greys).
- Amber accent permitted on the score-ring fill and severity-high dots inside the Flintmere island only; never on Polaris primary buttons (those stay Shopify green `#008060`). See ADR 0007.
- Bracket tokens allowed on issue titles, pillar numbers, the score display. Never on Polaris-owned CTAs.

## Adding a new component

Design skill handoff flow (unchanged from kit default):

1. `design-component` produces a spec — TSX sketch, props, states, tokens, test strategy.
2. Council review: Kael (systems), Maren (visual), Noor (AA, veto).
3. Operator approves the spec.
4. `build-feature` picks it up — lands in the right location (`packages/ui/` if universal; app-scoped folder if not).
5. Tests ship with the component — see `../product-engineering/test-strategy.md`.

## Deprecated (do not use)

Inherited from the allowanceguard reference kit — do not re-introduce in Flintmere code:

- `Hero` (Ledger style — compass watermark, Fraunces italic)
- `CTABand` (oxblood-inverse moment; Flintmere replaces with a Geist ink section)
- `ChainLogoCarousel` (Web3-specific)
- `.paper-card`, `.paper-card-raised`, `.deckle-*`, `.grain`, `.ledger-rule` (Ledger utilities)
- `.glass-*` primitives in any form
- `StatusBadge`, `RiskBadge`, `ChainBadge` (Web3 domain; replace with `Pill` variants if needed)
- Fraunces, IBM Plex Sans, Caveat — all retired. Geist only.

If found in inherited skill copy, migrate or delete.

## Where to look first

- Token question → `tokens.md`, then `apps/*/src/app/globals.css` (once it exists)
- Primitive pattern → this file + the source
- Motion / animation → `motion.md`
- Accessibility → `accessibility.md`
- Surface-level rules → `../../projects/flintmere/DESIGN.md`
