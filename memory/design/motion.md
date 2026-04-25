# motion.md

Motion spec + `prefers-reduced-motion` contract. **Idris** owns this file. **Noor (#8, veto)** blocks any animation without a reduced-motion branch on in-scope surfaces.

## Scope (corrected 2026-04-25)

This contract applies to **marketing surfaces** (`flintmere.com`) and the **scanner** (`audit.flintmere.com`) — surfaces where Flintmere designs the chrome end-to-end and owns the motion language.

It explicitly does **NOT** apply to the **Shopify app** (`app.flintmere.com`). Inside Shopify admin's iframe, Polaris owns the chrome and handles motion defaults (including reduced-motion) per Shopify's own accessibility commitments. Adding a custom Flintmere motion contract on top would (a) duplicate Polaris's behaviour, (b) confuse merchants who expect Shopify-admin-native motion patterns, and (c) violate the design-app-surface island rule ("Polaris primitives stay untouched"). The reduced-motion contract carried over from a different project and was wrong to apply to Shopify-app surfaces.

Brand-island components inside the Shopify app (ScoreRing fill, IssueRow, etc.) MAY have their own micro-motion, but they inherit Polaris's `prefers-reduced-motion` propagation rather than declaring their own contract.

## Principles

- **Motion is punctuation, not content.** If the user can't understand the surface without the motion, the motion is hiding something.
- **Sharp easing.** No bouncy. No rubber-band.
- **Choreographed entrances.** Elements arrive in an order that reads top-to-bottom, left-to-right, primary-then-secondary.
- **Scroll as revelation.** Content earns the scroll; the scroll doesn't scrub the content.
- **One signature motion per surface.** Not three.
- **Less is more.** Flintmere's neutral-bold posture demands restrained motion. No hero parallax. No ambient "breathing" UI. Motion fires when state changes, not as decoration.

## The reduced-motion contract (mandatory)

Every animation, transition, entrance, and progress indicator must have a `@media (prefers-reduced-motion: reduce)` branch that:

- Disables or drastically shortens the animation.
- Keeps the end state visible. The reduced-motion user sees the final frame, never a blank.
- Does not remove functionality. Scan progress still shows current state; the transition is instant, not animated.
- Preserves meaning. A pill that transitions between states under reduced motion still changes colour/text, just without the fade.

Non-negotiable. Noor rejects any PR that animates without this branch.

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

- No animation that moves more than 40px without a reduced-motion alternative.
- No horizontal scroll-jacking (pinning a section while scroll scrubs content).
- No parallax on any surface.
- No infinite animations (ambient "breathing" UI, pulsing dots, spinning logos outside of genuine loading states).
- No animating `width`, `height`, `top`, `left`. Use `transform` + `opacity`.
- No spring physics exceeding one oscillation.
- No autoplay video.
- No motion under `prefers-reduced-motion` except instant transitions between end states.
- No "demo mode" animations that play on the landing page just because the page loaded.

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
