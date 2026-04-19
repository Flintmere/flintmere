# tokens.md

Canon name: **Neutral-bold with the legibility bracket.**

Apple-bold structure — stark type, near-white paper, near-black ink, generous whitespace, one demoted accent — carrying one Flintmere-specific signature: **the legibility bracket**. See the Signature section below; it is the rule everything else supports.

Canonical source of truth is `apps/*/globals.css` + `tailwind.config.js` (once built). Until then, `/wireframes/styles.css` is the reference sketch and this file is the authoritative text. When the source ships, update this file — never the other way around.

## Palette

### Ink (text + dark surfaces)

| Token | Hex | Primary use |
|---|---|---|
| `--ink` | `#0A0A0B` | Default text on paper. Dark-section / hero / email-gate background. |
| `--ink-2` | `#141518` | Secondary ink on paper — body after lede, card body text when elevated. |
| `--ink-3` | `#26272B` | Tertiary ink on dark surfaces — inactive tab background, disabled state on dark. |
| `--line` | `#0A0A0B` | The 1px hairline divider on paper surfaces. Same hex as `--ink`. |
| `--line-dark` | `#26272B` | 1px divider on dark surfaces. |

### Paper (light surfaces)

| Token | Hex | Primary use |
|---|---|---|
| `--paper` | `#F7F7F4` | **Default body background.** Warmer than pure white (~1.5% amber cast) — distinguishes Flintmere from the pure-white Linear/Vercel default. |
| `--paper-2` | `#EDECE6` | Secondary surface — embedded card, alternate pricing row, footer block. |
| `--line-soft` | `#D5D2C8` | Secondary dividers inside cards, table row rules, placeholder dashed borders. |

### Mute

| Token | Hex | Contrast on `--paper` | Floor |
|---|---|---|---|
| `--mute` | `#5A5C64` | ≈ 6.3:1 | Body-safe muted text (lede, meta captions). Passes AA on paper. |
| `--mute-2` | `#8B8D95` | ≈ 3.5:1 | **Metadata only.** Eyebrows, monoclabels, timestamps. Never body. Noor's floor. |
| `--mute-inv` | `#A8AAB2` | — | The inverted mute for dark surfaces. Contrast on ink ≈ 7.4:1. |

### Accent (demoted)

| Token | Hex | Where it is allowed |
|---|---|---|
| `--accent` (sulphur) | `#D9E05A` | **Scanner surfaces only.** Score-ring fill, progress bars on pillar cards, severity-high dot, terminal `warn` rows. **Not** used on marketing or Shopify app surfaces. |
| `--accent-ink` | `#0A0A0B` | The only colour on top of sulphur. Never white on sulphur; always ink. |

The sulphur-everywhere rule from the original wireframes is **demoted** by the hybrid: sulphur now reads as "diagnostic state" rather than "brand colour". The brand carrier is the bracket, not the accent.

### Semantic

| Token | Hex | Use |
|---|---|---|
| `--alert` | `#E54A2A` | True critical only. P0 severity dots, destructive confirm fill. Never decorative. |
| `--ok` | `#3F8F57` | Success on paper (terminal `ok` row, resolved issues). Not a celebration — completion is the default. |

## Typography

### Faces

| Family | Class | Where |
|---|---|---|
| Geist Sans | `.sans` / default | Body (14-16px), display (44-280px), every heading, stat numbers, score numerals, pricing prices. Weights 400 / 500 / 700. Letter-spacing −0.02em (headings) to −0.045em (giant display). |
| Geist Mono | `.mono` | **Bracket tokens** (the signature), eyebrows, micro-labels, chip / pill text, breadcrumb, frame-bar labels, code. Weights 400 / 500. |

Geist is Vercel's open-source typeface family — SIL OFL license, self-hostable. No Caveat. No Space Grotesk. No Fraunces. If a display moment needs emphasis Geist Sans can't deliver, the first answer is "make it bigger or bolder," not "change typeface."

### Scale (Apple-bold)

| Role | Size | Weight | Letter-spacing | Line |
|---|---|---|---|---|
| Giant display | `clamp(88px, 14vw, 220px)` | 500 | −0.045em | 0.92 |
| h1 | 72px desktop / 44px mobile | 500 | −0.035em | 1.0 |
| h2 | 44px / 32px | 500 | −0.03em | 1.05 |
| h3 | 28px / 22px | 500 | −0.025em | 1.1 |
| Lede | 18px | 400 | −0.01em | 1.5 (max-width 56ch) |
| Body | 15px / 14px mobile | 400 | 0 | 1.55 |
| Eyebrow mono | 11px uppercase | 500 | 0.14em | — |
| Micro mono | 10px uppercase | 500 | 0.16em | — |

Display weights lean on 500 (medium) not 700 (bold) — the same move Apple's marketing site makes. True bold (700) is reserved for the bracketed word inside a display line, so the bracket reads with emphasis against the medium-weight ambient type.

## Signature — the legibility bracket

Every Flintmere surface carries at least one moment where a key word is set inside 1px-ink hairline brackets in Geist Mono, as if extracted and held up for inspection by an agent.

### Spec

- **Brackets**: `[` and `]` in Geist Mono, same weight and size as the bracketed word.
- **Bracketed word**: Geist Mono, weight 700 (the only place 700 appears on paper surfaces).
- **Ambient text**: Geist Sans, weight 500 for display, 400 for body.
- **Spacing**: `0.25em` space inside the brackets on each side. No space outside.
- **Colour**: `--ink` on `--paper`, `--paper` on `--ink`. The bracket never carries the accent.
- **Underline tick** (optional, display scale only): a 1px `--accent` sulphur hairline under the bracketed word, 2px long, centred. Used once per page max, scanner surface only.

### Examples across surfaces

```
Marketing hero    Your product catalog is [ invisible ] to ChatGPT.

Marketing pillars [ 01 ] Identifier completeness
                  [ 02 ] Attribute completeness
                  [ 03 ] Title and description quality

Scanner input     [ https://your-store.com ]

Scanner score     [ 64 ] / 100

App issue         Missing [ GTIN ] on 412 products

Wordmark (dark)   Flint[ mere ]

Email report      [ Flintmere Report · Jun 2026 ]
```

### Rules (Noor's veto, #8)

- Brackets must be **structural markup**, not decoration. Every bracketed word must correspond to a meaningful extractable token: a noun, a number, an identifier, a URL, a score.
- **Never** bracket verbs, articles, or filler words.
- **One bracket moment per section. Two per page maximum.** More than two and the signature becomes decoration.
- Screen readers announce `[` and `]` as "left bracket" / "right bracket". On headings that's acceptable (the bracket is part of the sentence). On interactive elements (buttons, links), hide brackets from AT with `aria-hidden="true"` wrappers and pass the clean text via `aria-label`.
- The bracketed word must be readable **without** the brackets. If removing the brackets breaks comprehension, the sentence is wrong, not the bracket.

### What the bracket is NOT

- Not a chip, pill, or tag. Those still exist as primitives — bracket tokens are typographic, not UI chrome.
- Not a code block. Code uses `<code>` with mono face; brackets use a typographic rhythm around a highlighted noun.
- Not a frame decoration. Do not bracket headings purely to "add visual interest."

## Corners, surfaces, motion floors

- **Corners sharp.** No `border-radius` except on circular gauges (score-ring), avatars (if introduced), toggle handles.
- **No shadows.** Separation via 1px `--line` hairline. Apple-bold does not use drop shadows.
- **No gradients** except the conic-gradient that renders score rings.
- **No blur, no glass.** Opaque surfaces only.
- **Motion:** opacity + transform only. Never animate `width/height/top/left`. Every animation has a `prefers-reduced-motion` branch that disables movement and preserves meaning.

## Inversion

Paper → ink token swap for dark sections (email gate, hero over-inverted moments, Shopify-app sidebar):

| Paper | → Ink |
|---|---|
| `--paper` (bg) | `--ink` |
| `--ink` (body text) | `--paper` |
| `--mute` (meta, paper) | `--mute-inv` |
| `--line` | `--line-dark` |
| `--accent` sulphur | unchanged (demoted — only on scanner, both canvases) |

## Surface-specific notes

- **Marketing (flintmere.com)** — paper `--paper`, type-led, zero sulphur, one bracket per section. Brackets carry the emphasis that sulphur carried in the original wireframes.
- **Scanner (audit.flintmere.com)** — paper default, but sulphur *is* allowed here (score ring, progress bars, severity high). The scanner is the diagnostic surface — sulphur reads as "live data." Still one bracket per section minimum.
- **Shopify app (app.flintmere.com)** — Polaris is the host chrome; Flintmere's score card, pillar cells, and Channel Health widget render as **a Flintmere island inside a Polaris sea**. Brackets appear on issue titles and the score header. Sulphur is OK on the score-ring only; everywhere else inside the app uses Polaris greens/yellows.

## Proposing a new token

Every new token goes through the `design-token` skill. Proposal carries:

- Name + hex + surface
- Contrast check at every size it appears
- Canon fit (hybrid-Apple-bold; there is no other canon)
- Replaces what (if anything)
- Migration plan

Council review: Maren (visual), Kael (systems), **Noor (AA, veto)**. Ad-hoc hex does not ship.

## Retired (do not use)

Everything from the inherited allowanceguard Ledger canon is **retired**. Do not reference in code, skill copy, or new memory:

- `bg-paper-deep`, `bg-oxblood`, `bg-cream`, `text-amber-deep`, `text-crimson-paper`, `text-ink-blue`
- `font-fraunces`, `font-plex`, `font-space-grotesk` (yes, Space Grotesk from the first Flintmere draft is retired too)
- `.ledger-rule`, `.deckle-top`, `.deckle-bottom`, `.grain`, `.paper-card`, `.dotted-leader`, `.glass-*`
- The word "approved." as a protected moment
- Caveat / margin-note aesthetic (was in the wireframes; dropped in the hybrid)

## Changelog

- 2026-04-19: Canon selected — **neutral-bold (Apple-bold structure) with the legibility-bracket signature**. Palette: warm near-white + near-black, sulphur demoted to scanner-only. Fonts: Geist Sans + Geist Mono. Council decision: Maren/Kael/Noor approved signature; #12 Ecosystem endorsed neutral-bold over sulphur-everywhere for Shopify Plus buyer context; #22 Conversion cross-referenced bracket-as-emphasis A/B data. First authoritative statement.
