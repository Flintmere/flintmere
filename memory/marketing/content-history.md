# content-history.md

Append-only log of Flintmere content shipped. Prevents repetition and anchors the editorial calendar. Most recent at the bottom.

Format:

```
### YYYY-MM-DD — <asset title>

- Channel: <blog | linkedin | x | farcaster | newsletter | marketing site | pricing page | email series>
- Angle: <one line — which of the seven narrative anchors from BUSINESS.md this sits on>
- Surface(s): <where it lives>
- Result: <metric + date, added when known>
- Related claims: <entries in claims-register.md this content relies on>
```

## The seven narrative anchors (from `BUSINESS.md` §Positioning copy rules)

Every piece should sit on one of these. If a draft doesn't, question whether it belongs:

1. **The AI shopping shift is here** — 15× YoY growth, 5.6M stores auto-enrolled.
2. **Your catalog is invisible** — 40% of catalogs ignored by AI agents.
3. **The seven pillars** — what we score, why it matters.
4. **Before / after agentic commerce** — the paradigm change.
5. **Honest GTIN guidance** — we don't sell fake barcodes.
6. **Channel Health** — measured impact, not faith-based.
7. **Agency-friendly** — score your clients, improve their scores.

## Cornerstone content to ship (from SPEC §8.3, first 90 days)

1. "We audited 500 Shopify stores for AI readiness" — flagship data piece.
2. "Why 40% of Shopify catalogs are invisible to ChatGPT" — anchor SEO piece.
3. Vertical breakdowns (one per month): beauty, supplements, apparel, electronics, home goods.
4. "A Shopify merchant's guide to GS1 barcodes in the AI commerce era" — SEO + trust signal.
5. Shopify Catalog Mapping walkthrough.

Each becomes a log entry when shipped.

---

<!-- New entries appended below by writer / social / content-strategy skills after publication approval. -->

> **Status note (backfilled 2026-06-19).** The entries below are *produced* assets logged for repeat-avoidance. As of 2026-06-19 **none are confirmed published**: the three social carousels are rendered + QA-green + queued (not yet posted to any channel), and the blog seed is `draft:true` with a claim-review **REWRITE** verdict (the blog system is not yet built on `origin/main`). Each `Result:` records true status — promote it to a publish date + metric once the asset actually ships.

### 2026-06-11 — Blog seed: catalog readiness & the seven-pillar score (`catalog-readiness-scoring-explained`)

- Channel: blog
- Angle: Anchor #3 (the seven pillars — what we score, why it matters); secondary #5 (honest GTIN guidance)
- Surface(s): `apps/scanner/content/blog/catalog-readiness-scoring-explained.mdx` → `audit.flintmere.com/blog/catalog-readiness-scoring-explained`. Team voice (no individual byline, per BUSINESS.md public-framing rule).
- Result: **NOT shipped** — `draft:true`, un-discoverable. Claim-review 2026-06-11 verdict **REWRITE** (Claim 1: a fabricated merchant anecdote "1,800 / 1,140 / 660 … last month" must be recast as explicitly hypothetical or a real anonymised scan before un-gate). All other claims pass. Blog system not yet built on `origin/main` (plan: `context/plans/2026-06-10-blog-system.md`).
- Related claims: claims-register.md §"Pillar count — 7" (verified verbatim — names + weights 20/20/15/15/15/10/5), §"GTIN non-affiliation disclaimer", §"60-second scan promise". Pending register add: public-four = 55 / installed-three = 45 split.

### 2026-06-14 — "Ranks last" — post-launch free-scan push (`ranks_last`)

- Channel: instagram · x · bluesky · linkedin
- Angle: Anchor #2 (your catalog is invisible → free scan) on X/Bluesky/IG; anchors #5 + #6 (honest GTIN + measured impact) on LinkedIn
- Surface(s): IG carousel @flintmere.audit (5× 1080×1350, `maters/outputs/flintmere/ranks_last/`); X single (text + audit.flintmere.com OG card, no native image on free tier); Bluesky single (slides 1/3/4/5); LinkedIn text. Draft: `context/drafts/2026-06-14-social-ai-readiness-scan.md`.
- Result: produced, QA-green (dimensions · legibility · fact-check · novelty · style); queued — **not yet posted** as of 2026-06-19.
- Related claims: §"Pillar count — 7", §"60-second scan promise", §"GTIN non-affiliation disclaimer", §"Reversible fix window — 7 days". (The "~40% excluded" figure is anchor-#2 positioning, not a registered claim — confirm before any standalone use.)

### 2026-06-15 — "One feed, five surfaces" (`one_feed`)

- Channel: instagram · linkedin · bluesky
- Angle: Anchors #3 + #6 (one structured feed serves every AI surface — fix once, surface everywhere; measured impact). Trend-anchored to Google I/O 2026. New style move: `type-as-texture`.
- Surface(s): IG carousel @flintmere.audit (5 slides, `maters/outputs/flintmere/one_feed/`); LinkedIn ("pay once, not five times"); Bluesky (slides 1/2/4/5). Draft: `context/drafts/2026-06-15-social-one-feed-five-surfaces.md`.
- Result: produced, QA-green; queued — **not yet posted** as of 2026-06-19.
- Related claims: §"Pillar count — 7", §"60-second scan promise".

### 2026-06-16 — "The number" — extravagant monument-glyph carousel (`the_number`)

- Channel: instagram · bluesky
- Angle: Anchor #3 (your catalog already has an AI-readiness score — the seven pillars set it) + #2 (≈40% quietly excluded). Mode: `design-extravagant` (reference: Pentagram covers); new style move: `monument-glyph`.
- Surface(s): IG carousel @flintmere.audit (5 slides — glyphs ? · 40% · 7 · 60 · F], `maters/outputs/flintmere/the_number/`); Bluesky. Draft: `context/drafts/2026-06-16-social-the-number.md`.
- Result: produced, QA-green (zero style warnings); queued — **not yet posted** as of 2026-06-19.
- Related claims: §"Pillar count — 7", §"60-second scan promise". ("~40% excluded" = positioning, not a registered claim.)

## Changelog

- 2026-04-19: Adapted for Flintmere. Added seven narrative anchors from BUSINESS.md and cornerstone content queue from SPEC §8.3.
- 2026-06-19: Narrative anchor #3 "The six pillars" → "The seven pillars" (PR #79 6→7 migration). Backfilled the produced-content log (one blog seed + three social campaigns/carousels) in the documented format, with honest produced/queued/draft status per the note above — nothing here is confirmed-published as of 2026-06-19. Sources verified against `context/drafts/*`, `context/compliance/reviews/2026-06-11-blog-seed-catalog-readiness.md`, and `methodology-data.ts`.
