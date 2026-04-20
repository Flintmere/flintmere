# 0007 — Canon amber signature + sulphur retired

- **Status:** Accepted
- **Date:** 2026-04-20
- **Supersedes (partial):** `0003-canon-neutral-bold-bracket.md` on the *colour axis and wordmark only*. The bracket signature, Geist type stack, warm-paper + near-black structure, Apple-bold scale, and the "no shadows / sharp corners / 1px hairlines" rules from 0003 remain authoritative.

## Context

Operator directive: adopt **Glowing Amber `#F8BF24`** as a portfolio signature across Flintmere and adjacent products. The existing canon (0003) demoted sulphur `#D9E05A` to scanner-only and left the brand carrier on the bracket alone. Operator's rationale: cross-portfolio memorability; amber is a through-line that ties the operator's work together, intentionally chosen as a personal-brand asset.

Council convened to determine the best implementation — preserving the parts of 0003 worth preserving while adopting amber as the brand colour across all three surfaces.

Options considered:

- **A.** Amber only, drop moss green, keep warm paper + ink, retire sulphur, adopt asymmetric `Flintmere]` wordmark.
- **B.** Full Gemini-sheet adoption (amber + moss + Tailwind slate + 3D cube + asymmetric wordmark + tagline lockup).
- **C.** Amber layered over existing sulphur (two accents, two yellow-adjacent tokens).
- **D.** Amber scoped to wordmark only; sulphur stays as the scanner accent.

## Decision

**Option A.** Amber is the sole accent across all surfaces. Sulphur is retired. The wordmark is asymmetric.

### Palette

| Token | Hex | Role |
|---|---|---|
| `--paper` | `#F7F7F4` | Canvas, unchanged. Warm near-white. |
| `--paper-2` | `#EDECE6` | Secondary surface, unchanged. |
| `--ink` | `#0A0A0B` | Body text, dividers, dark canvas. Unchanged. |
| `--accent` | `#F8BF24` | **Glowing Amber.** Sole accent across marketing, scanner, and Shopify-app island. Replaces sulphur `#D9E05A`. |
| `--accent-ink` | `#0A0A0B` | Ink stays the only foreground on top of amber (contrast ≈ 11:1, AAA). The `.btn-accent` primitive needs no logic change — `var(--color-accent-ink)` was already ink. |

Retired: sulphur `#D9E05A` / `--accent` (old). Moss green, Tailwind slate, and the 3D cube iconography from the proposal sheet remain rejected (see `memory/design/tokens.md` §Rejected brand-asset patterns).

### Amber usage rule (Noor's floor)

Amber is an accent, not a text colour on paper. Contrast on `--paper` ≈ **1.7:1**; on `--ink` ≈ **11:1**.

**Allowed on `--paper`:**
- Graphic fills — score-ring, pillar progress bars, severity-high dot, chip fills, icon fills, focus-ring shapes
- Display type ≥ 48px (where glyph thickness compensates; not the default)
- Bracket under-tick hairline on once-per-page hero moments
- Outlined (ink-text-on-paper with amber border) chips / pills

**Never on `--paper`:**
- Body text (14–16px)
- Meta text, captions, eyebrows, timestamps
- Links inline with body copy
- Small CTA text (use ink-text-on-amber-fill instead)

**Allowed on `--ink`:**
- All text roles (AAA-level contrast)
- All graphic roles

### Wordmark

**Adopted:** `Flintmere]` — asymmetric closing bracket.

- **Face:** Geist Sans, weight 500, letter-spacing −0.02em. Title case. The `]` is Geist Mono at the same optical size as the Sans letters.
- **Colour:** Monochrome. `--ink` on `--paper`, `--paper` on `--ink`. Never amber as the whole mark. Amber may appear as an optional hero-scale under-tick hairline beneath the word "Flintmere."
- **Sizing:** Scales with the surrounding h-scale. No fixed logo height.
- **Clear space:** One capital-height of `--paper` on all sides.
- **Favicon:** The letter `F` in Geist Sans 500, sharp corners, ink on paper. No rendered imagery until a line-art glyph is commissioned via `design-component` with Maren + Noor.
- **Screen readers:** `aria-label="Flintmere"` on the wordmark element; wrap the `]` span with `aria-hidden="true"` so SR announces "Flintmere," not "Flintmere right bracket."

The bilateral `[ word ]` extraction signature remains for all other page-level brand moments on nouns in content (scores, identifiers, key words). The two roles now separate cleanly:

- **Wordmark `Flintmere]`** — the brand-as-noun; the extracted result.
- **Signature `[ word ]`** — the act of extraction, performed on page content.

### Rejected from the Gemini sheet (reaffirmed)

- **Core Moss Tech green** — canon is one accent.
- **Tailwind `slate-*` neutrals** — canon is warm paper + near-black. Slate runs cool and reads generic-SaaS.
- **3D isometric cube iconography** — violates law #1 ("Type is the image"); reads web3.
- **Tagline lockup inside the wordmark** ("AI-AGENT READINESS PLATFORM") — descriptor lives in metadata + page copy.

## Rationale

### Council

- **Maren (visual)** — amber on warm paper is a distinctive portfolio through-line. Amber on slate is generic. Warm paper keeps the editorial-technical dialect that separates Flintmere from pure-white Linear/Vercel.
- **Kael (systems)** — one accent, one palette, one wordmark form. Retiring sulphur removes a token. `--accent-ink` stayed `#0A0A0B` under the old sulphur rule too — amber inherits the same foreground constraint, so shipped components need no logic change.
- **Noor (#8, veto)** — amber is safe as the sole accent *if and only if* the "no amber for small text on paper" rule is codified and enforced. Accessibility is preserved, not compromised. Amber-fill + ink-text CTAs pass AAA.
- **#11 Founder voice** — portfolio signature is a founder-level positioning call. Amber across the operator's products compounds brand memory.
- **#12 Ecosystem (Shopify Plus)** — warm-paper + amber still differentiates from Polaris. Amber only appears in the Flintmere island (score-ring, bracket under-tick), never on Polaris primitives.
- **#22 Conversion** — one-colour brands out-perform multi-colour brands on recall tests. Amber-as-anchor is a recall asset.
- **#17 Performance** — no bundle impact. One hex swap. No new fonts, no new imagery.

### What we give up from 0003

- The anti-sulphur-yellow argument ("sulphur ages like Mailchimp/Snapchat"). Amber carries some of the same risk. Mitigation: amber is never a large field — it appears as under-tick hairlines, score-ring fills, dots, small graphic accents. The eye mostly sees paper + ink; amber is punctuation.
- The argument that "the bracket doesn't age, colour accents do." Still partially true — the bracket remains the structural signature. Amber is used sparsely and primarily on scanner-diagnostic surfaces + small brand moments.

## Consequences

- `memory/design/tokens.md` — §Palette §Accent §Signature §Wordmark §Inversion §Surface-specific §Rejected patterns §Retired §Changelog updated.
- `projects/flintmere/DESIGN.md` — §Surfaces §Laws §Tokens §Forbidden §Island rule updated. Amber removed from the forbidden list; sulphur added to retired.
- `memory/design/accessibility.md` — contrast ladder updated (amber row replaces sulphur row; amber-on-paper insufficient-for-text note added).
- `memory/design/components.md` — `Dot`, `StatNumber`, `ScanProgressOverlay`, `EmailGate`, island-rule line updated; "sulphur" → "amber."
- `memory/marketing/imagery.md` — accent line updated.
- `CLAUDE.md` — canon hygiene line + surface-specific reminders updated. The retired-colours list gains sulphur; amber is no longer forbidden.
- `apps/scanner/src/app/globals.css` — `--color-accent: #f8bf24` (was `#d9e05a`).
- `apps/scanner/src/app/page.tsx` — nav wordmark rendered as `Flintmere]` with `aria-hidden` span on `]`.
- `apps/scanner/src/lib/report-email.ts` — hardcoded `#D9E05A` in email CTA → `#F8BF24`.
- `apps/shopify-app/app/routes/_index/route.tsx` — hardcoded `#d9e05a` → `#f8bf24`.
- `apps/scanner/src/components/EmailGate.tsx` — canon comment updated (sulphur → amber).

Wireframes at `wireframes/` remain as historical sketches (already flagged in 0003 as not matching canon). No changes there.

## Rollout

Immediate. One-shot rewrite in a single commit. No migration needed — no amber-user-visible surface has shipped to production yet (apps are pre-launch, operator-gated).

## Re-open conditions

- Amber-on-paper contrast regressions surface anywhere post-launch (any text-on-paper appearance of amber that wasn't intended).
- Portfolio direction changes — operator pivots to a different family colour across products.
- A direct Shopify competitor adopts near-identical amber-on-warm-paper branding before Flintmere establishes its claim (distinctiveness-loss trigger, same re-open as the bracket in 0003).
- Noor catches a body-text amber usage in the wild that codified rules failed to prevent — we'd need to either tighten the rules or reconsider the signature.
