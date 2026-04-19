# performance-budget.md

Design's perf budget. Thane owns this file; it overlaps with `memory/product-engineering/performance-budget.md` (which owns the Core Web Vitals targets). This file is about **design decisions that affect perf**.

## The context

Vanta NET was removed from the homepage in the Ledger redesign. −180KB bundle. That savings is permanent unless re-argued via ADR with Thane's review.

This budget exists so every new design choice pays for itself or is paid for elsewhere.

## Per-surface bundle expectations

| Surface | JS budget (gzipped) | Image budget | Fonts |
|---------|---------------------|--------------|-------|
| Homepage | No net growth from current | Hero SVG inline; no raster above fold | Fraunces + Plex (subset) + Mono (small) |
| Marketing (blog, pricing, docs landing) | ≤ homepage | Hero WebP max; lazy below fold | Same families |
| Dashboard | Domain-specific; measured against app UX | Application-driven | Same families |
| Docs (content) | Lean — content should not ship heavy JS | Inline SVG preferred | Same families |

Measure with `pnpm build` and inspect per-route sizes. If a PR grows a route, the PR either pays with a removal or carries an ADR.

## Design moves that usually cost bundle

- Heavy animation libraries (Framer Motion, GSAP). Prefer CSS + minimal JS.
- Icon libraries (`lucide`, `heroicons`). Prefer inline SVG for surfaces using ≤ 5 icons.
- Font weight sprawl. Each added weight = one more font file. Prefer 2–3 weights per family.
- Raster imagery where SVG works.
- Scrollytelling / scroll-driven shaders.

## Design moves that usually pay for themselves

- Inline SVG icons in JSX (no library, no runtime cost).
- System fonts fallback before webfonts load (FOUT acceptable; FOIT is not).
- `.grain` as SVG noise (tiny, infinitely reusable).
- Letterpress shadows via CSS, no image.
- Paper textures via CSS gradient + SVG noise, no raster.

## Anti-patterns (banned unless individually approved)

- WebGL backgrounds on marketing surfaces.
- Vanta / Three.js / any canvas-heavy effect on homepage.
- Auto-advancing carousels on mobile (battery + perf + UX).
- Parallax on mobile.
- Hero video that autoplays.
- Custom scrollbars via JS (use CSS or accept the native scrollbar).
- Large SVG sprite sheets on first paint.

## When a design move wants to break the budget

Legitimate reasons exist. Process:

1. `design-*` skill proposes the move in a spec.
2. Spec includes: measured impact (pnpm build before/after), UX justification, alternative considered.
3. Thane reviews. Either approves with a removal pair, or rejects.
4. If rejected: the spec is revised with a lower-cost alternative.

## Interaction with motion

Motion is a perf cost too. See `motion.md` for rules. Short version: if an animation costs >2ms per frame on marketing, it's too expensive.

## When the budget needs to change

The budget is a forcing function, not a sacred number. Re-argue via ADR:

- `projects/allowanceguard/decisions/YYYY-MM-DD-design-budget-<change>.md`
- States the new budget, what buys it, what it buys.
- Thane review required.
- User approval required.

## Canonical measurement

- `pnpm build` per-route output = authoritative bundle size.
- Vercel Analytics real-user data = authoritative Core Web Vitals.
- Lighthouse local = directional signal, not authoritative.
