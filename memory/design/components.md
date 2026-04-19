# components.md

Component inventory and canonical patterns. This file tells you what already exists; `src/components/` is the source of truth for implementation.

## UI primitives — `src/components/ui/`

Neutral, Ledger-tuned. Consumed by marketing + app surfaces alike (post-ADR 0007 there is no canon split).

| Component | File | Key variants |
|-----------|------|--------------|
| `Button` | `Button.tsx` | CVA: `primary`, `secondary`, `ghost`, `destructive`, `outline` |
| `Card` | `Card.tsx` | + `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`. Base is `bg-paper-deep text-ink`. Glass variants (`variant="glass"`, `variant="glass-accent"`) are deprecated and being removed per ADR 0007 Phase C. |
| `Input` | `Input.tsx` | Labels, error states, icon slot |
| `Badge` | `Badge.tsx` | `StatusBadge`, `RiskBadge`, `ChainBadge` |
| `Modal` | `Modal.tsx` | Accessible dialog with focus trap. Ledger paper panel on a `paper-deep`-with-alpha scrim. |
| `Alert` | `Alert.tsx` | Semantic alerts + auto-dismiss toasts. Ledger chrome with `semantic-*` accents. |

### Rules for `ui/*`

- Tokens only. No ad-hoc hex, no ad-hoc spacing. If the token doesn't exist, propose it via `design-token`.
- **Single canon.** Ledger only. No Glass variants, no dark-mode branches. Strip `dark:` when you see it.
- Focus-ring visible — tested at AA contrast against every paper surface utility.
- Every interactive element has a keyboard path. Modal focus trap tested.

## Ledger components — `src/components/`

| Component | File | Role | Canon details |
|-----------|------|------|---------------|
| `Hero` | `Hero.tsx` | Homepage hero | `.paper .grain .deckle-bottom`; compass SVG watermark; Fraunces/Plex headline; connected-wallet panel uses `.paper-card-raised` |
| `HowItWorks` | `HowItWorks.tsx` | Three-step explainer | `.paper .grain`; featured + compact steps in `.paper-card` / `.paper-card-raised`; ink line-art icons (stroke canon: `strokeWidth="1.5"`, `strokeLinecap="round"`) |
| `FeaturesPreview` | `FeaturesPreview.tsx` | Feature rows | `.paper .grain`; alternating editorial rows with ink line-art diagrams in `.paper-card-raised` |
| `StatisticsSection` | `StatisticsSection.tsx` | Numbers / stats | `.paper-sub`; giant Fraunces italic display metric; `.dotted-leader` supporting rows |
| `CTABand` | `CTABand.tsx` | Homepage's inverse moment | `bg-oxblood`; cream Fraunces; protected crimson accent word |
| `Testimonials` | `Testimonials.tsx` | Social proof | `.paper .grain`; featured Fraunces pull-quote + grid of `.paper-card` quotes |
| `ChainLogoCarousel` | `ChainLogoCarousel.tsx` | Closing bookend | `.paper-sub`; logo strip; `prefers-reduced-motion` halts scroll |

### Rules for Ledger components (marketing + app)

- Never introduce `bg-white`, `bg-slate-*`, `bg-gray-*`, `bg-neutral-*`, glassmorphism utilities, or legacy `primary-*` / `secondary-*` / `neutral-*` / `background-*` scales on any of these.
- Never re-introduce Vanta / WebGL backgrounds on any surface. Thane's −180KB savings are permanent unless re-argued via ADR.
- Icons and diagrams inline as JSX SVG, not separate `.svg` files — unless reused in ≥3 components.
- Headlines use `.font-display-tight` or Fraunces italic. Body uses Plex. Metadata uses JetBrains Mono.
- The signature move (oversized Fraunces italic numerals + `.ledger-rule`) appears once per major section. Not every section.

## App surfaces — authenticated pages (post-ADR 0007)

All authenticated surfaces run on Ledger. The previous "Glass / Midnight Amber" app canon is retired.

| Area | Location | Notes |
|------|----------|-------|
| Account | `src/app/account/**` | Ledger paper canvas. `.paper-card` / `.paper-card-raised` for panels. Ink body + amber-deep accent + `text-crimson-paper` for destructive-path text. |
| Dashboard | `src/app/(dashboard)/**` (verify in-repo; audit + migrate per ADR 0007 Phase D) | Ledger. Tables use `bg-paper-sub` alternate rows + `border-ink-rule` hairlines. |
| Docs | `src/app/docs/**` | Ledger. Marketing landing + authenticated content pages. Long-form content uses `prose prose-ink`. |
| Auth flows | `src/app/login`, `src/app/signup`, `src/app/siwe` (verify) | Ledger. Forms sit in `.paper-card-raised` on a `.paper-sub .grain` canvas. |
| Modals / toasts | `ui/Modal`, `ui/Alert` consumers | Ledger paper panels. Destructive confirms may use the oxblood inverse treatment. |

### Rules for app surfaces

- Same canon, same tokens, same utilities as marketing. No divergence.
- Tables: `bg-paper` body, `bg-paper-sub` alternate rows or header, `border-ink-rule` hairlines.
- Forms: `bg-paper-deep` input backgrounds, `border-ink-rule` default, `border-amber-deep` focus, `text-crimson-paper` error text.
- Destructive confirms (revoke, delete, cancel subscription): oxblood inverse moment — `bg-oxblood text-cream` for the confirm button, `text-crimson-paper` for the warning text that precedes it.
- Loading / skeleton states: `bg-paper-deep` shimmer blocks, not grey.

## Section extraction (docs recent work — commit `86d86ee`)

Docs content was extracted into `src/app/docs/sections/`:
- `ArchitectureSection.tsx`
- `SettingsSection.tsx`
- `TeamsSection.tsx`
- `TroubleshootingSection.tsx`

Pattern to replicate when a docs page grows past the 600-line limit: extract named sections into a sibling `sections/` folder, re-import into the page.

## Shared primitives

| Component | File | Purpose |
|-----------|------|---------|
| `SectionHeader` | `src/components/SectionHeader.tsx` | Consistent H2 headings across marketing |
| `Container` | `src/components/Container.tsx` | Content width constraint |
| `Highlight` | `src/components/Highlight.tsx` | Inline accent wrapper |
| `TurnstileWidget` | `src/components/TurnstileWidget.tsx` | Cloudflare Turnstile integration (docs + signup) |

## Adding a new component

Design skill handoff flow:

1. `design-component` emits a spec (TSX sketch, props API, states, tokens, test strategy).
2. Council review — Kael (systems), Maren (visual), Noor (AA).
3. User approves the spec.
4. Engineering picks it up via `build-feature` — lands it in `src/components/ui/` if primitive, or in the domain folder if feature-specific.
5. Tests ship with the component (see `memory/product-engineering/test-strategy.md`).

## Deprecations

- **Glass / Midnight Amber canon** — retired in full per ADR 0007 (2026-04-17). `.glass-*` utilities, `src/design/tokens.ts`, and Midnight Amber legacy scales in `tailwind.config.js` are being removed. Any new code using them is wrong.
- **`Card` primitive Glass variants** — `variant="glass"`, `variant="glass-accent"` deprecated; being removed Phase C.
- **`bg-white`, `bg-slate-*`, `bg-gray-*`, `bg-neutral-*`** on any surface — banned.
- **Vanta NET on any surface** — removed, do not restore.
- **`dark:` variants** — no job on a single-canon product.

## Where to look first

- Canon question? `projects/allowanceguard/DESIGN.md`.
- Canon change history? `projects/allowanceguard/decisions/0005-ledger-aesthetic.md` → `0007-unified-ledger-canon.md`.
- Token question? `tokens.md` in this folder, then `tailwind.config.js` / `src/app/globals.css` for authoritative values.
- Component pattern? This file + the actual component source. Read both.
- Motion / animation? `motion.md`.
- Accessibility? `accessibility.md`.
