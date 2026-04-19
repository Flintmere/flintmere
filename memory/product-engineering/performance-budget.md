# performance-budget.md

Core Web Vitals, bundle budgets, and perf anti-patterns. **#17 Performance** owns this file. Thane (Design Council) holds the bundle veto on marketing surfaces.

Flintmere runs on a single Coolify droplet at launch (shared CPU — build variability is real). Budgets reflect that environment.

## Core Web Vitals targets

| Surface | LCP | CLS | INP | Notes |
|---|---|---|---|---|
| Marketing home (`flintmere.com`) | ≤ 2.0s | ≤ 0.05 | ≤ 200ms | Apple-bold posture — must feel premium-fast |
| Scanner (`audit.flintmere.com`) | ≤ 2.5s | ≤ 0.05 | ≤ 200ms | Public promise is "60 seconds for a score" — the page itself loads in under 2.5s |
| Shopify app dashboard | ≤ 3.0s | ≤ 0.10 | ≤ 300ms | Inside Shopify admin iframe — budget is generous but Polaris is already the weight |
| API responses (p95) | ≤ 500ms | — | — | Scanner scoring routes, app API routes |
| Scan-complete-to-results (wall clock) | ≤ 55s | — | — | Public promise is 60s; 5s buffer for email send |

Measured on real-user metrics (Sentry Performance / PostHog), not synthetic tests.

## Font budget (Geist)

- Both apps self-host Geist Sans and Geist Mono. No Google Fonts CDN at runtime.
- Subset: Latin + Latin-Extended only. No CJK, no symbols subset unless a surface needs them.
- `font-display: swap` on every face.
- Weight inventory: 400, 500, 700 (Sans) — 400, 500 (Mono). Five total files, woff2 only.
- Preload weight 500 Sans + weight 500 Mono on marketing and scanner; lazy-load 400 and 700.
- Total font weight on first paint: ≤ 120KB woff2 across both faces.

## Bundle budget

Canonical budget lives in `projects/flintmere/ARCHITECTURE.md` (Thane's savings log). This file is the reminder.

### Marketing / scanner

- First-load JS: ≤ 100KB gzipped per route. Every addition paid for by a removal.
- No Vanta, no WebGL, no heavy canvas. Hero is type; any illustration is inline SVG.
- Icons inline as SVG. Import from a file only if reused in ≥ 3 components.
- `/wireframes/` CSS is sketch only — the real CSS is hand-authored per app, not copied from the wireframes viewer.

### Shopify app

- Polaris is the host — ≤ 200KB gzipped as a shared budget including Polaris's shipped weight.
- Flintmere-specific JS on top of Polaris: ≤ 60KB gzipped per route.
- App Bridge is a peer dependency; don't bundle a second copy.

Measure before you ship: `pnpm build` and read the per-route JS size. Regression = justify.

## Runtime cost

- Server: API route p95 ≤ 500ms. Anything over 1s is a bug — debug with #34.
- Client: main-thread work on interaction ≤ 50ms. No synchronous heavy work in event handlers.
- Images: Next.js `<Image>` in the scanner with explicit dimensions. Remix app uses `<img>` with explicit `width`/`height` and `loading="lazy"` below the fold. Hero uses `fetchpriority="high"`.
- LLM calls (Haiku / Sonnet) happen in BullMQ workers, never in the request path. Workers enforce their own per-merchant concurrency.
- Bulk Shopify catalog operations are streaming (see `shopify-api-rules.md`). Memory ceiling per worker: 512MB resident.

## Anti-patterns (ban list)

- Animating `width`, `height`, `top`, `left`. Transform + opacity only.
- Loading entire icon libraries for one icon.
- Re-rendering a list on every parent state change (missing `key`, unmemoized children).
- `useEffect` that fetches on every mount without a cache. Use a Server Component fetch or a Remix loader.
- Importing server-only modules into client components.
- Blocking the render on a client-side network call when it could be a Server Component fetch or a Remix loader.
- Raw `<img>` in `apps/scanner/src/app/**`.
- Any Google Fonts CDN reference — self-host or drop.

## Coolify / droplet variability

The launch deployment is a Basic 2 vCPU / 8GB droplet — shared CPU. Build times can vary 2× between identical deploys. Rules:

- Pre-build Docker images in GitHub Actions where possible; Coolify pulls, not builds.
- Prisma `migrate deploy` runs on container start, never during build (build container can't reach the DB).
- Heavy enrichment is BullMQ work, not sync request processing. If a request needs >500ms of CPU, it's a queue candidate.
- Resize trigger: ~30 active paying merchants → Premium 4 vCPU / 8GB droplet (~$84/mo). Don't wait for outages.

## When perf regresses

1. Confirm the regression on real-user metrics, not synthetic tests.
2. Identify the commit. `git bisect` if unclear.
3. Decide: revert, optimise, or accept with tradeoff written down.
4. Log the incident in `incident-history.md` if it reached production.

## When the budget needs to change

Budget is not sacred; it is a forcing function. Change it via ADR (`projects/flintmere/decisions/`) with Thane's review. The ADR names what the new budget buys and what the tradeoff is.
