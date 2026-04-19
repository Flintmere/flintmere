# 0003 — Visual canon: neutral-bold hybrid with the legibility bracket

- **Status:** Accepted
- **Date:** 2026-04-19

## Context

Wireframes shipped from Claude Design in a specific aesthetic direction — "midnight / parchment / sulphur · Swiss modern · type-as-graphic" — using Space Grotesk, JetBrains Mono, Caveat for handwritten margin notes, paper-cream canvas, ink sidebar, and a strong sulphur (#D9E05A) accent throughout.

Operator flagged Apple's current marketing posture (large SF Pro display, neutral near-white + near-black, generous whitespace, one demoted accent) as an alternative direction worth considering. The operator prefers Council deliberation on canon choices.

Options considered:

- **A. Wireframes as shipped** — midnight/parchment/sulphur, Space Grotesk, sulphur-everywhere.
- **B. Apple-bold neutral** — stark near-white/near-black, one accent used sparingly, SF-Pro-family display. Generic-feeling if done badly; familiar to the Shopify Plus audience who lives in Linear/Vercel/Stripe.
- **C. Hybrid** — Apple-bold structural substrate with one Flintmere-specific signature element that is uniquely ownable.

Full Council review performed, captured in conversation memory.

## Decision

**Option C — hybrid.** Apple-bold structural substrate + **the legibility bracket** as the signature.

### Structural substrate

- **Palette:** warm near-white `#F7F7F4` (paper) + near-black `#0A0A0B` (ink). Sulphur `#D9E05A` **demoted** to scanner-surface-only (live-state diagnostics). No sulphur on marketing.
- **Typography:** Geist Sans (display + body) + Geist Mono (micro + bracket tokens). SIL OFL license, self-hosted. No Caveat, no Space Grotesk, no Fraunces.
- **Corners sharp. No shadows. No gradients.** One `conic-gradient` exception for score rings.
- **Spacing rhythm:** 1px ink hairlines as section separators, not whitespace gaps. Typographic rhythm, not an 8px grid.

### Signature: the legibility bracket

Every Flintmere surface carries at least one moment where a key word is set inside 1px ink hairline brackets in Geist Mono — as if extracted by an agent for inspection.

```
Marketing hero    Your product catalog is [ invisible ] to ChatGPT.
Scanner score     [ 64 ] / 100
App issue         Missing [ GTIN ] on 412 products
Wordmark (dark)   Flint[ mere ]
```

Full spec + rules live in `../../memory/design/tokens.md` §Signature.

## Rationale

### Council

- **#7 Visual designer** — the bracket is unique. Brackets-as-emphasis exist in academic writing but no SaaS uses them as a signature. We own it the moment we ship.
- **#5 Product marketing / #12 Ecosystem** — Shopify Plus buyers live in Linear/Vercel/Stripe. Apple-bold neutrals are their native dialect. Warm-editorial parchment would read "craft agency" to that audience.
- **#20 Brand copywriter** — declarative headlines gain anchor words without colour emphasis. The bracket does what italic or bold used to do, but with a product-truth meaning attached.
- **#22 Conversion copywriter** — bracketed nouns outperform on tested b2b patterns. The bracket pulls double-duty on CTA emphasis.
- **#11 Investor** — low-risk signature. Unlike sulphur-yellow, brackets don't age (will still read "machine-readable" in a decade).
- **#7 Visual + Noor (#8, veto)** — bracket must be structural markup, never decoration. One per section, two per page maximum. Screen-reader handled via `aria-hidden` wrapping + clean `aria-label` on interactive elements.
- **#1 Editor-in-chief** — scales from 280px hero to 11px chip. Nothing breaks typographically.
- **#17 Performance** — Geist is open source, self-hostable, small bundle when subset to Latin. Under 120KB woff2 for all weights.

### Rejected options

- **Wireframes as shipped**: sulphur-yellow is a decade-long bet that ages poorly (Mailchimp, Snapchat precedent). Parchment + sulphur signals "warm agency editorial," conflicts with the technical-tool positioning Flintmere needs for Shopify Plus.
- **Pure Apple-bold neutrals with no signature**: generic. Every YC company looks like this. Flintmere would have no distinctive moment at App Store thumbnail scale.

## Consequences

- `memory/design/tokens.md` is the canonical token statement (authored alongside this ADR).
- `memory/design/accessibility.md`, `components.md`, `motion.md` will be rewritten against this canon before design skills are invoked.
- Wireframes at `wireframes/` remain as reference sketches — they do NOT match the final canon (Space Grotesk, sulphur-heavy). Update the wireframe viewer (or replace it) once apps scaffold.
- Three surfaces have explicit surface-specific rules (`DESIGN.md` §Surfaces). The Shopify app is a "Flintmere island inside a Polaris sea" — Polaris primitives stay pure, Flintmere brand moments render in Flintmere's canon.
- All allowanceguard-era tokens (oxblood, amber-deep, crimson-paper, Fraunces, IBM Plex, Ledger utilities, Glass utilities) are retired. Code must not reference them.

## Rollout

Immediate. Tokens locked. Remaining design memory files (`accessibility.md`, `components.md`, `motion.md`) rewritten before first `apps/*/src/` code lands.

## Re-open conditions

- A/B test post-launch shows brackets materially hurt conversion on the marketing hero.
- A new signature element emerges organically from customer conversations (unlikely but possible).
- Apple ships a radically different direction that shifts the "neutral-bold" expectation in the b2b SaaS world.
- The bracket becomes widely adopted by another Shopify app before we establish it (lose-of-distinctiveness trigger).
