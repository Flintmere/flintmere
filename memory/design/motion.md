# motion.md

Motion spec + `prefers-reduced-motion` contract. **Idris** owns this file. **Noor (#8, veto)** blocks any animation without a reduced-motion branch on in-scope surfaces.

## Scope (revised 2026-04-26)

Two contracts run side-by-side, by surface:

- **Marketing surfaces** (`flintmere.com`) and the **scanner** (`audit.flintmere.com`) — soft contract. `prefers-reduced-motion` is honored via opacity/duration scaling at the global stylesheet level (one `@media` block in `globals.css` does most of the work). Individual animations do **not** require a separately-designed reduced variant. Motion budget is generous: Emil-Kowalski-spare physics, scroll-reveal sequences, hover scale, micro-interactions with weight. WCAG 2.3.3 still met.
- **Shopify app** (`app.flintmere.com`) — strict contract retained for Built-for-Shopify submission. Polaris owns most motion; Flintmere island components inherit Polaris's `prefers-reduced-motion` propagation. Brand-island micro-motion (ScoreRing fill, IssueRow state changes) MUST have an explicit reduced-motion branch that disables movement and preserves end-state meaning.

Why the split: BFS reviewers actively check reduced-motion behaviour inside the iframe. Marketing/scanner audiences are not gated on that submission. A blanket strict contract over-burdened design throughput on the conversion-critical surfaces; the soft contract reclaims that budget without dropping the WCAG floor.

The 2026-04-25 "wrong to apply to Shopify-app surfaces" note is **superseded** — the app keeps strict; only marketing + scanner soften.

## Principles

- **Motion is punctuation, not content.** If the user can't understand the surface without the motion, the motion is hiding something.
- **Sharp easing.** No bouncy. No rubber-band.
- **Choreographed entrances.** Elements arrive in an order that reads top-to-bottom, left-to-right, primary-then-secondary.
- **Scroll as revelation.** Content earns the scroll; the scroll doesn't scrub the content.
- **One signature motion per surface.** Not three.
- **Restrained, not absent.** Flintmere's neutral-bold posture demands considered motion — Emil-Kowalski-spare physics, type-led hierarchy, micro-interactions with weight (the sonner/vaul "everything has weight" quality). Hero parallax is still out. Ambient "breathing" UI is still out. Motion fires on state change or scroll-reveal, not on decoration. The marketing budget is generous; the bar for shipping a motion is "does this earn its frame?", not "is it possible to animate?".

## The reduced-motion contract (two tiers)

### Tier 1 — Marketing + scanner (soft contract)

A single global `@media (prefers-reduced-motion: reduce)` block in `globals.css` scales animation/transition durations toward zero (`0.01ms`). Individual components do **not** ship a hand-designed reduced variant. The end state remains visible because durations approach zero rather than the animation being suppressed.

What this still requires:
- End state must be visible (the post-animation frame is what `reduce` users land on — there is no "blank" or "loading-forever" trap).
- No component-level `@media (prefers-reduced-motion: reduce)` exception that overrides the global scale-to-zero. If a component animates, it inherits the global rule.
- No autoplay video, no infinite animations, no parallax (still banned — see §Bans). Those are independent of the soft contract.

### Tier 2 — Shopify app (strict contract, retained)

Every animation inside the Flintmere island must have a `@media (prefers-reduced-motion: reduce)` branch that:

- Disables or drastically shortens the animation.
- Keeps the end state visible. The reduced-motion user sees the final frame, never a blank.
- Does not remove functionality. Scan progress still shows current state; the transition is instant, not animated.
- Preserves meaning. A pill that transitions between states under reduced motion still changes colour/text, just without the fade.

Polaris primitives are exempt from the strict contract because Polaris ships its own `prefers-reduced-motion` handling.

Noor rejects any island-component PR that animates without this branch. Marketing/scanner PRs only need to confirm the global block in `globals.css` is intact.

## Easing tokens

| Token | Curve | Duration | Use |
|---|---|---|---|
| `--ease-sharp` | `cubic-bezier(0.4, 0, 0.2, 1)` | 180–240ms | Default for entrances, state changes, micro-interactions |
| `--ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | 120–160ms | Close, dismiss, exit — keeps UX snappy |
| `--ease-signature` | `cubic-bezier(0.22, 1, 0.36, 1)` | 400–600ms | **One use per surface** — the score-ring fill on scan completion |

Never `ease-in-out` with long duration. Never spring physics. Never bounce.

## Duration tokens

| Token | Range | Use |
|---|---|---|
| `--duration-instant` | ≤100ms | Hover, focus, ripple-equivalent |
| `--duration-short` | 180–240ms | Entrance of a single element, state change |
| `--duration-medium` | 300–400ms | Choreographed sequence (stagger across 3–5 items) |
| `--duration-signature` | 500–700ms | Score-ring fill animation — the one signature motion |

Reduced-motion variant: halves the duration at most; often sets to 0ms.

## Choreography patterns (Flintmere-specific)

### Scanner — URL submit → progress overlay

- User submits URL → overlay fades in (`--duration-short`, `--ease-sharp`).
- Progress log lines append one at a time (`--duration-instant` per line, stagger 120ms).
- On completion → overlay fades out, results fade in below (`--duration-short`).
- Reduced motion: overlay appears instantly; log lines render all at once; results swap instantly.

### Scanner — score reveal (the signature motion)

- Score-ring's `conic-gradient` animates from 0% to target percentage.
- Number counter counts up from 0 to final score, synchronised with the ring.
- Easing: `--ease-signature`. Duration: `--duration-signature` (~600ms).
- Reduced motion: ring renders at final percentage immediately; number renders at final value.
- **This is the one signature motion per scanner view.** No second flourish anywhere else on the page.

### Marketing — scroll reveals

- Each section fades in + translates up 8px when 30% visible.
- Stagger 80ms between sibling elements within a section.
- Easing `--ease-sharp`, duration `--duration-short`.
- Reduced motion: elements visible immediately on mount; no translate, no fade.

### Shopify app — state transitions

- Polaris owns most transitions (don't override).
- Flintmere-island state changes (score update, pillar score change, issue resolution): cross-fade in `--duration-short`.
- Queue progress bars update in `--duration-instant` on each poll — never animated over a long duration because real-time data needs to look real-time.
- Reduced motion: instant swaps.

### Bracket hover (if introduced)

- **Deferred.** The bracket is static. Hover-state emphasis might emerge from user testing; defer motion until then. The brackets do their work through typography, not movement.

## Bans (non-negotiable)

- No horizontal scroll-jacking (pinning a section while scroll scrubs content).
- No parallax on any surface.
- No infinite animations (ambient "breathing" UI, pulsing dots, spinning logos outside of genuine loading states).
- No animating `width`, `height`, `top`, `left`. Use `transform` + `opacity`.
- No autoplay video.
- No motion under `prefers-reduced-motion` except instant transitions between end states (enforced globally in `globals.css` for marketing/scanner; per-component for Shopify app).
- No "demo mode" animations that play on the landing page just because the page loaded — every motion has a trigger (mount, scroll-into-view, hover, focus, state change).

Lifted from the previous bans (intentional change 2026-04-26):
- ~~No animation that moves more than 40px without a reduced-motion alternative.~~ — superseded by the soft contract; marketing/scanner inherit global `reduce` scaling instead of per-animation alternatives.
- ~~No spring physics exceeding one oscillation.~~ — Emil-Kowalski spring physics permitted on marketing surfaces. Still no rubber-band, still no bouncy. One subtle overshoot is fine.

## Specifying new motion

Every new motion ships with a `design-motion` spec that names:

- **What animates** — element, property
- **Timing** — duration token, delay, easing token
- **Trigger** — mount, scroll-into-view, hover, focus, keyboard activation, state change
- **Reduced-motion variant** — explicit, not "same but faster"
- **Accessibility note** — what the motion signals, whether an alternative is needed for screen readers

Spec output lands in `context/design/motion/<slug>.md` (gitignored). Engineering implements.

## How motion fails the Council

- **Idris** rejects: wrong easing family, motion without purpose, too-long duration on a frequent interaction, motion that contradicts the "punctuation not content" principle.
- **Noor (#8, veto)** — missing `prefers-reduced-motion` branch, focus ring hidden during animation, animation that hides content for >1s, motion triggering vestibular reactions.
- **Thane (#17 Performance)** — motion that costs >2ms per frame, triggers layout thrash, runs offscreen, delays INP.
- **Sable** — motion that confuses task flow, adds latency to a primary action, makes the surface feel "demo-y" rather than purposeful.

## Canon alignment

This is a **quiet** motion vocabulary. Apple's marketing site uses less motion than, say, Linear or Stripe's product pages. Flintmere matches that posture. The bracket signature, the score-ring fill, the one-signature-per-surface rule — all mean motion should be rare and deliberate. When in doubt, static wins.

## Sources

- `tokens.md` — easing + duration token definitions (when apps scaffold)
- `accessibility.md` — reduced-motion veto rules
- `../../projects/flintmere/DESIGN.md` — surface-level motion constraints
