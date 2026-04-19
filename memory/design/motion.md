# motion.md

Motion spec + `prefers-reduced-motion` contract. Idris owns this file. Noor holds the VETO on anything that violates motion safety.

## Principles

- Motion is punctuation, not content. If the user can't understand the surface without the motion, the motion is hiding something.
- Sharp easing. No bouncy. No rubber-band.
- Choreographed entrances. Elements arrive in an order that reads top-to-bottom, left-to-right, primary-then-secondary.
- Scroll as revelation. Content earns the scroll; the scroll doesn't earn the content.
- One signature motion per surface. Not three.

## The reduced-motion contract (mandatory)

Every animation, transition, entrance, parallax, carousel, and amber glow must have a `@media (prefers-reduced-motion: reduce)` branch that:

- Disables or drastically shortens the animation.
- Keeps the end state visible. The reduced-motion user sees the final frame, not a blank.
- Does not remove functionality. A carousel still advances; the transition is instant instead of animated.
- Turns off the `.ledger-rule::after` amber glow.

Non-negotiable. Noor rejects any PR that animates without this branch.

## Easing tokens

Canonical values live in the tokens handbook (`docs/design-tokens-handbook.md` §11). Summary:

- `ease-editorial` — tight cubic-bezier, short duration (~240ms). Default for entrances.
- `ease-ledger` — slower, for signature moves (hero headline reveal).
- `ease-dismiss` — near-instant for close/exit, keeps the UX snappy.
- Never `ease-in-out` with long duration. That's the bouncy-trampoline feel we don't use.

## Duration tokens

- `duration-instant` — ≤100ms, micro-interactions (hover, focus)
- `duration-short` — 200–300ms, entrance of a single element
- `duration-medium` — 400–600ms, choreographed sequence (stagger)
- `duration-long` — 800ms+, signature moment (hero reveal). Rare.

Reduced-motion variant halves the duration at most; often sets to 0ms.

## Choreography patterns

### Homepage hero entrance

- Compass watermark fades in first (`duration-short`).
- Fraunces headline reveals (`duration-long`, `ease-ledger`).
- `.paper-card-raised` connected-wallet panel slides up (`duration-short`, `ease-editorial`, 200ms delay).
- Reduced motion: headline + panel appear instantly, no fade, no slide.

### Ledger rule amber glow

- `.ledger-rule::after` animates an amber glow on scroll-into-view.
- Not a distraction — a slow pulse, under `duration-medium`, 1s cycle, stopped after 2s.
- Reduced motion: `animation: none`.

### Scroll reveals (feature rows)

- Each row fades in + rises 8px when 40% visible.
- Stagger 60ms between rows.
- Reduced motion: rows visible immediately on mount.

### Testimonials carousel

- If a carousel exists: auto-advance pauses on hover, pauses on focus-within, and respects `prefers-reduced-motion` (no auto-advance at all under reduced).

## Bans (non-negotiable)

- No animation that moves more than 40px without a reduced-motion alternative.
- No horizontal scroll-jacking (pinning a section while scroll scrubs content).
- No infinite animations without a reduced-motion off-switch.
- No animating `width`, `height`, `top`, `left`. Use `transform` + `opacity`.
- No spring physics that exceed one oscillation on entrance.
- No autoplay video.
- No parallax on mobile (noise-to-signal ratio too low on small viewports).

## Specifying motion

Every new motion ships with a `design-motion` spec that names:

- What animates (element, property)
- Timing (duration, delay, easing token)
- Trigger (mount, scroll-into-view, hover, focus, keyboard activation)
- Reduced-motion variant (explicit — not "same but faster")
- Accessibility note (what the animation signals, whether a screen reader needs an alternative)

Spec output → `context/design/motion/<slug>.md`. Engineering implements; this skill does not write CSS.

## How motion fails the council

- Idris rejects: wrong easing family, motion without purpose, too-long duration on a frequent interaction.
- Noor VETOES: missing `prefers-reduced-motion` branch, focus ring hidden during animation, animation that hides content for >1s.
- Thane rejects: motion that costs >2ms per frame on marketing pages, triggering layout thrash, running offscreen.
- Sable rejects: motion that confuses task flow, adds latency to a primary action, or makes the surface feel "demo-y" rather than purposeful.

## Canonical sources

- Motion details in `projects/allowanceguard/DESIGN.md`.
- Easing / duration values in `docs/design-tokens-handbook.md` §11.
- Existing motion in `src/app/globals.css` (search for `@keyframes`, `@media (prefers-reduced-motion`).
