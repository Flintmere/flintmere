# performance-budget.md

Design's perf budget. **Thane (#17 Performance)** owns this file; it overlaps with `memory/product-engineering/performance-budget.md` (which owns the Core Web Vitals targets). This file is about **design decisions that affect perf**.

## The context

Flintmere's three surfaces (marketing, scanner, Shopify app) each have distinct budgets. The Shopify app iframe is already heavy with Polaris; we add Flintmere islands on top. The scanner is public + must load fast to honour the 60-second scan promise. The marketing site is Apple-bold in spirit — which means typography carries the work imagery would carry elsewhere, and the bundle stays lean as a consequence.

This budget exists so every new design choice pays for itself or is paid for elsewhere.

## Per-surface bundle expectations

| Surface | JS budget (gzipped per route) | Image budget | Fonts |
|---|---|---|---|
| Marketing (`flintmere.com` inside scanner app) | ≤ 100KB | Photoreal hero ≤ 100KB AVIF; product screenshots ≤ 40KB AVIF each; inline SVG for diagrams. Total raster ≤ 220KB per page. (Updated 2026-04-26 — line-art-only mandate retired; see `tokens.md` §Imagery.) | Geist Sans (400/500/700) + Geist Mono (400/500), self-hosted, Latin subset |
| Scanner (`audit.flintmere.com`) | ≤ 100KB | Inline SVG for score ring + pillar marks; raster screenshots permitted on results / score pages within marketing budget if used. | Same |
| Shopify app (`app.flintmere.com` — Flintmere-island-only) | ≤ 60KB on top of Polaris | Inline SVG; no image-based icons | Same |
| Shopify app (Polaris baseline, shared budget ceiling) | ≤ 200KB (including Polaris itself) | — | — |

Measure with `pnpm build` + inspect per-route output. If a PR grows a route, the PR either pays with a removal or carries an ADR.

## Design moves that usually cost bundle

- Heavy animation libraries (Framer Motion, GSAP). Prefer CSS + minimal JS for Flintmere's restrained motion vocabulary.
- Icon libraries (`lucide`, `heroicons`). Prefer inline SVG for surfaces using ≤ 5 icons.
- Font weight sprawl. Flintmere uses 400 / 500 / 700 Sans + 400 / 500 Mono — five files total. Adding a sixth requires an ADR.
- Raster imagery where SVG works.
- Chart libraries on the Channel Health widget (use CSS + mono-Geist numerals where possible).
- Scrollytelling / scroll-driven shaders.

## Design moves that usually pay for themselves

- Inline SVG icons in JSX (no library, no runtime cost).
- System fonts fallback before Geist loads (FOUT acceptable; FOIT is not).
- Self-hosted Geist — one HTTP hop, cached, no third-party CDN dependency.
- Conic-gradient for the score ring (no image, no canvas).
- Typography-as-image — giant Geist display replaces the hero imagery cost entirely.
- Dashed `repeating-linear-gradient` placeholders for "locked" states (no image).

## Anti-patterns (banned unless individually approved)

- WebGL backgrounds on any surface.
- Vanta / Three.js / any canvas-heavy effect.
- Auto-advancing carousels on mobile (battery + perf + UX).
- Parallax on mobile.
- Hero video that autoplays.
- Custom scrollbars via JS.
- Large SVG sprite sheets on first paint.
- Google Fonts CDN at runtime (self-hosted Geist only).
- Polaris "wrappers" that duplicate Polaris's primitive styles inside the Shopify app.

## When a design move wants to break the budget

Legitimate reasons exist. Process:

1. `design-*` skill proposes the move in a spec.
2. Spec includes: measured impact (`pnpm build` before / after), UX justification, alternative considered.
3. Thane reviews. Either approves with a removal pair, or rejects.
4. If rejected: spec revised with lower-cost alternative.

## Interaction with motion

Motion is a perf cost too. See `motion.md` for rules. Short version: if an animation costs >2ms per frame on marketing, it's too expensive. Flintmere motion is deliberately quiet, which keeps the bundle + frame budget healthy.

## When the budget needs to change

The budget is a forcing function, not a sacred number. Re-argue via ADR:

- `projects/flintmere/decisions/NNNN-design-budget-<change>.md`
- States the new budget, what buys it, what it buys.
- Thane review required.
- Operator approval required.

## Canonical measurement

- `pnpm -F scanner build` / `pnpm -F shopify-app build` per-route output = authoritative bundle size.
- PostHog + BetterStack real-user metrics = authoritative Core Web Vitals.
- Lighthouse local = directional signal, not authoritative.
- LLM-driven enrichment does not affect bundle; see `memory/product-engineering/performance-budget.md` for runtime (worker) cost tracking.

## Changelog

- 2026-04-26: Marketing surface raster image budget added (hero ≤ 100KB AVIF, product screenshots ≤ 40KB AVIF, total ≤ 220KB per page). Aligns with the 2026-04-26 canon shift in `tokens.md` §Imagery and DESIGN.md law #1 ("type leads, imagery proves"). Line-art-only rule retired.
- 2026-04-19: Rewritten for Flintmere. Replaced allowanceguard font list (Fraunces + Plex + Mono) with Geist Sans + Geist Mono (five weight files total). Three-surface bundle table (marketing / scanner / Shopify app) replacing the two-canon (homepage / docs) allowanceguard split. Noted Polaris as the shared Shopify-app budget baseline.
