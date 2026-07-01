# incident-history.md

Append-only log of production incidents, root causes, and fixes. Owned by #34 Full-stack debugging engineer + #10 DevOps. Read before any change in an area with incident history — the past is evidence.

## Entry format

```
## YYYY-MM-DD — <short title>

- **Surface:** <what broke>
- **Severity:** <P0 | P1 | P2 | P3>
- **Duration:** <detected → resolved>
- **Impact:** <user-visible effect, rows affected, revenue impact if known>
- **Trigger:** <commit / deploy / external / traffic spike>
- **Root cause:** <one paragraph, no hedging>
- **Fix:** <what shipped, link to commit or PR>
- **Follow-ups:** <preventive work spawned by this incident, link to tickets>
- **Council review:** <which members convened, any new invariants>
```

## Rules

- Append-only. Do not edit past incidents; add a follow-up entry if new information surfaces.
- Log every P0 and P1. Log P2s that produced a root-cause lesson. Skip P3s unless the lesson is reusable.
- Entries written within 5 business days of resolution. Longer and memory degrades.
- Link to the post-mortem (longer form) when one exists. This file is the short, searchable index.

## Why this lives here

- Prevents repeating the same bug. Before touching a subsystem, grep this file.
- Surfaces drift. Repeated incidents in one area = missing test, missing rate limit, missing monitor.
- Feeds the council. New invariants that come out of incidents get promoted to `architecture-rules.md`, `security-posture.md`, or `performance-budget.md`.

## Log

<!-- Append entries below in reverse chronological order (newest first). -->

### 2026-06-22 — Cross-host `<Link>` prefetch throws "Failed to fetch RSC payload" on flintmere.com

- **Surface:** Marketing homepage (`flintmere.com`) — App Router `<Link>` prefetch on relative cross-host links. Browser console only; navigation unaffected.
- **Severity:** P3 (console noise + dead prefetch; every route still returns 200 and renders on click). Logged despite P3 — the root cause is a reusable production invariant.
- **Duration:** long-standing (predates the 2026-06-22 report) → root-caused 2026-06-22 → fixed 2026-07-01.
- **Impact:** a `Failed to fetch RSC payload … TypeError: Failed to fetch` error per relative cross-host `<Link>` prefetch on homepage load (`/audit#checkout` in the founder strip + concierge-bands copy). Visible to any visitor with DevTools open. Prefetch no-ops; clicks still full-navigate. No revenue/data impact.
- **Trigger:** not a deploy/commit regression — inherent to relative cross-host `<Link>`s since the two-host split.
- **Root cause:** the homepage prefetches *relative* cross-host `<Link>`s (`/audit#checkout`). Middleware 301-redirects them to `audit.flintmere.com`; a CORS-mode RSC prefetch cannot follow a cross-origin redirect without `Access-Control-Allow-Origin` → `Failed to fetch`. The middleware 204 `rsc-noop` carve-out (`01517fd`, in prod since 2026-05-05) was meant to intercept these but **is inert in production**: Next.js strips its internal RSC signals (`RSC` + `Next-Router-Prefetch` request headers, and the `_rsc` query param) before `middleware` runs, so `isRscPrefetch` always evaluates false. Proven by an instrumented `next start` build — middleware observed only `accept,host,user-agent,x-forwarded-*`, `_rsc` absent. The carve-out only ever worked in `next dev`, where the signals survive.
- **Fix:** `prefetch={false}` on the two live relative cross-host marketing `<Link>`s — `components/sections/FounderStrip.tsx` + `app/pricing/ConciergeBands.tsx`. Suppresses the doomed prefetch at the source (independent of proxy/Next behaviour); clicks still full-navigate. `MerchantCenterSection.tsx`'s `/audit/connect` link already emits an absolute URL via `crossHostHref` (Next doesn't prefetch external URLs) → already safe. `BandTriptych.tsx`'s `/pricing#concierge-bands` is a plain `<a>`, not a Next `<Link>` → no prefetch → safe. `SCAN_URL`/`AUDIT_URL` CTAs are absolute (safe); `/scan` links on score/bot/unsubscribe are same-host (safe).
- **Follow-ups:** the middleware cross-host RSC-prefetch carve-out (`rsc-noop` + `isRscPrefetchCrossOrigin`) is dead code in production — middleware cannot see RSC signals. Remove it, or, if server-side handling is wanted, detect via the surviving `Accept: text/x-component` header (the OPTIONS-preflight 204 keyed on `request.method` still works).
- **Council review:** #34 Full-stack debugging (root cause), #10 DevOps (Coolify/proxy model). #8 Noor unaffected (prefetch-only). **New invariant candidate for `architecture-rules.md`:** *middleware cannot reliably detect RSC/prefetch requests in production (Next strips `RSC`/`Next-Router-Prefetch` headers + the `_rsc` param); use `prefetch={false}` on relative cross-host `<Link>`s rather than a server-side carve-out.*

### 2026-06-07 — Homepage hero CTA amputated at short viewport heights

- **Surface:** `flintmere.com` homepage hero — primary "Run the scan" CTA
- **Severity:** P1 (primary conversion action invisible on the acquisition surface)
- **Duration:** shipped with the hero (2026-04-29 chapter rebuild) → detected 2026-06-07 (operator screenshot, 16:29) → fixed same day
- **Impact:** at desktop viewport heights below ~800px (windowed browsers, 13" laptops with docks), the hero section — locked to `lg:h-screen` with `overflow-hidden` — clipped its own text stack. Playwright repro at 1280×680: CTA bottom 88px past the section edge, 165px total overflow. Not below the fold: unreachable at any scroll position. Conversion impact unmeasured (Plausible→PostHog transition window).
- **Trigger:** fluid `clamp()` type tuned for tall viewports inside a fold-locked, hard-clipped container; no height-aware constraint.
- **Root cause:** the hero section hard-locked its height to the viewport (`lg:h-screen`) while clipping overflow (`overflow-hidden`). The content stack (5-line clamp h1 + lede + CTA + 2×96px padding) has a ~845px minimum height at 1280px width; any viewport shorter than that amputates the bottom of the stack, CTA first after padding. Fourth incident in the fold-locked/fluid-type clipping family (2026-05-02 bracket floor, 2026-05-11 bracket floor, 2026-06-06 connect-hero PR #65).
- **Fix:** `lg:h-screen lg:min-h-[640px]` → `lg:min-h-screen` on the hero section (`apps/scanner/src/app/page.tsx`) — fold-perfect when content fits, grows instead of clipping when it doesn't. Regression test `page.hero-fold.test.ts` (source-invariant; layout untestable in jsdom). Behavioural verification via Playwright at 1280×680 pre/post.
- **Follow-ups:** (1) mobile branch keeps `max-lg:h-[100svh]` — same lock, but the text column is `absolute` so `min-h` alone won't fix it; cousin risk at short landscape viewports, needs its own pass. (2) Four incidents in one family ⇒ `design-system-audit` should sweep every `h-screen`/`h-[100svh]` + `overflow-hidden` co-occurrence and every display-scale `clamp()` against a 680px height floor.
- **Council review:** #34 (root cause: height-lock + clip, not the type scale per se), #16 (regression test fails pre-fix, 636/636 post-fix), #15 (one-class diff; mobile cousin deferred deliberately), #6 conversion lens (primary CTA on the acquisition surface = P1, not P3 cosmetic).
