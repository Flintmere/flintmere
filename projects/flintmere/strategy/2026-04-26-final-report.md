# Flintmere — Final Strategic Report (v2)

> ## ⚠ COUNCIL RATIFICATION BLOCK — 2026-04-26 evening (binds over conflicting language below)
>
> Standing Council convened on the v2 report (39 seats; relevant lenses #15 + #18 + #4 + #24 + #11 + #22 + #39 + #37 + #7 + #5 + #36 + #34 + #38 + #1). The moat reframe (workflow > taxonomy) ratified. The following adjustments bind every reading of this document:
>
> 1. **Engineering timeline correction (#15 + #18).** §4 §"The honest cost" + §9.7 phasing both say 5–7 months for the ingestion engine. Realistic end-to-end (PDF heuristics for 3 supplier formats + multimodal back-of-pack + Shopify metafield writeback + drift detection + BFS-grade verification UX) is **9–12 months solo**. Internal planning binds the longer figure; the §12 phase structure holds.
> 2. **Privacy posture binds Phase 2 (#4 + #24 VETO).** Supplier PDF + photo upload introduces PII handling the current Privacy Policy + DPA don't cover. Phase 2 of the ingestion engine MUST NOT ship without a parallel `legal-page-draft` skill pass covering: (a) DPA addendum for upload artefacts; (b) upload-bucket retention schedule + deletion-on-request flow; (c) photo-PII handling for incidental humans in backgrounds; (d) new Shopify scope `write_products` disclosure.
> 3. **Pricing magnitudes are HYPOTHESES (#22 + #11).** §5's £99 base + £50/channel + £40/£70 vertical bundles are PROPOSALS, not commitments. ADR 0016 already committed a WTP study Month 1–2 to calibrate; v2 effectively bypassed that commitment. The structural axis change (per-channel) ratifies; the magnitudes wait on WTP. Public copy must not name specific magnitudes until WTP lands.
> 4. **"Plaid of commerce data" tagged ASPIRATIONAL (#11 + #1).** Strategic-cornerstone framing in §6 is overclaim — the report itself admits "if it doesn't [land], it's a slide in a deck." Treat as aspirational long-arc bet, not load-bearing strategy.
> 5. **Standards publication framing risk (#39 VETO).** v2 demotes standards from "moat" to "marketing artifact." Operationally fine, but the framing risks operator under-investment in regulatory monitor + #39 review cadence over time. **Standards remain operationally first-class** — half-yearly publication + #39 weekly review per ADR 0018 hold without exception. Citation gate (Gate 2) DEPENDS on this.
>
> **Architectural conflicts resolved:**
>
> - **Conflict A (#5 Kael):** v2 §9.5 puts standards publication in `apps/scanner/src/app/standards/food/v1/page.tsx`. This contradicts ADR 0018 + the standards IA spec (`context/design/ia/2026-04-26-standards-flintmere-com.md`) which pre-bound a STANDALONE app at `apps/standards/` on the standards.flintmere.com subdomain. **Resolution: honour ADR 0018; standards lives at `apps/standards/` standalone, NOT in `apps/scanner/`.**
> - **Conflict B (#5 Kael):** v2 §9.6 proposes a new `/company` route. This duplicates the `/about` route already specced in `context/design/specs/2026-04-26-about-food-first.md` (which covers Eazy Access Ltd + Companies House + the John Morris single-mention per BUSINESS.md procurement disclosure rule). **Resolution: retire `/company`; ship the existing `/about` spec.**
>
> **ADR amendment chain triggered (follow-up commits, not tonight):**
>
> - **ADR 0020 (NEW):** per-channel pricing axis change. Layers on top of ADR 0016 (vertical-distribution axis); 0016 stays valid; 0020 adds the channel-multiplier dimension.
> - **ADR 0019 (AMENDED in place):** 6-month strategic gate proof-condition changes from "third-party citation of food standard" to "30-day cohort retention ≥ 70% on ingestion engine." Same calendar (2026-10-26). The original citation gate becomes Gate 2 (12-month, 2027-04-26).
>
> **Sequencing decision (council 5-2-2 split):** finish HOMEPAGE-only Phase D web-implementation (per-vertical content slot copy + retire legacy 5-tier strip) sequentially; dispatch dead-inventory wedge engineering in parallel. `/pricing` tier-strip rebuild on legacy SKU-volume model is DROPPED as throwaway (lands inside §9.2 with new pricing axis). `/about` + `/methodology` + `/for/plus` surface composition DEFERRED until post-wedge.
>
> All other v2 content stands as written. Where this ratification block conflicts with the body below, this block wins.

---

**Author:** External review (Claude, working session 2026-04-26)
**Status:** Final. Actionable. Repo-ready.
**Suggested location:** `projects/flintmere/strategy/2026-04-26-final-report.md` (per council: strategic reports are PROJECT documents, not global behaviour rules in `memory/`).
**Cross-link from:** `CLAUDE.md` product snapshot (updated 2026-04-26 evening to reflect ingestion-engine centrality).
**Supersedes:** v1 (2026-04-26 morning, same path; visible via git history). v1 framed the moat as "regulatory taxonomies you maintain." v2 corrects this: the taxonomy alone is not the moat. The *ingestion workflow* is the moat. This shifts the codebase priorities and the 90-day plan.

---

## 0. How to use this document

- **Read the council ratification block above first.** It binds every reading of the body below.
- **§1 Executive verdict** — read first.
- **§2 The two gates** — what you measure to know if it's working.
- **§3–6** — what to do, ordered by leverage.
- **§7** — the dead-inventory wedge. The keystone. Build first.
- **§8** — codebase changes with file paths.
- **§9** — what to stop.
- **§10** — risks the strategy assumes you can survive.
- **§11** — sequenced 9-month plan with decision gates.

If you only have 15 minutes: read the ratification block, §1, §2, §7, §8.

---

## 1. Executive verdict

**Flintmere's moat is the ingestion workflow, not the taxonomy.**

A competitor can scrape your food standard in a weekend. They cannot easily replicate the workflow that takes a supplier PDF, a back-of-pack photo, or a messy spreadsheet, runs it through multimodal extraction, maps it against your proprietary regulatory taxonomy, flags gaps, and writes structured data to Shopify metafields with merchant verification. That pipeline is the product. The taxonomy is the input. The standards publication is the marketing artifact.

This reframes everything in v1 of this report. v1 said "publish the standard, the maintenance is the moat." That's still true, but it's *secondary* to the workflow. The hierarchy is:

1. **Primary moat:** ingestion engine (supplier-mess → Shopify metafield) with merchant-verified LLM extraction
2. **Secondary moat:** maintained, dated, regulator-tracked standard, openly published
3. **Reinforcing moat:** retention via switching cost (leaving Flintmere = manual re-entry of N SKUs)

The single sentence that summarises the strategic problem: **the homepage sells a generic seven-check scanner, the vertical pages sell a regulatory specialist, but neither sells the ingestion engine that's actually the defensible product.**

Five structural moves make this work:

1. **Build the ingestion engine as the centrepiece product.** Multimodal extraction (supplier PDF / back-of-pack photo / spreadsheet) → proprietary taxonomy mapping → Shopify metafield writeback. The merchant verifies the LLM draft in one pass; you don't promise full automation, you promise a 30-second confirmation flow.
2. **Pick food and drink as the spearhead vertical.** The liability-to-visibility ratio favours it decisively over beauty and apparel — see §3.
3. **Lead with the dead-inventory pitch, not "AI-readiness."** "You have ~45 SKUs likely suppressed in Google Shopping at your AOV that's £12k/mo of uncaptured demand" converts. "Your catalog is invisible to ChatGPT" doesn't. See §7.
4. **Price per outbound channel, not per store or per SKU.** Base platform fee + per-channel multipliers (GMC, TikTok Shop, Amazon, Perplexity). The merchant's distribution surface area is the value-metric, not their catalog size. **Per ratification block #3: magnitudes are HYPOTHESES pending WTP study.**
5. **Ship the full Shopify embedded app.** This strategy requires it — the ingestion engine writes to metafields, and you need OAuth for that. There is no Path B version of this strategy. Budget **9–12 months** of engineering accordingly (corrected from v2's optimistic 5–7 per ratification block #1).

The codebase is in good shape for this. The strategic positioning is not. The current homepage actively understates what Flintmere is becoming. This report is about closing that gap.

---

## 2. The two gates

The earlier version of this report had one gate: third-party citation of the Flintmere food standard within 12 months. That gate is still useful but is *secondary* under the moat reframe. The primary signal is now retention.

### Gate 1 (primary, retention) — month 6 check

> **30-day cohort retention on the ingestion engine ≥ 70%.**

If merchants who use the ingestion engine to land their first 10+ products as structured data continue using it 30 days later, the switching-cost moat is real. If they churn, the workflow isn't valuable enough to lock them in, and the rest of the strategy needs revisiting.

Why retention not revenue: revenue lags 6+ months from ingestion-engine adoption (audit → trial → install → integration → expansion). Retention shows up immediately.

**ADR 0019 amendment per ratification block:** this gate replaces the v1 citation gate at the 2026-10-26 calendar moment. Citation gate becomes Gate 2.

### Gate 2 (secondary, authority) — month 12 check

> **A third party citing the Flintmere food standard in their own documentation, blog post, RFP, or onboarding guide, without being prompted by you.**

Calendar: April 26, 2027.

This is the same gate as v1 of this report. It still matters because it's the public proof that the standard has authority — which feeds GTM, partnership conversations, and the eventual "Plaid of commerce data" positioning (see §6 — and per ratification block #4, treat that framing as aspirational, not load-bearing).

### What happens if gates don't pass

- **Gate 1 fails (retention):** the ingestion engine isn't producing real switching cost. Most likely cause: the multimodal extraction quality is too low and merchants don't trust the output. Fix the extraction quality before scaling. If after another 90 days it still doesn't, revert to consulting-led (Path A from the Shopify-app discussion) — the strategy is not viable.
- **Gate 2 fails (authority):** you have a working SaaS but not a standards business. Fine — keep running the SaaS, drop the standards publication maintenance, focus on workflow improvements. This is still a viable business, just a smaller one.

**Build this in:** Add a quarterly self-review section to `STATUS.md` titled "Strategy gates." Each quarter, list (a) ingestion-engine 30-day cohort retention, (b) external references to the standard. Both numbers in plain sight, no rounding.

---

## 3. Vertical strategy: pick food and drink

Food wins on three dimensions over beauty and apparel:

**Liability-to-visibility ratio.** Allergen mislabelling is a recall event with FSA involvement and direct retailer liability. PAO mistakes in beauty are paperwork. The food vertical creates a buyer who has *already been told by their compliance officer* that catalog data correctness matters; the beauty vertical creates a buyer who's been told it's a marketing nice-to-have. The first kind of buyer pays.

**Channel surface — and this matters more under per-channel pricing (§5).** Every UK food retailer pushes data to Google Merchant Center, Amazon Fresh, Ocado, Deliveroo, and increasingly to ChatGPT-shopping and Perplexity. A food merchant on five channels pays five channel multipliers. A beauty merchant typically syndicates to two or three. Per-channel pricing therefore captures more revenue per food customer than per beauty customer at the same SKU count.

**Standard authority.** UK FSA Big-14 allergens, ISO 3166-1, PDO designations, certifications taxonomy — these are *already* recognised authorities. You're standardising the *encoding* of established regulatory taxonomies into Shopify metafields. The beauty INCI/PAO/skin-type story has the same shape but smaller liability stakes per merchant.

**Action items for food-first positioning:**

- `apps/scanner/src/app/page.tsx`: Reorder the IA so the vertical picker (Food / Beauty / Apparel) appears in the hero, not the seven pillars. The pillars become a "Methodology" section linked from the footer. **Status as of ratification: substantially DONE via Phase A + B + C of the food-first restructure (commits 81b0556, 50edc7b, b5f33c0).** Per-vertical content slot copy on `PickerDrivenContentBlock` + tier-strip retirement is the Phase D-homepage finish dispatched alongside the wedge.
- Build out food first as the deepest vertical. Apparel and beauty stay on the site but are clearly second-tier.
- Replace the homepage hero pitch with the dead-inventory pitch (§7), framed for food.
- `BUSINESS.md` / CLAUDE.md product snapshot: rewrite the target-customer paragraph to lead with food. Already partially landed via ADR 0015 + tonight's CLAUDE.md product-snapshot update.

**Watch this risk.** Picking food doesn't mean killing beauty/apparel pages — they earn SEO and they hedge if food doesn't compound. It means concentrating maintenance investment, content output, and outbound effort on food first. Revisit at the 12-month gate.

---

## 4. The ingestion engine — the centrepiece product

This is the single biggest shift from v1 of this report. The ingestion engine is not a feature; it's the product. Everything else (the public scanner, the standards publication, the audit, the embedded app) is in service of it.

### What the ingestion engine does

The merchant has a new product line to add. They have:

- A supplier spec sheet (PDF, often 2–6 pages, mixed text + tables)
- A back-of-pack photo (sometimes the only allergen source)
- An internal spreadsheet (their own SKU list, often messy)

They drop any combination of those into Flintmere. The system:

1. Runs multimodal extraction (Vertex Gemini 2.5 Pro for vision per ADR 0006, with OpenAI gpt-4o-mini fallback per ADR 0010 — but vision fallback stays disabled, so failed extractions queue rather than cross the residency boundary)
2. Maps the extracted fields against the Flintmere food taxonomy (allergens to FSA Big-14, country-of-origin to ISO 3166-1, certifications to controlled vocabulary, etc.)
3. Surfaces a *draft* with confidence scores per field
4. Merchant verifies in a single pass — 30-second flow per SKU, not full automation
5. Approved data writes to Shopify metafields via OAuth

### What it deliberately does not do

- **It does not promise full automation.** Multimodal extraction on real UK back-of-pack labels is realistically 80–88% precision in best cases, with a long tail of poor categories (multilingual, supplements, ethnic food). Promising automation produces NPS damage when extraction misses; promising "draft + 30-second verify" delivers consistent value.
- **It does not write to the catalog without merchant approval.** Every write is logged and reversible. The privacy and security pages already commit to this; honour it.
- **It does not require the merchant to learn Flintmere's data model.** The verification UI shows them the *Shopify metafield* they're populating, not "Flintmere field 47."

### Why this is the moat

A competitor can read your food standard. They cannot easily replicate:

- 6+ months of prompt tuning for back-of-pack OCR across UK label conventions
- The supplier-PDF format heuristic library (each major UK food wholesaler has its own PDF layout)
- The merchant verification UX that makes 30-second confirmation feel low-friction
- The OAuth metafield-write infrastructure that survives Shopify API version changes
- The retention loop where leaving Flintmere = manual re-entry of every SKU

The first of those is months of engineering. The fifth is the actual lock-in. Together they compound.

### The honest cost

**Per ratification block #1: 9–12 months solo end-to-end (corrected from v2's 5–7).**

Phase 1 (1–2 months): Spec extraction working at 80%+ on the three most common UK food supplier PDF formats. Manual mapping UI working end-to-end for one merchant.

Phase 2 (2–3 months): Multimodal back-of-pack extraction. Confidence scoring. Merchant verification flow polished. **Per ratification block #2: cannot ship without parallel privacy-posture review (DPA addendum + upload-bucket retention + photo-PII handling + Shopify scope disclosure).**

Phase 3 (1–2 months): Shopify metafield writeback. OAuth flow. Drift detection on subsequent product updates. App Store submission for Built for Shopify.

Plus realistic prompt-tuning and quality-iteration overhead → **9–12 months end-to-end is the binding figure.**

This is your engineering roadmap for the next 9–12 months. Everything else (standards publication, vertical content, pricing restructure) competes for *non-engineering* hours and is faster. Sequence accordingly — see §11.

---

## 5. The pricing restructure

Your `apps/scanner/src/lib/pricing.ts` is the canonical source. The current ladder prices on volume (SKUs and stores). Volume is the wrong axis. The right axis is **outbound channel surface area**.

**Per ratification block #3: every magnitude in the structure below is a HYPOTHESIS pending the WTP study committed by ADR 0016 Month 1–2. Public copy must not name specific magnitudes until WTP lands. The structural axis change (per-channel) ratifies; the prices wait.**

### The new structure (proposed magnitudes — pending WTP)

```
Free                                                  £0/mo
   Public scanner. Single vertical. Dead-inventory estimate.

Base platform fee (1 vertical, Shopify-only)          £99/mo  [HYPOTHESIS]
   Includes ingestion engine for one vertical, writing
   structured data to Shopify metafields.

Per-channel syndication                               +£50/mo per channel  [HYPOTHESIS]
   For each outbound channel where Flintmere keeps the
   merchant's data syndication-ready: GMC, TikTok Shop,
   Amazon Fresh, Perplexity Shopping, Ocado, Deliveroo.

Vertical bundle (Food + Beauty)                       +£40/mo on top of base  [HYPOTHESIS]
Vertical bundle (Food + Beauty + Apparel)             +£70/mo on top of base  [HYPOTHESIS]

Concierge audit (one-off)                             £97 (existing — keep)
Concierge monthly retainer (one vertical)             £249/mo  [HYPOTHESIS]
   Includes ingestion engine + monthly review + standard
   updates surfaced to the merchant + 30-day re-scan.

Enterprise (GMV >£20M)                                From £1,500/mo  [HYPOTHESIS]
   Custom supplier-ingestion workflows, named contact,
   monthly strategy call. Embedded app required.
```

### Why per-channel works

- It captures upside without punishing catalog growth (current per-SKU pricing actively penalises the merchant for adding products, which is the wrong behaviour for a tool whose value compounds with catalog size).
- The internal upsell pitch writes itself: a merchant on Shopify + GMC + Amazon, paying £99 base + 0 channels initially, can self-justify £249 (£99 + £50×3) by activating syndication for channels they're already pushing to manually.
- It scales with the merchant's success without the awkward "you grew, now we charge you more" conversation that per-SKU triggers.

### What "per-channel syndication" actually delivers

This needs to be honest. Two options:

- **Option A — Flintmere syndicates the feed itself.** Bigger product surface. Competes directly with DataFeedWatch, GoDataFeed, Channable. Probably wrong.
- **Option B — Flintmere keeps the merchant's data *syndication-ready* for each channel.** They use their existing feed manager to push; Flintmere ensures the data passes that channel's spec. Narrower scope. Honest with the value metric.

**Recommendation: Option B for launch, with a clear roadmap toward Option A for select channels (GMC + TikTok Shop) by month 12.** Frame it as "Flintmere keeps your data ready for GMC, TikTok Shop, Amazon, and Perplexity. Your existing feed manager does the push; we make sure it doesn't get rejected." Channel multipliers reflect the spec-coverage work per channel, which is real engineering effort even when you're not running the syndication itself.

### Codebase actions

- `apps/scanner/src/lib/pricing.ts`: Rewrite the `TIERS` array. Add fields: `baseFee`, `channelMultiplier`, `verticalBundleAdditions`, `betaGated`. The `Tier` interface evolves from "name + price" to "base + per-channel + per-vertical-bundle." **Sequencing: lands inside the wedge phase, not Phase D-homepage finish (per ratification block sequencing decision).**
- `apps/scanner/src/app/pricing/page.tsx`: Rebuild around the new model. Show a small calculator: "1 vertical × Shopify only = £99. Add GMC + TikTok = £199." Make the math visible. Sophisticated buyers want to see the formula.
- `apps/scanner/src/app/page.tsx` lines ~393–398: Replace `<h2>Five tiers. One question: how many stores?</h2>` with the new framing. Suggested: `<h2>Pay for the channels you sell on. Not for SKUs. Not for stores.</h2>`. Final wording is for Copy Council; the structural change is mandatory.

---

## 6. The Plus tier and the embedded Shopify app

The earlier conversation asked whether you still need a Shopify app. Under the v1 strategy (publish standards, sell consulting), the answer was "minimal app or none." Under this v2 strategy, **yes, you need the full embedded Shopify app, because the ingestion engine writes to Shopify metafields and you can't do that without OAuth.**

This is Path C from the earlier conversation. Budget accordingly.

### Three things this means

**The £1,500+ Plus tier still gets delisted publicly until the embedded app is BFS-approved.** Listing a tier you cannot fulfil through your conversion path is brand-damaging. Mark `betaGated: true` in `pricing.ts`. The full enterprise tier comes back online when the embedded app passes Built for Shopify review. **(Already partially landed via ADR 0017.)**

**Plus reach via embedded scan unblocks the bot-blocked TAM.** Your own `/research` page admits enterprise stores behind bot-management can't be reached publicly. The embedded app doesn't have that constraint — once installed, it reads the catalog directly. So the path to selling Plus is "Plus brand installs the embedded app for the food vertical" not "Plus brand uses the public scanner first."

**The "Plaid of commerce data" framing — ASPIRATIONAL only per ratification block #4.** Genuinely possible but a 12–18 month execution. Treat as long-arc bet, not load-bearing strategy. It requires either platform-coverage scale or a named partnership with a downstream platform. Pick one platform (TikTok Shop is the strongest target — fastest growing, weakest existing data quality, most willing to engage) and aim for one named partnership where they publicly endorse Flintmere verification. If that lands, the Plaid framing becomes credible. If it doesn't, it's a slide in a deck, not a strategy.

### Distribution

**Single Shopify App Store listing.** Position around food-and-drink, with Beauty and Apparel mentioned as additional verticals. App Store policy prohibits duplicate apps under different vertical positionings.

**Public quarterly "State of Shopify Catalogs" report.** You already have this scaffolded: `apps/scanner/src/app/research/page.tsx` plus `apps/scanner/src/app/api/benchmark/summary/route.ts`. The piece that's missing is the **commitment to publish quarterly with a fixed date** so journalists, trade bodies, and Shopify ecosystem people learn to expect it. Add a "Next refresh: [date]" line to `/research` and honour it.

**Leaderboard SEO play.** Your `/score/[shop]` page is already well-designed: opt-in, indexable when published, robots-noindex when not. As more merchants opt in, you accumulate hundreds of high-quality URLs that rank for "[store] reviews / catalog quality." Real SEO moat that Shopify won't build because they won't grade their own merchants. Keep it.

**The standards publication.** Publish openly but maintain proprietarily. **Per ratification block Conflict A: lives at standards.flintmere.com (standalone `apps/standards/` per ADR 0018), NOT in `apps/scanner/`.** Per ratification block #5: operationally first-class despite "marketing artifact" framing.

---

## 7. The dead-inventory wedge — the keystone

This is the single most important GTM mechanism in the strategy. Without it, none of the rest converts.

### Why it's load-bearing

The reason most merchants don't structure their catalog data isn't lack of tools. It's:

1. They don't know structured data matters
2. They know but haven't prioritised it
3. They tried, hit friction, gave up
4. Their Shopify dev/agency hasn't prioritised it either

The ingestion engine fixes (3). The audit and standards publication address (1). But (2) and (4) — the prioritisation problem — are the dominant blockers in the food mid-market. Any merchant who hasn't prioritised structured data won't drop PDFs into a tool to fix it. They'll keep deferring.

**The dead-inventory pitch makes the cost of *not* using Flintmere visible and immediate.** That's the only mechanism that solves the prioritisation problem.

### The pitch

> "We scanned your catalog against the seven AI-shopping checks plus public Google Shopping suppression signals. We estimate 30–60 of your beauty SKUs are currently suppressed in Google Shopping due to missing GTINs, invalid PAO formats, or unstructured allergen data. At your AOV, that's £8,000–£14,000 in uncaptured monthly demand. Install Flintmere and we'll auto-extract the missing data from your supplier sheets in 3 minutes."

### The honest version of the pitch

The actual implementation is more nuanced than the strategy reads. To say "you have 45 SKUs suppressed in GMC" with confidence requires either:

- OAuth-level GMC access (4–6 weeks of engineering, ongoing rate-limit management)
- The merchant's GMC error CSV upload (manual, defeats the "3 minutes" claim)
- A statistical model estimating suppression from public catalog signals (fast, probabilistic, less authoritative)

**Ship the probabilistic version first.** Frame it: "Flintmere estimates 30–60 of your beauty SKUs are likely suppressed in GMC based on missing GTINs and unstructured allergen data. Install to confirm exact figures." This is honest, ships in 2–3 weeks, and converts.

After conversion, *then* do the GMC OAuth integration to convert "estimated" into "verified" — and use that as a Phase 2 upsell ("you've installed Flintmere, now connect GMC for exact suppression counts").

### Why this changes the homepage

The current homepage hero is:

> "ChatGPT lists you and every competitor. Yours ranks last."

This is honest but generic. It treats every Shopify catalog the same. The dead-inventory pitch personalises it:

> "Your catalog is losing roughly £X/month to suppression and demotion across Google Shopping, ChatGPT, and Amazon. Run the free scan. We'll show you which products and how to fix them."

The hero number (£X) is computed from the merchant's URL during the 60-second scan. Public catalog → product count + visible quality signals → suppression estimate → AOV-modulated revenue estimate. Real product engineering: 3–4 weeks.

### Codebase actions for the dead-inventory wedge (priority 1 — ship before anything else in §8)

- `packages/scoring/`: Add a `suppressionEstimate` module that computes likely-suppression counts from existing scoring signals. Logic: products with missing GTIN + ambiguous allergen text + missing GMC category → estimated suppressed. Products with all three pass; the rest fall on a probability gradient. Output: estimated suppression count with a 30–60 range, not a point estimate (honesty about precision).
- `apps/scanner/src/app/api/scan/route.ts`: Add the suppression estimate to the scan result payload.
- `apps/scanner/src/app/scan/page.tsx`: Surface the suppression estimate as the lead result, not a side metric. Frame as monthly revenue impact at the merchant's apparent AOV (estimated from catalog signals).
- `apps/scanner/src/app/page.tsx`: Update the hero pitch from "ranks last" to dead-inventory framing. This is a copy change conditional on the engineering above being live.
- New: `apps/scanner/src/lib/suppression-estimate.ts` — the model.

This is a 3–4 week project. **Ship it before the ingestion engine, before the standards publication, before everything else.** If it converts, the rest of the strategy has a foundation. If it doesn't, you've learned something cheap.

---

## 8. Internal LLM operations — the regulatory monitor

The strategy depends on keeping the food taxonomy current. Manual monitoring by a regulatory affairs contractor costs 0.5–1.0 FTE per vertical. Internal LLM agents reduce this to ~0.2 FTE per vertical (review-and-merge work only).

### What to build

A single internal-tools repo (or `apps/regulatory-monitor/`) that runs:

1. **Source watchers.** UK FSA precautionary allergen guidance, Defra labelling guidance, Trading Standards bulletins, EU Cosmetic Regulation Annex amendments published in OJEU, BRC/BSI standards updates. Some are RSS, some require scraping with login (BRC), some are PDFs that drop on irregular schedules (FSA).
2. **LLM extraction.** Use the existing `packages/llm/` abstraction via `router.completeInternal` (the internal customer-data-boundary route per ADR 0010). The agent reads each source, identifies whether the update changes any field in the Flintmere taxonomy, and drafts the diff.
3. **Human-in-the-loop merge.** The drafted diff lands in a private review queue. Your domain expert (likely a regulatory affairs contractor for the first 12 months) reviews, edits if needed, and merges. The merge produces a versioned update to the published standard plus a `STANDARDS-CHANGELOG.md` entry.

### The honest cost

The strategy makes this sound like a 2-week project. It's not. The actual sources for UK food regulatory updates are:

- FSA precautionary allergen guidance (PDFs on FSA's website, not RSS-distributed)
- Defra labelling guidance (quarterly, sometimes only via gov.uk press releases)
- Trading Standards bulletins (regional, fragmented)
- EU Cosmetic Regulation Annex amendments (OJEU, structured but irregular)
- BRC/BSI standards updates (paywalled)

Source-list curation for these takes 6–8 weeks of your domain expert's time *before* the LLM agent has anything useful to monitor. After that, the LLM monitoring runs at modest cost (~£50/month in Vertex inference) and produces 5–15 candidate diffs per quarter, of which 2–5 are real updates worth merging.

Budget: 2 months of engineering + 6–8 weeks of domain-expert curation upfront, then £50/mo + 0.2 FTE ongoing. Worth doing in month 4 of the plan, after the dead-inventory wedge and the ingestion engine MVP are live.

### Codebase actions

- New folder: `apps/regulatory-monitor/` with its own Dockerfile, similar shape to `apps/scanner/`
- Use `packages/llm/` for inference (already abstracted)
- Outputs flow into a private review queue (Postgres table, simple Remix admin UI in `apps/shopify-app/admin/regulatory-queue/`)
- Merges flow into `STANDARDS-CHANGELOG.md` and bump versioned standard URLs

---

## 9. Codebase change list — sequenced for the new strategy

The v1 report had 11 priorities sorted by leverage. Under the moat reframe, the order changes significantly. Numbered by *when* to ship, not just by importance.

### 9.1 — Suppression-estimate module + dead-inventory hero (priority: ship first, weeks 1–4)

**Files affected:**
- `packages/scoring/src/pillars/suppression-estimate.ts` (new)
- `apps/scanner/src/app/api/scan/route.ts` (add suppression estimate to response)
- `apps/scanner/src/app/scan/page.tsx` (lead with suppression estimate)
- `apps/scanner/src/app/page.tsx` line ~98 hero h1 (dead-inventory framing)
- `apps/scanner/src/lib/copy.ts` (new copy strings for suppression framing)

**Why first:** This is the keystone wedge per §7. Without it, every other improvement is shouting into a crowded market. Ship this first; let it convert; *then* invest in the bigger projects.

### 9.2 — Pricing axis change to base + per-channel (priority: weeks 2–4, parallel)

**Files affected:**
- `apps/scanner/src/lib/pricing.ts` (rewrite Tier interface and TIERS array)
- `apps/scanner/src/app/pricing/page.tsx` (calculator UI showing the formula)
- `apps/scanner/src/app/page.tsx` lines ~393–398 (replace "Five tiers. One question." with channel-axis framing)

**Why early:** Cheap engineering, high leverage. Doesn't depend on the ingestion engine. **Magnitudes await WTP per ratification block #3.** Triggers ADR 0020 (per-channel pricing axis).

### 9.3 — Homepage IA reorder, vertical-led (priority: weeks 4–6)

**Files affected:**
- `apps/scanner/src/app/page.tsx` (vertical picker in hero, pillars demoted to /methodology)
- `apps/scanner/src/app/methodology/page.tsx` (new — the seven-pillar deep dive moves here)
- Footer links updated across all marketing pages

**Status:** **Substantially DONE via Phase A + B + C of the food-first restructure (commits 81b0556, 50edc7b, b5f33c0).** Per-vertical content slot copy on `PickerDrivenContentBlock` + tier-strip retirement + `/methodology` composition is the Phase D-homepage finish, dispatched alongside the wedge.

### 9.4 — Plus tier honesty, mark betaGated (priority: weeks 4–6, parallel with 9.3)

**Files affected:**
- `apps/scanner/src/app/for/plus/page.tsx` (private-beta gate, no public £1,500+ price)
- `apps/scanner/src/lib/pricing.ts` (add `betaGated: true` to plus tier)

**Status:** Already partially landed via ADR 0017. Page composition is part of Phase D-deferred surface composition.

### 9.5 — Standards publication, food v1 (priority: weeks 5–8)

**Files affected (per ratification block Conflict A — corrected):**
- `apps/standards/src/app/food/v1/page.tsx` (new, human-readable; **standalone app per ADR 0018, NOT in apps/scanner**)
- `apps/standards/src/app/food/v1/spec.json/route.ts` (new, machine-readable)
- `apps/standards/src/app/page.tsx` (new, index)
- `STANDARDS-CHANGELOG.md` (new, repo root)
- Footer + `/for/food-and-drink` updated to link the standard at `https://standards.flintmere.com/food/v1`

**Why now:** This is the public artifact for Gate 2 (citation). Doesn't gate ingestion engine work. Coolify standalone service deploys per ADR 0018 Phase 4.

### 9.6 — Companies House and founder verification (priority: week 1, one-day project)

**Files affected (per ratification block Conflict B — corrected):**
- `apps/scanner/src/app/about/page.tsx` (new — already specced at `context/design/specs/2026-04-26-about-food-first.md`; covers Eazy Access Ltd registration + Companies House link + VAT status + John Morris as accountable director per BUSINESS.md procurement disclosure rule)

**Why first:** Cheap, unblocks procurement at higher tiers, no engineering dependencies. **The v2-original `/company` proposal is RETIRED**; ship the existing `/about` spec (defers to Phase D-deferred per ratification block sequencing).

### 9.7 — Embedded Shopify app: ingestion engine MVP (priority: weeks 6–48)

This is the big one. **Per ratification block #1: 9–12 months end-to-end is the binding figure.** Sequenced into three phases per §4.

**Phase 1 — Spec extraction (weeks 6–14):**
- `apps/shopify-app/app/routes/ingestion.upload.tsx` (file upload UI)
- `apps/shopify-app/app/lib/extraction/supplier-pdf.ts` (PDF parsing for top 3 UK food supplier formats)
- `apps/shopify-app/app/lib/extraction/spreadsheet.ts` (CSV/XLSX ingestion)
- `apps/shopify-app/app/lib/taxonomy/food-mapping.ts` (extracted-field → Flintmere taxonomy)
- `apps/shopify-app/app/routes/ingestion.review.tsx` (verification flow)
- Uses `packages/llm/` for extraction inference

**Phase 2 — Multimodal back-of-pack (weeks 14–22):**
- `apps/shopify-app/app/lib/extraction/back-of-pack.ts` (vision extraction via Vertex Gemini 2.5 Pro)
- Confidence scoring per field
- UI updates to show confidence in the verification flow
- **Per ratification block #2: cannot ship without parallel `legal-page-draft` skill pass on DPA + retention + photo-PII + Shopify scope disclosure.**

**Phase 3 — Shopify metafield writeback (weeks 22–48):**
- `apps/shopify-app/app/lib/shopify/metafield-writeback.ts` (OAuth metafield writes)
- `apps/shopify-app/app/lib/shopify/drift-detection.ts` (webhook-driven drift)
- App Store submission for Built for Shopify

**Why this timing:** The ingestion engine is the moat but takes 9–12 months. Doing it before the dead-inventory wedge means launching without an acquisition mechanism. Sequence after the cheap wins.

### 9.8 — Regulatory monitor (priority: weeks 16–20, parallel with ingestion engine Phase 2)

Per §8. Internal tooling. Not customer-facing. Can lag the ingestion engine slightly because the standards work in 9.5 produces a static v1 standard that doesn't need automated updates for the first 6 months.

### 9.9 — Crawlability weight (no change needed)

Already correct at 5%. Don't promote it on the homepage; surface only on `/methodology`.

### 9.10 — Hero copy unification

Currently `/scan` says "invisible to ChatGPT" and `/` will say (after 9.1) the dead-inventory framing. Consolidate. Pick the dead-inventory framing for both.

---

## 10. What to stop doing

1. **Stop pricing on store count.** "How many stores?" is the wrong question. Replace with channel multipliers.
2. **Stop selling the £1,500+ Plus tier publicly until the embedded app is BFS-approved.** Listing a tier you can't fulfil is brand-damaging.
3. **Stop leading with seven pillars on the homepage.** The pillars are methodology. The vertical and the dead-inventory hook are the product.
4. **Stop using "invisible to ChatGPT" framing.** "Dead inventory at £X/month" is sharper, more current, and converts.
5. **Stop claiming attribution as a moat.** Shopify will ship attribution dashboards within 18–24 months. Catalog-data correctness — specifically, the *ingestion workflow* — is the moat.
6. **Stop framing the moat as "the taxonomy."** It's the workflow. The taxonomy is the input.
7. **Stop calling Plus a "vertical."** Plus is a deployment mode. Verticals on one axis, deployment tier on another.
8. **Stop framing benchmark data with median language until the publish floor is hit per vertical.** Already correctly handled in code. Don't regress.
9. **Stop adding new pages on top of the existing structure.** Until the §9 changes ship, every new page makes the IA worse. Exception: the standards pages, `/methodology`, and `/about`, which are part of the §9 plan.
10. **Stop maintaining all three verticals at the same depth.** Concentrate on food. Beauty and apparel get lighter touch until the food story compounds at the 6-month gate.
11. **Stop promising features in marketing that the embedded app would deliver.** Until the app ships, the `/for/plus` page promises (bulk-fix, drift control, mapping coverage) are aspirational. A sophisticated reader will spot it.
12. **Stop treating the standards publication as the moat.** It's the marketing artifact in the moat hierarchy — but per ratification block #5, operationally first-class.

---

## 11. Risks the strategy assumes you can survive

**Risk 1 — Shopify ships native multimodal ingestion in Shopify Magic.** Probability: medium-high over 18 months. They've already shipped product-description generation. Catalog-data extraction from supplier docs is a logical extension. Mitigation: the *vertical regulatory mapping* is too specific for Shopify's generic Magic offering. Shopify ships the 80% generic version; the 20% regulatory tail (FSA Big-14, ISO 3166-1, PDO drift) is what merchants actually pay for. But: get the food-vertical ingestion engine to market *before* Shopify ships its generic version. First-mover advantage in vertical-specialist tooling is real.

**Risk 2 — A vertical PIM (TraceGains in food, Centric in beauty/fashion) ships a Shopify connector.** Probability: medium over 24 months. These are the apex predators, not Salsify or Akeneo or Klevu. They already have the regulatory taxonomies, the enterprise compliance certifications, and the customer base. Mitigation: the *cheap mid-market* (£250K–£25M revenue) is too small for them to chase profitably. Stay focused on that band; don't try to compete upmarket against TraceGains-grade enterprise PIMs.

**Risk 3 — Multimodal extraction quality stays at 80–88% precision and merchants don't trust it.** Probability: real. Mitigation: design the verification flow around the assumption that LLM output is a draft, not a final answer. Make the merchant feel like they're catching the LLM's mistakes (which they are), not doing manual data entry (which they're not). NPS depends on this UX choice.

**Risk 4 — Built for Shopify certification doesn't materialise.** Probability: medium. The certification gate has tightened. Without it, the App Store distribution path is materially weaker. Mitigation: get the embedded app through certification within 12 months of starting; if blocked, pivot to direct outbound for Plus (slow, capital-intensive, but works for a verticalised play).

**Risk 5 — The dead-inventory pitch doesn't convert.** Probability: real but testable cheaply. Mitigation: §9.1 is a 3–4 week project specifically designed to test this hypothesis fast. If suppression-estimate framing doesn't lift conversion vs current "invisible to ChatGPT" framing, the strategy needs revisiting before the bigger investments. Don't commit to the 9–12 month ingestion engine before the wedge tests positive.

**Risk 6 — Gate 1 (retention) fails at month 6.** The ingestion engine doesn't produce real switching cost. Most likely cause: extraction quality too low. Fix extraction first; if after another 90 days retention still doesn't hit ≥70%, revert to Path A (consulting + standards, no app). Both businesses are viable, just different.

---

## 12. The 9-month plan with decision gates

Three phases. Three gates. If a gate doesn't pass, stop and replan.

### Phase 1 — Foundation (months 1–2, May–June 2026)

**Ship in month 1:**
- Suppression-estimate module + dead-inventory hero (§9.1) — the keystone wedge
- Pricing restructure to base + per-channel (§9.2 — magnitudes pending WTP)
- Homepage IA reorder, vertical-led (§9.3 — substantially DONE via Phase A+B+C)
- Plus tier honesty fix (§9.4 — already partially landed via ADR 0017)
- Companies House + founder verification block (§9.6 — via existing /about spec, NOT new /company)

**Ship in month 2:**
- Standards publication, food v1 (§9.5 — at standards.flintmere.com via standalone apps/standards/)
- Quarterly research refresh cadence committed publicly on `/research`

**Gate 1 (end of month 2):** Has the dead-inventory pitch lifted scan-to-email conversion vs the previous "invisible" framing? Target: ≥30% lift. If yes, the wedge works — proceed to Phase 2 with confidence. If no, fix the pitch (test variants of the framing, the number range, the call-to-action) before committing to the ingestion-engine engineering.

### Phase 2 — Build the engine (months 3–9, July 2026 – January 2027)

**Per ratification block #1: extended from v2's "months 3–6" to months 3–9 to reflect realistic 9–12 month total ingestion-engine ship time.**

**Ship across these months:**
- Ingestion engine Phase 1 (spec extraction, months 3–5)
- Ingestion engine Phase 2 (multimodal back-of-pack, months 5–7) **WITH parallel privacy-posture review per ratification block #2**
- Ingestion engine Phase 3 (Shopify metafield writeback + BFS submission, months 7–9)
- Regulatory monitor MVP (month 5–6, parallel)
- First three "design partner" food merchants onboarded to early beta of the ingestion engine

**Gate 2 (end of month 6 — 2026-10-26 calendar, per ADR 0019 amendment):** Two checks.
1. Does the ingestion engine work end-to-end on three real merchant catalogs? Not "demo polish" — does a real merchant land 10+ products as structured data without abandoning the flow?
2. Has 30-day cohort retention on the ingestion engine hit ≥70% on the design partners?

If both pass: the moat is forming. Proceed.
If one passes: the engine works but doesn't lock in. Spend month 7 on UX/quality fixes to lift retention before scaling.
If zero pass: the engine isn't viable in current form. Revert to Path A — consulting + standards, no app. The strategy has failed; the business hasn't.

### Phase 3 — Distribution and authority (months 10–12, February–April 2027)

**Ship across these months:**
- Built for Shopify certification approval
- Public launch of the ingestion engine to the wider Shopify food-vertical market
- Quarterly "State of Shopify Catalogs — Food Edition" report with 100+ stores in dataset
- One outbound pitch to UK food trade publication (The Grocer, Food Manufacture, Speciality Food magazine)
- First TikTok Shop conversation about Flintmere verification payload (the Plaid-of-commerce-data starter — aspirational only per ratification block #4)

**Gate 3 (month 12, 2027-04-26 — same calendar as v1's citation gate):** Three checks.
1. Has the food vertical landed at least 10 paying customers at base + channel multipliers (magnitudes per WTP outcome)?
2. Has the embedded app passed Built for Shopify review?
3. Is one external party (journalist, trade body, agency, vertical PIM, downstream platform) referencing the food standard or the verification payload, unprompted? **(This is the v1 citation gate; survives as Gate 3.)**

If all three pass: you have validated product-market fit on the standards-plus-ingestion business. Continue building.

If two pass: signal but not enough. Keep going for another 90 days; revisit at month 15.

If one or zero pass: the strategy isn't compounding. Revert to Path A. The £97 audit business plus the standards publication is still real — just smaller.

---

## 13. What this report deliberately does not cover

- **Detailed copy rewrites.** Copy is a Copy Council job. The structural points (h2 line on homepage, hero pitch, vertical picker placement) are flagged; exact wording is for the copywriting cycle.
- **Specific extraction-quality benchmarks.** The 80–88% precision range is industry-typical; your actual numbers depend on which UK food supplier formats you target first and how much prompt-tuning you invest. Plan to spend month 3 of Phase 2 establishing a baseline against three real supplier PDF formats before scaling.
- **Detailed acquisition channels for the food vertical.** The dead-inventory wedge is the conversion mechanism. The acquisition mechanism — Shopify App Store SEO + content + outbound + partnership — is Phase 3 work and needs market research before commitment.
- **Hiring plan.** Regulatory affairs contractor is the next hire. After that depends on Gate 2 outcome.
- **Capital strategy.** Out of scope. The strategy survives on bootstrap if the £97 audit volume and the food-vertical SaaS conversion both grow as planned.
- **Detailed competitive positioning vs Klevu, Nosto, Profound.** The apex-predator framing (TraceGains/Centric/Specright are the real competitors, not Salsify/Akeneo or Klevu/Nosto) holds. Customer-facing positioning is "vertical regulatory specialist with the workflow that makes compliance frictionless," not a comparison-chart battle.
- **The "Plaid of commerce data" execution plan.** Real possibility but a 12–18 month project — **and per ratification block #4, ASPIRATIONAL only.** Phase 3 starts the conversation with TikTok Shop; productisation of the verification API and partnership terms are post-month-12 work.

---

## 14. The final paragraph

The earlier version of this report had the right vertical (food) and the right tactical moves but the wrong moat. The moat isn't the taxonomy — anyone with a regulatory affairs contractor can build a taxonomy. The moat is the *workflow that takes a supplier PDF and lands it as structured data in a Shopify metafield in 30 seconds of merchant time.* That workflow is months of engineering, prompt-tuning, format heuristics, and verification UX. It's the kind of thing nobody builds in a quarter. Combined with the standards publication for authority, the per-channel pricing for revenue capture, and the dead-inventory wedge for conversion, this is a defensible business.

The 9-month plan in §12 corrects the v1 report's assumptions and reflects the moat reframe. The two gates in §2 — retention at month 6, citation at month 12 — tell you whether it's working. If both pass, you have a vertical-specialist standards-plus-ingestion business with real switching cost and real authority. If gate 1 fails, you have a smaller consulting business plus a published standard, which is still a real business. The strategy has a defined fallback either way.

The single highest-priority change in the entire codebase: **ship the dead-inventory wedge first.** Three weeks of engineering, immediate conversion test, foundation for everything else. Don't commit to the 9–12 month ingestion engine before the wedge converts. If it does, you have a moat worth building. If it doesn't, you've learned something cheap before the big spend.

Pick food. Ship the wedge. Test conversion. If it lifts, build the ingestion engine. Publish the standard. Restructure the pricing. Verify the founder publicly. Run the 9 months.

Everything else is detail.

---

*End of report v2.*

*If anything in here contradicts something earlier in the strategic conversation, this document — including its council ratification block — is the canonical version. v1 of this report is superseded; visible via git history at this same path.*
