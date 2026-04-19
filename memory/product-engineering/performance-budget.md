# performance-budget.md

Core Web Vitals, bundle budgets, and perf anti-patterns. #17 Performance owns this file. Thane (Design Council) holds the bundle veto on marketing surfaces.

## Core Web Vitals targets

| Surface | LCP | CLS | INP |
|---------|-----|-----|-----|
| Homepage (Ledger canon) | ≤ 2.0s | ≤ 0.05 | ≤ 200ms |
| Marketing pages (blog, pricing, docs) | ≤ 2.5s | ≤ 0.10 | ≤ 200ms |
| Dashboard (glass canon) | ≤ 3.0s | ≤ 0.10 | ≤ 300ms |
| API responses (p95) | ≤ 500ms | — | — |

Measured on: Vercel Analytics / real-user metrics, not synthetic tests.

## Bundle budget

Canonical source: `projects/allowanceguard/DESIGN.md` (Thane's savings log). This file is the shorter reminder.

- Homepage critical CSS + JS: no net growth. Every addition paid for by a removal.
- Marketing pages: no Vanta, no WebGL, no heavy canvas. Hero is SVG.
- Dashboard: glass canon utilities only; no duplicated Tailwind base.
- Icons: inline SVG preferred; import from a file only if reused in ≥3 components.

Measure before you ship: `pnpm build` and read the per-route JS size. If it grew, justify.

## Runtime cost

- Server: API route p95 ≤ 500ms. Anything over 1s is a bug. Debug with #34.
- Client: main-thread work on interaction ≤ 50ms. No synchronous heavy work in event handlers.
- Images: Next.js `<Image>` with explicit width/height. No raw `<img>` in `src/app/`. Hero imagery uses `priority`; below-fold lazy-loads.

## Anti-patterns (ban list)

- Animating `width`, `height`, `top`, `left`. Transform + opacity only.
- Loading entire icon libraries for one icon.
- Re-rendering a list on every parent state change (missing `key` or unmemoized children).
- `useEffect` that fetches on every mount without a cache. Use the route handler + cache headers.
- Blocking the render on a client-side network call when it could be a Server Component fetch.
- Importing server-only modules into client components ("use client" + node built-in = build error or worse).

## When perf regresses

1. Confirm the regression: compare before/after on real-user metrics, not synthetic.
2. Identify the commit. `git bisect` if unclear.
3. Decide: revert, optimise, or accept with tradeoff written down.
4. Log the incident in `incident-history.md` if it reached production.

## When the budget needs to change

The budget is not sacred; it is a forcing function. Change it via ADR (`projects/allowanceguard/decisions/`) with Thane's review. The ADR names what the new budget buys and what the tradeoff is.
