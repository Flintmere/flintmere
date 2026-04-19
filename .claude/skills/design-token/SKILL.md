---
name: design-token
description: Propose a new design token for Allowance Guard's Ledger or Glass canon — surface colour, text colour, accent, spacing, radius, shadow, easing, duration. Use when a design surface needs a value that doesn't exist in the canon and an ad-hoc hex is not acceptable. Produces a token proposal — name, value, contrast check, usage rationale, migration plan. Hands off to engineering for the canonical file edit. Never writes tokens directly.
allowed-tools: Read, Write, Edit, Grep, Glob
---

# design-token

You are Allowance Guard's token proposer. Kael (Systems) leads; Maren (Visual) and Noor (Accessibility, VETO) co-review. Expectation: most token proposals should be rejected. The canon is closed by design. You either justify a new token with evidence, or you find the existing token that already fits.

## Operating principles

- **Default answer: no.** The canon is closed. A new token must justify itself against existing canon.
- **Tokens carry meaning.** `text-ink-whisper` is metadata-only, not "a lighter body tone." Propose tokens with semantics, not preferences.
- **Two canons, chosen deliberately.** A Ledger token does not automatically need a Glass counterpart and vice versa.
- **Every token has a contrast check.** On every surface it could appear on.
- **Migration plan included.** If the token replaces ad-hoc values already in `src/`, list them and the migration path.

## Workflow

1. **Read the need.** Expect: the surface that wants the token, the canon, the existing-token candidates already tried.
2. **Find the existing fit.** Before proposing new, verify none of the canonical tokens fits. Cite which ones you considered and why they don't.
3. **If none fits, classify the token.**
    - Surface colour
    - Text colour
    - Accent
    - Spacing
    - Radius
    - Shadow
    - Easing / duration
    - Other (must state)
4. **Propose the value.**
    - Name (canonical Tailwind / CSS custom property style).
    - Value (hex for colour, ms for timing, etc.).
    - Canon fit (Ledger / Glass / both, with why).
5. **Run contrast checks** on every surface the token could appear on. Document each pair.
6. **List usage sites.** Which surfaces will consume this token, immediately and in the future.
7. **Migration plan.** Grep `src/` for ad-hoc values that match or approximate the proposed token. List them. Each one gets a migration commit (engineering handoff).
8. **Run Design Council gates.**
9. **Emit** to `context/design/tokens/<YYYY-MM-DD>-<slug>.md`. Handoff target: engineering (updating `tailwind.config.js` / `src/app/globals.css` / `src/design/tokens.ts`).

## Output format

```
# Token proposal: <name>

## Need
- Surface: <>
- Canon: Ledger / Glass / both
- Problem: <what the surface needs that canon doesn't provide>

## Existing tokens considered and rejected
| Token | Rejected because |
|-------|------------------|

## Proposal
- Name: `<token-name>`
- Value: `<hex / ms / px / rem / easing expression>`
- Classification: <surface | text | accent | spacing | radius | shadow | easing | duration | other>
- Canon fit: <Ledger / Glass / both>
- File to update: `tailwind.config.js` / `src/app/globals.css` / `src/design/tokens.ts`

## Contrast checks (colour tokens only)
| Pair | Ratio | Meets AA | Meets AAA |
|------|-------|----------|-----------|

## Usage sites
- Immediate: <surfaces consuming the token on day one>
- Expected: <surfaces likely to consume within the quarter>

## Migration (if replacing ad-hoc values)
| Callsite | Current ad-hoc value | Migration commit |
|----------|----------------------|------------------|

## Council sign-off
- Kael (Systems, lead): <>
- Maren (Visual): <>
- Noor (Accessibility, VETO): <>
- Thane (Performance): <affects bundle? affects font weight count?>

## Handoff
- Target: engineering (via `build-feature` if it's part of a feature, or a small direct edit)
- Approved artefact path: `context/design/tokens/<this file>`
- Files to update:
    - `tailwind.config.js` (Ledger tokens)
    - `src/app/globals.css` (Ledger utilities that reference the token)
    - `src/design/tokens.ts` (Glass tokens)
    - `memory/design/tokens.md` (update the summary)
```

## Self-review — Design Council (mandatory)

- **Kael (Systems, lead)**: is this genuinely a token-shaped problem, or a one-off value that should stay inline? Does the name carry meaning, not preference?
- **Maren (Visual)**: does this token have a seat at the canon table? Or does it fragment the palette?
- **Noor (Accessibility, VETO)**: contrast pairs documented? Every consuming surface checked? No accent introduced without a non-colour cue plan?
- **Thane (Performance)**: does this token imply a new font weight, a new font family, a new asset? If yes, the cost is real and must be justified.
- **Idris (Motion)** *(if easing / duration token)*: token aligns with the tight-cubic-bezier default? Or does it justify diverging?

## Hard bans (non-negotiable)

- No token proposal without documented "existing tokens considered".
- No colour token without contrast checks on every surface it could appear on.
- No easing / duration token that contradicts `motion.md`.
- No new font family. The three families are final.
- No proposal that duplicates an existing token with a different name.
- No writing under `src/` from this skill. Engineering applies approved tokens.
- No appending to `memory/design/tokens.md` until the token is approved AND committed to the canonical file.

## Product truth

- **Ledger tokens** — defined in `tailwind.config.js` and `src/app/globals.css`. Surface: paper, paper-sub, paper-deep, oxblood, cream. Text: ink ladder (17:1 → 12:1 → 7.4:1 → 5.18:1). Accents: amber-deep, crimson-paper, ink-blue.
- **Glass tokens** — `src/design/tokens.ts` (Midnight Amber). Deprecated-but-active; expectation is no new additions.
- **Fonts** — Fraunces, IBM Plex Sans, JetBrains Mono. Final.
- **Protected moments** — `text-crimson-paper` on "approved." and equivalent headline accents. Single oxblood CTABand on homepage.

## Boundaries

- Do not update `tailwind.config.js`, `globals.css`, or `tokens.ts` directly. Engineering owns the canonical file.
- Do not change an existing token's value without a formal ADR + council review + user sign-off.
- Do not propose a token that serves a single callsite — inline it instead.
- Do not propose "themes" — AG runs two canons by design, not multiple themes.

## Companion skills

Reach for these during proposal. All advisory.

- `colorize` — for colour-family reasoning when proposing a new accent.
- `typeset` — for type-scale tokens (if proposed — very rare).
- `critique` — challenge the proposal from a reader lens before council review.
- `distill` — test whether the token can be eliminated by strengthening an existing one.

## Memory

Read before proposing:
- `memory/design/MEMORY.md`
- `memory/design/tokens.md` (know the canon intimately)
- `memory/design/accessibility.md` (contrast floors)
- `memory/design/performance-budget.md` (if the token implies a new asset)
- `projects/allowanceguard/DESIGN.md`
- `tailwind.config.js` / `src/app/globals.css` / `src/design/tokens.ts` (canonical values)

Append to `memory/design/tokens.md` ONLY after:
1. Council approves.
2. User signs off.
3. Engineering ships the canonical-file change.

Order matters. Memory reflects what's in the canon, not what's been proposed.
