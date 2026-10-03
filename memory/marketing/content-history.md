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

### 2026-08-24 — Week of 25 Aug: five text posts, no carousel (`multipack-not-six-singles` · `reformulated-fields-didnt` · `oos-is-not-delisted` · `hamper-has-no-identifier` · `origin-is-a-field`)

- Channel: x · bluesky (cross-post — `channel` omitted, 5 posts → 10 rows queued)
- Angle: five catalog-reality cuts none of which had carried a post, chosen to avoid every spent angle through 22 Aug. Tue #3 the multipack is its own product — own GTIN, net weight, unit price — not the single's data reused · Wed #2 + #6 data decay: the supplier reformulated, the Attributes fields didn't move · Thu #3 out-of-stock and delisted are different availability signals and the feed usually sends the wrong one · Fri #2 gift sets and hampers carry no clean identifier, category or net weight, in the quarter they sell hardest (seasonal — Christmas ranging) · Sat #3 country of origin is a field, not a line in the description; Attributes is 20%, joint-largest with Identifiers.
- Surface(s): prod social queue via `POST /api/agent/queue-posts` (HTTP 200, `queued: 10`). Fire times 10:00 BST Tue 25 Aug → Sat 29 Aug. Draft: `context/drafts/2026-08-24-social-week-multipack-decay-hampers.md`; payload scratchpad-only, not committed.
- Result: queued — **not yet posted** as of 2026-08-24. Prior weeks confirmed firing (daily briefs 22–23 Aug report posts shipped). **No carousel for the fourth consecutive week**: `/Users/abuaa/Projects/Maters` is still absent on this machine (27 Jul, 10 Aug, 17 Aug, 24 Aug), so no visual set and no IG hand-off.
- Related claims: canon-source-register §A9 + `flintmere.com/methodology` — Identifiers 20% public, Attributes 20% install-gated (Sat states the joint-largest 20/20 verbatim), §"60-second scan promise", §"free scan needs no install" (Tue). ADR 0027 §3 binds allergens + provenance to **Attributes**, never Mapping — Wed and Sat comply. No GTIN-issuance claim (Tue/Fri name a GTIN as a property the product must carry, never as something Flintmere supplies); no AI-ranking or sales outcome claimed on any post.
- Held back: the ADR 0027 Shopify Catalog / UCP complementary line — strongest unspent angle, blocked on `claim-review` per ADR 0027 §5. The food catalog standard v1.0 RC — committed on `feat/standards-food-v0.1` but unmerged and 404 in prod; not announced.

### 2026-08-31 — Week of 1 Sep: five text posts, no carousel (`brand-field-blank` · `image-404-alt-presence` · `description-floor-200` · `llms-txt-crawlability` · `access-not-preference`)

- Channel: x · bluesky (cross-post — `channel` omitted, 5 posts → 10 rows queued)
- Angle: five pillar *sub-checks* and one honesty beat, none previously used. Wed #3 Brand is its own identifier field — 10% of Identifiers, and the shop name is not the brand · Thu #3 a 404 product image is a hard Consistency demotion, alt-text measured for presence only · Fri #3 the description half of Titles — the 200-character floor and paragraph structure · Sat #3 Crawlability's three checks named, incl. `llms.txt` · Sun #6 + honesty: we measure access, not agent preference (lifted from the Crawlability `notMeasured` column).
- Surface(s): prod social queue via `POST /api/agent/queue-posts` (HTTP 200, `queued: 10`). Fire times 10:00 BST Wed 2 Sep → Sun 6 Sep. Started Wed, not Tue, because two posts from a prior batch already fire Tue 1 Sep (per the 2026-08-31 daily brief). Payload scratchpad-only, not committed.
- Result: queued — **not yet posted** as of 2026-08-31. **No carousel for the fifth consecutive week**: `/Users/abuaa/Projects/Maters` is still absent on this machine (27 Jul, 10 Aug, 17 Aug, 24 Aug, 31 Aug), so no visual set and no IG hand-off. Text pipeline unblocked per the standing rule.
- Related claims: canon-source-register §A9 + `apps/scanner/src/lib/methodology-data.ts` — Identifiers 20% public with brand presence at 10% of the pillar (Wed), Consistency 15% public covering image-URL resolution + alt-text presence and its `notMeasured` "presence, not semantic accuracy" (Thu), Titles 15% public with the ≥200-char description floor (Fri), Crawlability 5% public naming GPTBot/ClaudeBot/PerplexityBot + sitemap + llms.txt (Sat), Crawlability `notMeasured` "we measure access, not preference" (Sun). §"free scan needs no install" (Wed). No GTIN-issuance claim; no AI-ranking or sales outcome claimed on any post.
- Outreach: `POST /api/agent/stage-outreach` returned `staged: 0, batchId: null` — no `enriched` targets in the pool. Discovery/enrichment needs a run before the next batch can stage.

### 2026-09-07 — Week of 8 Sep: five posts drafted, NOTHING QUEUED (`ocado-back-of-pack` · `schema-behind-a-login` · `liability-is-assigned` · `fees-are-not-the-cost` · `legacy-rows-stay-empty`)

- Channel: none — held. No call made to `POST /api/agent/queue-posts`.
- Angle: the ADR 0029 retail gate, drafted but not published. Tue Ocado's Supplier Manual p16 — launch is delayed until back-of-pack data is provided and approved · Wed the schema sits behind a login (Waitrose WPP, Sainsbury's EVOLVE, Ocado Pro-Forma; Booths is the only published checklist) · Thu Erudus assigns accuracy liability to the manufacturer and caps its own at £100,000 · Fri fees are cheap (GS1 UK £130–£450/yr, Erudus free under £2M) — the unpublished schema is the cost · Sat Shopify's taxonomy carries Big-14 allergens on 721/764 food categories but Magic fills at creation only, so legacy rows stay empty.
- Surface(s): `context/drafts/2026-09-07-social-week-retail-gate-HELD.md` (gitignored). All five verified ≤280 chars (251/217/226/184/232). Nothing queued, nothing posted.
- Result: **held for an operator decision.** ADR 0029 was ratified 2026-09-06, one day before this run, and retires by name the positioning every batch since 2026-07-27 ran on — "invisible to AI shopping", the dead-inventory wedge, the GTIN-suppression claim, `llms.txt` as a scored pillar, the £99–£499/mo ladder. Prod has not moved: `flintmere.com` still sells the scan and the Catalog Letter, `/methodology` still serves the seven-pillar model (fetched + confirmed this run), and ADR 0029's P0 false claim at `llms.txt/route.ts:75` + `README.md:3` is still live. Old-thesis posts would publish retired positioning; new-thesis posts would contradict the live methodology page. Social posts fire automatically and cannot be recalled, so neither was queued on agent authority.
- Host change found this run: **`audit.flintmere.com` and `catalog.flintmere.com` both now 301 to `https://flintmere.com/`.** The free-scan CTA anchor named in the scheduled-task file no longer resolves to a scanner. The agent API route is still reachable on all three hosts (403 `unauthorised` unauthenticated) — the block is copy, not plumbing.
- Related claims: every drafted line traces to a verified primary source inside ADR 0029 (Ocado Supplier Manual May 2026 p16 verbatim, diffed against Sept 2024; Erudus terms + £100,000 cap; GS1 UK £130–£450/yr; Erudus free under £2M; Shopify Standard Product Taxonomy v2026-05, attribute 1451, 721/764 food categories). No GTIN-issuance claim, no AI-ranking or sales-outcome claim, no price. Post 5 asserts third-party product behaviour (Shopify Magic fills at creation only) and is flagged for `claim-review` before it fires.
- Carousel: none, sixth consecutive week — `/Users/abuaa/Projects/Maters` is still absent (27 Jul, 10 Aug, 17 Aug, 24 Aug, 31 Aug, 7 Sep). Caption drafted against post 1 for when the engine returns.
- Outreach: skipped deliberately, not for an empty pool. `stage-outreach-batch.ts` stages `enriched` Shopify-merchant targets — the ICP ADR 0029 §2 replaces with "a UK food or drink brand that has just won, or is pursuing, a listing." Spec §P2 also requires partner approaches be made individually, never batched. Staging would have pushed the retired ICP.

### 2026-09-14 — Week of 15 Sep: retail-gate batch carried forward, NOTHING QUEUED (`ocado-back-of-pack` · `schema-behind-a-login` · `liability-is-assigned` · `fees-are-not-the-cost` · `legacy-rows-stay-empty`)

- Channel: none — held for the second week. No call made to `POST /api/agent/queue-posts`.
- Angle: unchanged from 2026-09-07 (ADR 0029 retail gate). No new angles drafted: the five approval-ready drafts are still unfired, and the old-thesis angle set is retired by ADR 0029 + ADR 0030, so a fresh batch would only duplicate pending decisions.
- Surface(s): `context/drafts/2026-09-07-social-week-retail-gate-HELD.md` (carry-forward note added); re-dated payload Tue 15 → Sat 19 Sep 10:00 BST, session scratchpad only.
- Result: **held — no operator decision recorded.** Progress since 7 Sep: llms.txt P0 fixed and live (#108), "invisible" retired (#110–#117). Still blocking: ADR 0030 (Accepted 2026-09-10) retires the suppression wedge, but `suppressed` survives 24× in scanner code on `origin/main` and 4× on the live homepage H1 — prod still sells the retired wedge, and there is still no retail-gate CTA page. Post 5's Shopify Magic claim is now verified against ADR 0029 line 32 (flag cleared).
- Related claims: as 2026-09-07 — ADR 0029 primary sources (Ocado Supplier Manual p16, Erudus terms + £100,000 cap, GS1 UK £130–£450/yr, Erudus free under £2M, Shopify taxonomy 721/764). No GTIN-issuance, AI-ranking, sales-outcome or price claim.
- Carousel: none, seventh consecutive week — `/Users/abuaa/Projects/Maters` still absent.
- Outreach: skipped. Daily brief 2026-09-12 reports 5 of 5 sent outreach emails unsubscribed, and the live sequence still pitches "your AI-shopping score" to the ICP ADR 0029 §2 replaces.
- Queue note: a pre-existing post ("Before agentic commerce: catalog quality was a SEO concern… [ gate ]") fires 14 Sep to X + Bluesky. The briefs of 12–14 Sep call these "duplicates"; they are most likely one post cross-posted as two rows. Not queued by this agent.

### 2026-09-21 — Week of 22 Sep: retail-gate batch held a third week, NOTHING QUEUED (`ocado-back-of-pack` · `schema-behind-a-login` · `liability-is-assigned` · `fees-are-not-the-cost` · `legacy-rows-stay-empty`)

- Channel: none — held. No call made to `POST /api/agent/queue-posts`.
- Angle: unchanged (ADR 0029 retail gate). No new angles drafted, for the same reason as 2026-09-14.
- Surface(s): `context/drafts/2026-09-07-social-week-retail-gate-HELD.md` (gitignored).
- Result: **held — still no operator decision.** No commits on `origin/main` since #117 (2026-09-10). Live homepage still carries `suppressed` 4×; `audit.flintmere.com` still 301s to `flintmere.com/`; there is still no retail-gate CTA page. New this week: **old-thesis posts are still firing from the existing queue** — daily brief 2026-09-19 reports "40% of Shopify catalogs get filtered before an AI agent recommends a product… Scan yours in 60…" shipped to X + Bluesky, a claim ADR 0029 retires. "Catalog health isn't a vanity score…" fires 21 Sep. Neither was queued by this agent.
- Related claims: as 2026-09-07 — ADR 0029 primary sources. No GTIN-issuance, AI-ranking, sales-outcome or price claim.
- Carousel: none, eighth consecutive week — `/Users/abuaa/Projects/Maters` still absent.
- Outreach: skipped. Resend shows the live sequence still sending "your AI-shopping score" emails daily (18–20 Sep: 6 sent, 1 bounced, 1 suppressed) to the ICP ADR 0029 §2 replaces.

### 2026-09-28 — Week of 29 Sep: retail-gate batch held a fourth week, NOTHING QUEUED (`ocado-back-of-pack` · `schema-behind-a-login` · `liability-is-assigned` · `fees-are-not-the-cost` · `legacy-rows-stay-empty`)

- Channel: none — held. No call made to `POST /api/agent/queue-posts`.
- Angle: unchanged (ADR 0029 retail gate). No new angles drafted, same reason as 2026-09-14.
- Surface(s): `context/drafts/2026-09-07-social-week-retail-gate-HELD.md` (gitignored).
- Result: **held — still no operator decision.** No commits on `origin/main` since #117 (2026-09-10). Live homepage still carries `suppressed` 4×; `audit.flintmere.com` still 301s to `flintmere.com/`. Old-thesis posts keep firing from a source that is not this agent and not in the repo (likely the ADR 0026 pipeline): briefs 22–28 Sep report "Catalog health isn't a vanity score…", "AI shopping channels now serve product results…", "Identifiers are 20% of a catalog's AI-readiness score…" shipped, and "Most merchants think their products rank because they rank on Google…" firing 28 Sep, each ×2 (X + Bluesky). The daily brief now flags "weekly content agent last ran 6 days ago" because this agent's holds make no queue call.
- Related claims: as 2026-09-07 — ADR 0029 primary sources. No GTIN-issuance, AI-ranking, sales-outcome or price claim.
- Carousel: none, ninth consecutive week — `/Users/abuaa/Projects/Maters` still absent.
- Outreach: skipped. The live sequence still sends "your AI-shopping score" and "catalog data" emails daily (20–28 Sep: 2 bounced, 3 suppressed); briefs of 24 + 26 Sep report 5 unsubscribes against 1–4 sends. PostHog scans zero for 7 days (brief 2026-09-28).

## Changelog

- 2026-04-19: Adapted for Flintmere. Added seven narrative anchors from BUSINESS.md and cornerstone content queue from SPEC §8.3.
- 2026-06-19: Narrative anchor #3 "The six pillars" → "The seven pillars" (PR #79 6→7 migration). Backfilled the produced-content log (one blog seed + three social campaigns/carousels) in the documented format, with honest produced/queued/draft status per the note above — nothing here is confirmed-published as of 2026-06-19. Sources verified against `context/drafts/*`, `context/compliance/reviews/2026-06-11-blog-seed-catalog-readiness.md`, and `methodology-data.ts`.
