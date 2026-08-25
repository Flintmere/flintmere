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

### 2026-07-27 — Week of 28 Jul: five text posts, no carousel (`consistency-pillar` · `silent-drop` · `free-four-pillars` · `food-fields` · `bestseller-worst-data`)

- Channel: x · bluesky (cross-post — `channel` omitted, 5 posts → 10 rows queued)
- Angle: five distinct anchors, all fresh vs the spent set (ranks_last, one_feed, the_number, gtin_truth, still_listed, agentic-shift week of 07-07, stocked_early). Tue #3 Consistency pillar deep-dive · Wed #6 silent channel rejection (no feedback loop) · Thu #3 honesty about scan scope (four public pillars vs three install-gated) · Fri #3 food-vertical fields (net weight, unit price, allergens, storage — no regulatory claim asserted) · Sat #2 the bestseller carries the worst data.
- Surface(s): prod social queue via `POST /api/agent/queue-posts` (HTTP 200, `queued: 10`). Fire times 10:00 BST Tue 28 Jul → Sat 1 Aug. Payload lived in the session scratchpad only, not committed.
- Result: queued — **not yet posted** as of 2026-07-27. **No carousel this week**: `/Users/abuaa/Projects/Maters` does not exist on this machine, so the imagine/art-director flow could not run and no visual set was produced. Text pipeline unblocked per the standing rule.
- Related claims: §"Pillar count — 7" + canon-source-register §A9 (public four = Identifiers/Titles/Consistency/Crawlability = 55%; install-gated three = Attributes/Mapping/Checkout eligibility = 45% — the Thu post states this split verbatim), §"60-second scan promise", §"free scan needs no install". No GTIN claim used (angle spent 2026-07-04); no AI-ranking outcome claimed on any post.

### 2026-08-10 — Week of 11 Aug: five text posts, no carousel (`titles-parse` · `variant-consistency` · `record-the-before` · `crawlability-gate` · `agency-scorecard`)

- Channel: x · bluesky (cross-post — `channel` omitted, 5 posts → 10 rows queued)
- Angle: five fresh anchors, GTIN deliberately avoided (spent 2026-07-04 and re-used by the 2026-08-04 run, whose two GS1/GTIN posts fire 10 Aug). Tue #3 Titles pillar — the storefront title vs the title a channel can parse · Wed #2 the product passes but the variants don't (Consistency) · Thu #6 record the before, because channels re-read on their own schedule · Fri #3 Crawlability is 5% and gates the other six · Sat #7 agency angle, first use on social (audiences.md §3 hook).
- Surface(s): prod social queue via `POST /api/agent/queue-posts` (HTTP 200, `queued: 10`). Fire times 10:00 BST Tue 11 Aug → Sat 15 Aug. Draft: `context/drafts/2026-08-10-social-week-titles-variants-crawlability.md`; payload scratchpad-only, not committed.
- Result: queued — **not yet posted** as of 2026-08-10. **No carousel again**: `/Users/abuaa/Projects/Maters` is still absent on this machine (same as 2026-07-27), so no visual set and no IG hand-off. Text pipeline unblocked per the standing rule.
- Related claims: canon-source-register §A9 + `flintmere.com/methodology` — Titles 15% public, Consistency 15% public, Crawlability 5% public, four public pillars = 55% (Tue/Wed/Fri/Sat state these verbatim), §"60-second scan promise", §"free scan needs no install". No GTIN claim; no AI-ranking or sales outcome claimed on any post.

### 2026-08-17 — Week of 18 Aug: five text posts, no carousel (`attributes-structured-fields` · `mapping-wrong-shelf` · `checkout-eligibility-gate` · `parser-reads-fields` · `new-lines-thinnest-data`)

- Channel: x · bluesky (cross-post — `channel` omitted, 5 posts → 10 rows queued)
- Angle: the three install-gated pillars, none of which had ever carried a social post, plus two catalog-reality cuts. Tue #3 Attributes 20% — allergens as structured fields vs description prose, and honest that the free scan can't read it without the app · Wed #3 Mapping 15% — the category is the shelf ("Beverages > Coffee" vs "Pantry > Coffee") · Thu #3 + #6 Checkout eligibility 10% — found ≠ bought (shipping origin, tax registration, age restriction, alcohol licensing) · Fri #4 first social use of the before/after anchor — the first reader is a parser, not a person · Sat #2 new lines ship with the thinnest data, seasonal fit for autumn-range loading.
- Surface(s): prod social queue via `POST /api/agent/queue-posts` (HTTP 200, `queued: 10`). Fire times 10:00 BST Tue 18 Aug → Sat 22 Aug. Draft: `context/drafts/2026-08-17-social-week-install-gated-pillars.md`; payload scratchpad-only, not committed.
- Result: queued — **not yet posted** as of 2026-08-17. **No carousel for the third consecutive week**: `/Users/abuaa/Projects/Maters` is still absent on this machine (same as 2026-07-27 and 2026-08-10), so no visual set and no IG hand-off. Text pipeline unblocked per the standing rule.
- Related claims: canon-source-register §A9 + `apps/scanner/src/lib/methodology-data.ts` — Attributes 20% install-gated, Mapping 15% install-gated, Checkout eligibility 10% install-gated (Tue/Wed/Thu state these verbatim; the Mapping category example and the Checkout blocker list are lifted from the pillars' own `why` / `measures` text), §"60-second scan promise", §"free scan needs no install" (Fri). No GTIN claim (angle spent, and re-used by the 2026-08-04 run whose GS1 posts fired 10 + 17 Aug); no AI-ranking or sales outcome claimed on any post.

## Changelog

- 2026-04-19: Adapted for Flintmere. Added seven narrative anchors from BUSINESS.md and cornerstone content queue from SPEC §8.3.
- 2026-06-19: Narrative anchor #3 "The six pillars" → "The seven pillars" (PR #79 6→7 migration). Backfilled the produced-content log (one blog seed + three social campaigns/carousels) in the documented format, with honest produced/queued/draft status per the note above — nothing here is confirmed-published as of 2026-06-19. Sources verified against `context/drafts/*`, `context/compliance/reviews/2026-06-11-blog-seed-catalog-readiness.md`, and `methodology-data.ts`.
