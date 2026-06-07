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
