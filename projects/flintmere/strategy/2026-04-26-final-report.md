# Flintmere — Final Strategic Report

**Author:** External review (Claude, working session 2026-04-26)
**Status:** Final. Actionable. Repo-ready.
**Suggested location:** `memory/strategy/2026-04-26-final-report.md`
**Cross-link from:** `CLAUDE.md` precedence table, just above `context/`.

---

## 0. How to use this document

This report converts the strategic conversation, the site review, the critique of the three external strategy documents, and the codebase walkthrough into a single source of truth. It is structured for action, not for reading top-to-bottom.

- **§1 Executive verdict** — read first.
- **§2 The 12-month gate** — the only number that decides whether the strategy is working.
- **§3–6** — what to do, ordered by leverage.
- **§7** — codebase changes with file paths.
- **§8** — what to stop.
- **§9** — risks the strategy assumes you can survive.
- **§10** — 90-day plan with decision gates.

If you only have 15 minutes: read §1, §2, §7, §8.

---

## 1. Executive verdict

**Flintmere is a candidate standards business wearing the clothes of a commodity scanner.** The strongest, rarest, least-replaceable work in the codebase is the vertical regulatory taxonomies in `apps/scanner/src/app/for/{apparel,beauty,food-and-drink}/page.tsx`. The most replaceable surface — the seven-pillar framing, the public scanner, the store-count pricing question — is what the homepage leads with.

The single sentence that summarises the strategic problem: **the homepage sells the part that competitors can copy in a quarter; the vertical pages sell the part that takes 0.5–1.0 FTE per vertical to maintain and that nobody else has built.**

The fix is not a redesign. It's a re-prioritisation:

1. **Lead with the vertical, demote the seven pillars to methodology.** The vertical pages are the moat; surface them first.
2. **Pick food and drink as the spearhead.** The liability-to-visibility ratio favours it decisively over beauty and apparel — see §3.
3. **Stop pricing on store count. Price on regulatory complexity.** The line "Five tiers. One question: how many stores?" is the single highest-stakes copy on the entire site, and it prices the wrong axis.
4. **Either ship the embedded Shopify app or delist the £1,500+ Plus tier.** The public crawl cannot reach Plus stores (they sit behind enterprise bot-management — your own `/research` page admits this). You cannot sell a tier whose target buyer your conversion path cannot reach.
5. **Set a single 12-month proof condition for the moat.** A third party citing the Flintmere food standard in their own documentation, unprompted. If that hasn't happened by April 2027, the standards business is a story you're telling yourself, not a fact.

The codebase is in good shape. The strategic positioning is not. This report is about the second problem.

---

## 2. The 12-month gate

> **Proof condition:** A third party (a Shopify Plus brand, a vertical PIM, a regulatory consultant, a trade body, or a journalist) citing the *Flintmere food catalog standard* in their own documentation, blog post, RFP, or onboarding guide, without being prompted by you.

**Why this and not anything else.**

- "Stores scanned" measures bot reach, not standard adoption.
- "Revenue" measures consulting demand, not standard authority.
- "GitHub stars on the standard repo" measures developer interest, not industry adoption.
- A third-party unprompted citation is the only signal that the *thing you maintain* has become a thing *they reference*. That's what a standard is.

**Calendar:** April 26, 2027.

**What happens if it doesn't land:** You revert to the consulting business (£97 audits scaled to £200–500), kill the standards positioning, and the SaaS tiers become the support layer for a person-led service. That is not a failure mode — it's a viable business — but it is a different business, and the brand canon, pricing, hiring, and capital plan all change.

**Build this in:** Add a quarterly self-review section to `STATUS.md` titled "Standard adoption check". Each quarter, list every external reference to the Flintmere food/beauty/apparel standard you can find. If by Q3 2026 the count is still zero from sources you didn't seed, treat it as a yellow flag. If by Q1 2027 it's still zero, the strategy needs revisiting before you spend more capital on standards maintenance.

---

## 3. Vertical strategy: pick food and drink

The earlier conversation correctly identified that beauty and food are the two strong candidates and that apparel is the weakest. The unresolved question was beauty *or* food. Food wins on three dimensions:

**Liability-to-visibility ratio.** Allergen mislabelling is a recall event with FSA involvement and direct retailer liability. PAO mistakes in beauty are paperwork issues. The food vertical creates a buyer who has *already been told by their compliance officer* that catalog data correctness matters; the beauty vertical creates a buyer who has been told it's a marketing nice-to-have. The first kind of buyer pays.

**Channel surface.** Every UK food retailer pushes data to Google Merchant Center, Amazon Fresh, Ocado, Deliveroo, and increasingly to ChatGPT-shopping and Perplexity. Every channel that delists for missing allergen data is a separate revenue stream you can quantify in the audit letter. Beauty pushes to Sephora-style channels but lacks the same regulatory-data-blocked-the-listing pattern.

**Standard authority.** UK FSA Big-14 allergens, ISO 3166-1, PDO designations, certifications taxonomy — these are *already* recognised authorities. You're standardising the *encoding* of established regulatory taxonomies into Shopify metafields. The beauty INCI/PAO/skin-type story has the same shape but smaller liability stakes per merchant.

**Action items for food-first positioning:**

- `apps/scanner/src/app/page.tsx`: Reorder the IA so the vertical picker (Food / Beauty / Apparel) appears in the hero, not the seven pillars. The pillars become a "Methodology" section linked from the footer. Specific change: replace the seven-pillar `<ol>` block (lines ~177–245 of `page.tsx`) with a three-card vertical picker. The seven pillars move to `/methodology` (new page).
- Build out food first as the deepest vertical. Apparel and beauty stay on the site but are clearly second-tier. The food page already has the strongest mistakes list in the codebase — make it deeper, not different.
- `BUSINESS.md` / `BRAND.md`: rewrite the target-customer paragraph to lead with food. The current "Shopify merchants (100–5,000 SKUs, £500K–£20M revenue)" framing in CLAUDE.md is too generic to drive a vertical strategy.

**Watch this risk.** Picking food doesn't mean killing beauty/apparel pages — they earn SEO, they catch in-bound interest, and they hedge if food doesn't compound. It means concentrating maintenance investment, content output, and outbound effort on food first. You can revisit at the 12-month gate.

---

## 4. The pricing restructure

Your `apps/scanner/src/lib/pricing.ts` is the canonical source. The current ladder is:

```
Free       £0
Growth     £79/mo    SMB <500 SKUs
Scale      £249/mo   Mid-market 500–5,000 SKUs
Agency     £499/mo   5–50 client stores
Plus       £1,500+   Shopify Plus 10,000+ SKUs
```

This prices on volume (SKUs and stores). Volume is the wrong axis when the value is regulatory complexity. A 200-SKU artisan food brand pushing to four marketplaces with ten allergen profiles is a higher-value customer than a 4,000-SKU apparel brand pushing to one channel — but your current ladder charges the apparel brand more.

**Replace the volume axis with two orthogonal axes:**

- **Axis 1 — vertical standard licensed:** Food / Beauty / Apparel / (later) Supplements / Pet / Children's products. Each vertical is priced separately because each requires separate regulatory maintenance.
- **Axis 2 — distribution mode:** Self-serve (Shopify App Store) / Concierge (your existing £97 expanding into a recurring £200–500/mo) / Embedded enterprise (the Plus tier, only sold once the embedded app ships).

**Suggested restructure (illustrative; real numbers need market test):**

```
Free                                           £0/mo
   Scanner-only. Single vertical. Public.
Food standard — single store                   £49/mo
Food standard — agency (5 stores)              £179/mo
Food + Beauty bundle (single store)            £89/mo
Food + Beauty bundle (agency)                  £299/mo
Concierge food audit + 30-day re-scan          £97 one-off (existing)
Concierge monthly retainer (1 vertical)        £249/mo
Embedded enterprise (vertical-specific)        From £1,200/mo, named contact
```

Note: the lower self-serve numbers reflect that the *vertical* is the value, not the SKU count. The Plus tier is parked until the embedded app ships (see §6).

**Why "Five tiers. One question: how many stores?" is corrosive copy:**

It signals to a sophisticated buyer that you don't understand what you're selling. A food merchant reading that line concludes: "they're a generic catalog tool, not a food specialist." It actively contradicts the vertical pages two clicks away. Replace it on the homepage with: *"Pick the standard your catalog needs. We maintain it. You stay compliant."* — or similar. The exact wording is for the Copy Council; the structural point is that the question stops being "how many stores" and becomes "which standard."

**Codebase actions:**

- `apps/scanner/src/lib/pricing.ts`: Rewrite the `TIERS` array entirely. Add a `vertical` field to each tier so the homepage can render either "all tiers" (current behaviour) or "tiers for this vertical" (new behaviour driven by the vertical picker).
- `apps/scanner/src/app/pricing/page.tsx`: Either rebuild around the two-axis grid or — interim step — add a vertical selector at the top of the page so the existing tier cards filter down to "Food", "Beauty", "Apparel", "All".
- `apps/scanner/src/app/page.tsx`: The "Five tiers. One question: how many stores?" h2 (around line 393) is the single highest-priority copy change in the codebase. Replace it before anything else.

---

## 5. The Plus tier reality fix

This is the most uncomfortable point in the report. The current `/for/plus` page describes a tier targeting Shopify Plus brands at £1,500+/mo. Your own `/research` page says:

> A meaningful share of the Shopify market — mostly the larger catalogs sitting behind enterprise bot-management — returns a block before any product page loads.

Those are the same brands. The free-scan-without-install model that is the dominant conversion path on the homepage *cannot reach the customers the Plus tier is priced for*. This is structural, not a bug. There are two clean ways out:

**Option A — Ship the embedded app to Plus reach.** The `apps/shopify-app/` Remix app is in the repo. Get it through Built for Shopify certification, get a few Plus brands installed, and Plus reach via embedded scanning becomes the primary conversion path for that tier. The public crawl becomes a marketing demo for Free/Growth.

**Option B — Delist Plus until the embedded app exists.** Move the `/for/plus` page to a "Coming soon — talk to John" gated state. Cap the published price ceiling at Agency (£499/mo) until the embedded path ships. This is honest. Listing a tier you cannot fulfil through your own conversion path is worse than not listing it.

**Option C is not a real option.** Currently the site is doing C: list the tier, rely on inbound to convert. Inbound from Plus brands does not happen because the conversion surface is the public scanner that cannot read their store. You're paying SEO and design cost for a tier that converts at near-zero.

**Recommendation:** Option B for the next 90 days, then Option A. Specifically:

- `apps/scanner/src/app/for/plus/page.tsx`: Reframe to "Plus is in private beta — talk to John before signing with a £2k/mo discovery platform." Remove the £1,500+ pricing display until the embedded app is installable. This is closer to honest.
- `apps/scanner/src/lib/pricing.ts`: Mark the `plus` tier `featured: false` and add a `betaGated: true` field. Don't render it in the homepage strip until embedded is live.
- Add a 90-day target to ship the embedded Shopify app's first installable build with food-vertical scoring active. That unlocks both Plus reach *and* the bot-blocked TAM.

---

## 6. Distribution

The conversation correctly flagged that Shopify App Store policy prohibits duplicate listings, so the "list the same app under three vertical positionings" idea is out. What is in:

**Single Shopify App Store listing.** Position it around food-and-drink (because that's the spearhead), with Beauty and Apparel mentioned as additional verticals supported. This is a single listing with vertical specialisations, not three listings. App Store SEO favours specificity in screenshots and the app description over generic positioning.

**Public quarterly "State of Shopify Catalogs" report.** You already have this scaffolded: `apps/scanner/src/app/research/page.tsx` plus `apps/scanner/src/app/api/benchmark/summary/route.ts`. The piece that's missing isn't the surface — it's the **commitment to publish quarterly with a fixed date** so journalists, trade bodies, and Shopify ecosystem people learn to expect it. Add a "Next refresh: [date]" line to `/research` and honour it. Quarterly cadence beats annual because four chances/year to land in trade press is materially better than one.

**Leaderboard SEO play.** Your `/score/[shop]` page is a publish-by-merchant-opt-in shareable score. It's currently configured to be `index: false` in metadata when not published, which is correct, and indexable when published. As more merchants opt in, you accumulate hundreds of high-quality `flintmere.com/score/<store>` URLs that rank for `<store> reviews / catalog quality / AI-readiness`. This is a real SEO moat that Shopify won't build because they won't grade their own merchants. Keep it. The opt-in design is also defensible — you cannot grade someone publicly without their consent.

**The standards publication.** This is the centrepiece of the moat thesis. See §7.

**What you do NOT need:**

- Paid ads on the Shopify App Store. Wait until Built for Shopify is achieved; then maybe.
- A YouTube channel. Founder time is the bottleneck; YouTube doesn't earn out at this stage.
- A Discord/Slack community. Ditto. Concentrate community in your inbox until you have 50 paying customers per vertical.

---

## 7. The standards publication — the single most important strategic move

The earlier critique correctly refined "open-source the standard" into "publish schemas and definitions, keep scoring logic and remediation proprietary." This is right. The maintenance is the moat, not the snapshot.

**What to publish (open):**

- The *definition* of the Flintmere Food Catalog Standard as a versioned, dated, machine-readable document.
- Field definitions: every Shopify metafield with regulatory mapping (UK FSA Big-14, ISO 3166-1, PDO list, certifications taxonomy).
- Examples: structured JSON examples of "good" products by archetype.
- Migration notes: when the standard changes (e.g., FSA precautionary allergen rule update), publish a dated diff.
- A public changelog. W3C-style. Dated, signed, stable URLs.

**What stays proprietary:**

- The scoring rubric (how each gap maps to a points deduction).
- The remediation prompts (how Flintmere generates the fix CSV).
- The benchmark dataset (who scored what).
- The fix-quality LLM evaluation.

**Suggested location:** `standards.flintmere.com` (new subdomain) or `flintmere.com/standards/food/v1` (path on the marketing site). The former is more authoritative; the latter is faster to ship.

**The publishing cadence is what makes it a standard.**

A snapshot is a document. A maintained, dated, diffed, versioned, regulator-tracked living document is a standard. The maintenance commitment is what compounds. This is also why it's not free to do — see §9 on the FTE cost.

**Codebase action:**

- Create `apps/scanner/src/app/standards/food/v1/page.tsx`. First version is the food standard as it exists in your scoring engine, written in human-readable form with ISO/FSA references.
- Create a JSON-LD machine-readable version at `apps/scanner/src/app/standards/food/v1/spec.json/route.ts` (or similar).
- Add a "Published standard" link to the homepage footer and to `/for/food-and-drink`.
- Add a `STANDARDS-CHANGELOG.md` to the repo root. Every standard update is a dated entry.

**Why this matters more than anything else in §6:** the standards publication is the artifact a third party can cite *unprompted*. It is the only thing on your site that someone else can reference in their own documentation and create the proof condition in §2. Without it, the 12-month gate cannot pass, because there is no canonical document for them to cite.

---

## 8. Founder and entity verifiability

The earlier conversation flagged that "Eazy Access Ltd doesn't surface cleanly on Companies House" and that there's no public footprint tying John Morris to Flintmere. This isn't a strategy issue — it's a procurement gate.

Any £499+/mo or £1,500+/mo buyer with functioning legal review will run three checks in the first 10 minutes of due diligence:

1. **Companies House lookup on Eazy Access Ltd** — confirms registration, address, accounts status.
2. **LinkedIn lookup on John Morris + Flintmere** — confirms the founder is a real person publicly associated with the brand.
3. **Trade-name lookup** — confirms "Flintmere is a trading name of Eazy Access Ltd" is registered as a trade name (it's a UK soft requirement, not strict, but it surfaces on legitimacy checks).

Your `/security` page is unusually candid about being a small team — this helps. But the Companies House gap and the LinkedIn gap are the two specific things that will block a procurement reviewer.

**Action items:**

- Add a footer link to the Companies House page for Eazy Access Ltd. Make it prominent. Procurement reviewers actively look for this; not having it is a yellow flag.
- Make sure John Morris's LinkedIn explicitly lists Flintmere / Eazy Access Ltd as the current role with a public profile.
- Add a "Company information" block to `/support` or `/security` listing: registered company name, company number, registered address, VAT status (or the explicit "not VAT-registered" note that's currently on `/audit`), and the Companies House link.
- If Eazy Access Ltd has any history that's awkward to surface (different former trade names, different industry), get ahead of it on `/about` (new page). Procurement that finds discrepancies independently rejects faster than procurement that reads them on your own site.

This is a cheap fix that unblocks the Agency and Plus tiers. Do it before any of the §10 90-day items.

---

## 9. Codebase change list — ordered by leverage

This section converts the strategy above into specific files. Numbers are approximate impact-per-effort. **1 = highest priority.**

### 9.1 Pricing axis change (priority 1)

**File:** `apps/scanner/src/lib/pricing.ts`
**Change:** Add `vertical` and `betaGated` fields to the `Tier` interface. Restructure `TIERS` array to lead with vertical-licensed tiers, not store-count tiers. Mark `plus` as `betaGated: true`.

**File:** `apps/scanner/src/app/page.tsx` lines ~393–398
**Change:** Replace `<h2>Five tiers. One question: how many stores?</h2>` with a vertical-led h2. Suggested: `<h2>Pick the standard your catalog needs. We maintain it.</h2>`. The exact wording is for Copy Council; the structural change is mandatory.

**File:** `apps/scanner/src/app/pricing/page.tsx`
**Change:** Add a vertical selector above the tier grid. Render filtered tier cards based on selection.

### 9.2 Homepage IA reorder (priority 1)

**File:** `apps/scanner/src/app/page.tsx`
**Change:** Replace the seven-pillar `<ol>` (the `id="pillars"` section, roughly lines 175–245) with a three-card vertical picker (Food / Beauty / Apparel). The seven pillars become a "Methodology" link in the footer or a `/methodology` page.

**Why this matters:** Currently the homepage tells a buyer "we're a generic seven-check tool." Two clicks deep, the buyer would discover you're a regulatory taxonomy specialist. The reorder closes that gap.

### 9.3 Plus tier honesty (priority 2)

**File:** `apps/scanner/src/app/for/plus/page.tsx`
**Change:** Add a private-beta gate. Remove the £1,500+ pricing claim until the embedded app is installable. Position as "talk to John before buying a £2k/mo discovery platform."

**File:** `apps/scanner/src/lib/pricing.ts`
**Change:** Mark `plus` tier `betaGated: true`. Hide from homepage strip rendering.

### 9.4 Standards publication (priority 2)

**Files (new):**
- `apps/scanner/src/app/standards/food/v1/page.tsx`
- `apps/scanner/src/app/standards/food/v1/spec.json/route.ts`
- `apps/scanner/src/app/standards/page.tsx` (index)
- `STANDARDS-CHANGELOG.md` (repo root)

**Change:** First-version food standard published as human-readable HTML and machine-readable JSON. Reference UK FSA Big-14, ISO 3166-1, PDO list, certifications taxonomy. Add a "Published standard" link to the homepage footer and the `/for/food-and-drink` page.

### 9.5 Companies House and founder verification (priority 2)

**File:** `apps/scanner/src/components/SiteFooter.tsx`
**Change:** Add a "Company information" link in the Legal column pointing to a new `/about` or `/company` page that lists: Eazy Access Ltd, company number, registered address, Companies House link, VAT status, founder.

**External:** Update John Morris's LinkedIn to publicly list Flintmere / Eazy Access Ltd.

### 9.6 The "five tiers" copy line (priority 1, but tracked separately because it's a one-line fix)

Already covered in 9.1. Calling it out again because it's the single highest-stakes line on the entire site.

### 9.7 Crawlability weight is already correct — leave it (priority N/A)

`packages/scoring/src/types.ts` already has `crawlability: 5`. The dropping from 15 → 5 is done. The strategic question is whether to drop further, e.g., to 0% (i.e., remove the pillar). The case for removing entirely:

- 90-day log studies show ~0.1% of AI bot traffic looks at llms.txt.
- It's a maintenance burden in copy and scoring.
- Keeping it suggests Flintmere believes in it, which dilutes the strategic message.

The case for keeping it at 5%:

- It's a leading indicator. If llms.txt adoption rises (it might), early-removed scoring creates a "we have to add it back" cycle.
- Removing a pillar is a bigger marketing move than reducing one.

**Recommendation:** Keep at 5% for now, but don't promote it on the homepage. Surface the seven pillars *only* on `/methodology`. Revisit the pillar count in 6 months — if llms.txt adoption is still 0.1%, drop to four pillars (identifiers, attributes, titles, mapping) plus consistency. Crawlability gets folded into "Discoverability hygiene" as a sub-check rather than a top-level pillar.

### 9.8 Add review density and inventory freshness as scored signals (priority 3)

The earlier conversation suggested replacing crawlability weight with review density and inventory freshness. This is the right *direction* but the wrong *moment*.

**Why not now:** Review density signals depend on third-party data sources (Trustpilot, Google reviews, Judge.me, Yotpo) — each is a separate integration with separate auth, rate limits, and data quality. Inventory freshness needs the embedded app to be reading live inventory. Both are 4–8 weeks of engineering each.

**Why later:** Once the embedded app is shipped (§5), inventory freshness is a 1-week add. Review density is a Q3 2026 project — bundle with the second-vertical work.

### 9.9 Reposition messaging from "invisible" to "ranked last" (priority 2)

**File:** `apps/scanner/src/app/page.tsx` line ~98 (the hero h1)

Current: *"ChatGPT lists you and every competitor. Yours ranks last."*

This is actually correct — it's already the right framing. The "invisible" language survives in `/scan` (`Is your Shopify catalog invisible to ChatGPT?` at line ~80). Update `/scan` to match the homepage frame. Consistency wins; right now you have two different positioning lines.

### 9.10 CI/CD framing fix (priority 3)

The earlier critique flagged that pitching Flintmere as "CI/CD for catalogs" is technically wrong (Shopify webhooks fire after write-commit, can't pre-block publish). The honest framing is "continuous validation with auto-revert." Where this matters in the codebase:

**File:** marketing copy on `/for/plus` and any future B2B sales materials.
**Change:** Phrases like "block bad products from publishing" become "detect bad products within seconds and revert via Flow alerts." This is closer to what the embedded app actually does.

Not urgent because the current copy mostly avoids the CI/CD framing. Worth catching when it surfaces.

### 9.11 Benchmark publish floor (priority 3) — already correct

`BENCHMARK_FLOOR=1` and `BENCHMARK_PUBLISH_FLOOR=100` in `apps/scanner/src/lib/copy.ts` are honest. Until the publish floor is hit per vertical, the page correctly frames it as "early sample." Leave this alone — the design is already tight.

---

## 10. What to stop doing

A short list. These are decisions, not aspirations.

1. **Stop pricing on store count.** "How many stores?" is the wrong question. Replace with vertical complexity.
2. **Stop selling the £1,500+ Plus tier publicly until the embedded app exists.** Listing a tier you can't fulfil is brand-damaging.
3. **Stop leading with seven pillars on the homepage.** The pillars are methodology, not the product.
4. **Stop using "invisible to ChatGPT" framing.** "Ranked last" is the honest, sharper, current-truth positioning. Pick one and consistent across all surfaces.
5. **Stop claiming attribution as a moat.** Shopify will ship attribution dashboards within 18–24 months. Catalog-data correctness is the moat; attribution is the value-add.
6. **Stop promising features in marketing that the embedded app would deliver.** The `/for/plus` page promises bulk-fix, drift control, mapping coverage — those features depend on the embedded app being live. Until it is, these are aspirational, and a sophisticated reader will spot it.
7. **Stop calling Plus a "vertical."** Per the earlier critique, Plus is a *deployment mode*. The site IA should reflect that — verticals on one axis, deployment tier on another.
8. **Stop framing benchmark data with median language until the publish floor is hit per vertical.** This is already correctly handled in code. Don't regress.
9. **Stop adding new pages on top of the existing structure.** The current site has 19 routes (11 marketing + 8 system). Until the §9 changes ship, every new page makes the IA worse.
10. **Stop maintaining all three verticals at the same depth.** Concentrate on food. Beauty and apparel get lighter touch until the food story compounds.

---

## 11. Risks the strategy assumes you can survive

The earlier review correctly flagged that the strategy doesn't address what kills the business if you execute correctly. Five real risks, in rough order of probability:

**Risk 1 — Shopify ships vertical-aware Catalog Mapping for free.** Probability: medium-high over 18 months. Mitigation: the regulatory taxonomy depth (FSA precautionary allergens, EU Cosmetic Regulation 1223/2009 amendments, PDO drift) is too vertical-specific for Shopify to invest in. Shopify's pattern is to ship the 80% generic version. The 20% regulatory tail is your moat. But: get the food standard published *before* Shopify ships its mapping update. First-mover authority compounds; second-mover authority doesn't.

**Risk 2 — A vertical PIM (TraceGains in food, Centric in beauty/fashion) extends downward into Shopify-mid-market.** Probability: medium over 24 months. These are the apex predators, not Salsify or Akeneo. They already have the regulatory taxonomies, the enterprise compliance certifications, and the customer base. Their threat is they could ship a Shopify connector for £500–1,500/mo that catches everyone above 5,000 SKUs. Mitigation: the *cheap mid-market* (£250K–£20M revenue) is too small for them to chase profitably. Stay focused on that band; don't try to compete upmarket.

**Risk 3 — Regulatory taxonomy maintenance debt compounds.** Probability: high if you don't budget for it. Maintaining FSA + EU regulatory updates per vertical is roughly 0.5–1.0 FTE per vertical. Three verticals = 1.5–3 FTE of regulatory affairs work, ongoing. This is not optional — it's the cost of being a standards business. Mitigation: budget it as a line item from day one. Expect to hire a regulatory affairs contractor before you hire a second engineer.

**Risk 4 — Built for Shopify certification doesn't materialise.** Probability: medium. The certification gate has tightened over the last 18 months. Without it, the App Store distribution path is materially weaker. Mitigation: get the embedded app through certification within 12 months; if blocked, pivot to direct outbound for Plus (slow, capital-intensive, but works for a verticalised play).

**Risk 5 — The 12-month gate doesn't pass.** Probability: unknown. Mitigation: §2 already covers this. The strategy reverts to consulting-led with SaaS as support. Plan capital expenditure with that downside scenario survivable.

---

## 12. The 90-day plan with decision gates

Three months. Three gates. If a gate doesn't pass, stop and replan rather than continuing.

### Month 1 (May 2026): Foundation

**Ship:**

- Pricing restructure (§7.1) — `pricing.ts` and `/pricing` page rebuilt around vertical axis.
- Homepage IA reorder (§7.2) — vertical picker leads, pillars demoted.
- Plus tier honesty fix (§7.3) — beta gate, no public £1,500+ price.
- Companies House + founder verification (§7.5) — footer block, LinkedIn alignment.
- The hero copy line: "Five tiers. One question: how many stores?" → replaced.

**Gate (end of Month 1):** Has the pricing page conversion rate held or improved? If it dropped >30% with the new structure, the messaging didn't carry — fix the copy before continuing. If it held, proceed.

### Month 2 (June 2026): Standards publication

**Ship:**

- Food standard v1 published at `/standards/food/v1` (§7.4).
- `STANDARDS-CHANGELOG.md` live in repo.
- Quarterly research refresh cadence committed publicly on `/research`.
- Embedded Shopify app first installable build with food-vertical scoring (start of §5 Option A).

**Gate (end of Month 2):** Has any external party referenced the food standard within 30 days of publication? If yes, you have early signal that the moat is forming. If no, *that's expected at this stage* — but track outreach: did journalists in food trade press receive the standard via personal pitch? Aim for 5+ unprompted views from outside your follower graph by end of Month 2.

### Month 3 (July 2026): Distribution

**Ship:**

- Built for Shopify submission for the embedded app.
- First quarterly "State of Shopify Catalogs — Food Edition" report, with at least 100 food stores in the dataset.
- One outbound pitch to a UK food trade publication (The Grocer, Food Manufacture, Speciality Food magazine) referencing the standard.
- First three Plus customers in private beta on the embedded app.

**Gate (end of Month 3 / 90 days):** Three checks.

1. Has the food vertical landed at least one customer at £200+/mo (paid concierge retainer or App Store)?
2. Has the embedded app passed first-round BFS review?
3. Has at least one external party (journalist, trade body, agency, vertical PIM) referenced the food standard?

If all three pass: you have early product-market fit on the standards business. Continue.

If two pass: you have signal but not enough. Keep going for another 90 days; revisit at month 6.

If one or zero pass: stop. The strategy needs revisiting. The fallback (consulting-led with SaaS support) is real and financeable.

---

## 13. What this report deliberately does not cover

To keep the report honest, here are the things this report did *not* address and why:

- **Detailed copy rewrites.** Copy is a Copy Council job, not a strategy job. The structural points (h2 line on homepage, vertical picker on hero) are flagged; the exact wording is for the copywriting cycle.
- **Specific go-to-market channels for food.** This needs market research and is Month 2–3 work, not Month 1. The right outbound channel for UK artisan food is different from the right channel for UK packaged food, and that's a research project.
- **Pricing test design.** The numbers in §7 are illustrative. The actual prices need a willingness-to-pay study with 20+ food merchants — which is itself a Month 1 project.
- **Hiring plan.** Regulatory affairs contractor is the next hire. After that depends on whether the 12-month gate passes.
- **Capital strategy.** Out of scope. The strategy survives on bootstrap if the £97 audit volume and the food-vertical SaaS conversion both grow as planned.
- **Detailed competitive positioning vs Klevu, Nosto, Profound, etc.** The earlier conversation covered the apex-predator framing (TraceGains/Centric/Specright are the real competitors, not Salsify/Akeneo or Klevu/Nosto). The customer-facing positioning is "vertical regulatory specialist," not a comparison-chart battle.

---

## 14. The final paragraph

Flintmere has good engineering hygiene, sharp design canon, and one genuinely defensible idea — the vertical regulatory taxonomies — buried under generic positioning. The strategic problem is not that the moat doesn't exist. It's that the moat isn't visible from the homepage, isn't published as a citable artifact, and isn't priced as the thing customers are buying.

The 90-day plan above corrects all three of those failures. The 12-month gate tells you whether the correction worked. If it did, you're a vertical standards business. If it didn't, you have a financeable consulting business with SaaS support. Both are real. The risk to avoid is the third path: a generic catalog scanner with vertical pages buried two clicks deep, priced on the wrong axis, with a tier nobody can buy.

Pick food. Publish the standard. Reorder the homepage. Fix the pricing line. Ship the embedded app. Verify the founder publicly. Set the gate. Run the 90 days.

Everything else is detail.

---

*End of report.*

*If anything in here contradicts something earlier in the strategic conversation, this document is the canonical version. Cross-link from CLAUDE.md if you want it referenced from the load map.*
