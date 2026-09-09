---
canon_sources:
  - projects/flintmere/decisions/0029-retail-gate-pivot.md
  - projects/flintmere/plans/2026-09-06-retail-gate-pivot-spec.md
  - apps/scanner/src/app/page.tsx
  - apps/scanner/src/app/scan/page.tsx
  - apps/scanner/src/lib/copy.ts
  - apps/scanner/src/lib/report-email.ts
  - apps/scanner/src/lib/shopify-fetcher.ts
  - packages/scoring/src/pillars/identifiers.ts
  - memory/VOICE.md
  - memory/design/tokens.md
canon_audit_run: 2026-09-09
binding: CLAUDE.md §Binding 2026-05-09 (canon protection)
parity_note: >
  The deliverable-parity surfaces (catalog-letter/page.tsx, catalog-letter/success/page.tsx,
  concierge-email.ts) are NOT touched — this spec changes the scanner, homepage and scan-report
  surfaces, not the Catalog Letter deliverable. report-email.ts (the free scan report) IS in scope.
status: approved by operator 2026-09-09 — design ratified; implementation gated on §3
---

# Homepage thesis — replacing the suppression wedge

Executes ADR 0029 §5 ("what is retired") on the public surfaces. Ratified after a
12-unit audit, a 4-thesis adversarial panel (three refuters per draft) and a judge
pass — 32 agents, every file read in full, the decisive fact verified live.

**Verdict: no redesign.** Eleven of twelve units are copy-fix or clean; one is cut.
No layout, route, scroll mechanic, wheel geometry, OAuth section or pricing route
depends on the wedge. The skeleton stays. The *argument* — one sentence spoken in
six voices across the page — is replaced from a single chosen thesis, in one PR.

---

## 1. The finding that gates everything

**The scanner's GTIN check has never received a barcode on a public scan.**

```
shopify-fetcher.ts:125   fetches  https://{domain}/products.json
shopify-fetcher.ts:263   barcode: v.barcode ?? null      ← field is never in that response
shopify-fetcher.ts:301   type declares barcode: string | null   ← the type lied
```

Verified live on `workshopcoffee.com` (a store on the P1 target list), 2026-09-09:

| Endpoint | `barcode` in variant keys |
|---|---|
| `/products.json` | **no** |
| `/products/{handle}.js` | **yes** |

`isValidGtin` exists and works (`packages/scoring/src/utils/gtin.ts`). It is fed
`null` for every variant of every product. Every one of the 1,076 scans in the
database reported 100% missing GTIN. Every report email said so. This is a live
false claim in production that predates the pivot, and it is part of why all 131
scanned food stores scored D or F — one of four live pillars always fails.

**Consequence:** nothing in §4 may ship before the fetcher reads barcodes. §3 is the
ship gate.

---

## 2. The thesis

Chosen by the panel, not by preference. Four candidates, each drafted into all eight
slots, each attacked by a sceptical UK coffee roaster, by claim-review, and by the
375×812 conversion floor. **"boring-errors" won** — the only H1 all three lenses
accepted; the merchant lens: *"names the exact fear of someone who typed 80 barcodes
by hand off a GS1 spreadsheet."* The shipped copy is a hybrid: boring-errors' thesis
with gtin-valid's lede mechanism grafted in, and every refutation fixed.

**The thesis in one line:** *The errors that disapprove a UK food listing are boring —
a wrong barcode, a price that isn't VAT-inclusive, no unit price. We read what is
public and tell you what we found; we cannot see your Merchant Center, so we do not
guess what it costs you.*

### 2.1 The eight slots — verbatim

| # | Slot | Location | Copy |
|---|---|---|---|
| 1 | Hero H1 | `page.tsx:291-293` | `One wrong{' '}<Bracket size="saks">digit</Bracket>. Disapproved.` |
| 2a | Hero lede, mobile (24 words) | `page.tsx:310-316` | Paste your URL. We test the check digit on every barcode (GTIN) your store publishes; Google Shopping disapproves the wrong ones. Free, no install. |
| 2b | Hero lede, desktop-only `<span className="max-lg:hidden">` | same | A price that isn't VAT-inclusive, or no unit price on food sold by weight or volume, disapproves a listing too. We can't see your feed or Merchant Center, so we don't guess what any of it costs you. |
| 3 | Scan callout headline | `page.tsx:546` | Find the wrong digits on your store. |
| 4 | Manifesto close | `ManifestoChord.tsx:454-456` | `// this is a product, read as data.` / `// yours, checked to the last digit.` |
| 5 | `/scan` H1 + lede | `scan/page.tsx:111-129` | H1 identical to slot 1. Lede = slot 2a alone; drop 2b (the form is directly beneath). |
| 6 | OG headline | `opengraph-image.tsx:74` | One wrong [ digit ]. Disapproved. |
| 7 | Results verdict header | `copy.ts:261-268` `verdictHeader()` | Branching template — §2.2 |
| 8 | Report email subject | `report-email.ts:84` | Branching template — §2.3 |

The bracket noun is **digit**. `memory/VOICE.md:32` requires a noun; "suppressed" was
a participle. ≤1 bracket per section holds.

### 2.2 Results verdict header — template

Inputs (public-scan payload only, unscaled — `{total}` is `score.productCount`, the
sampled count, never `scaledSuppressionEstimate`):

- `{invalidGtin}` = `issues['invalid-gtin-checksum'].affectedCount ?? 0`
- `{missingBarcode}` = `issues['missing-gtin'].affectedCount ?? 0`
- `{missingOnly}` = products in `missing-gtin.affectedProductIds` not in `invalid-gtin-checksum.affectedProductIds` (`identifiers.ts:86,105`)
- `{noType}` = `suppressionEstimate.signals.missingGmcCategory` (until the model-retirement PR renames the source)
- Drop `grade` and `invisibleCount` from the header entirely.

**Headline** (first match wins):

1. `{invalidGtin} > 0` → *{invalidGtin} of the {total} products we read carry a barcode that isn't a valid GTIN.*
2. `{missingBarcode} == {total}` → *None of the {total} products we read carries a barcode.*
3. `{missingBarcode} > 0` → *Every barcode we read passes its check digit. {missingBarcode} of {total} products have none on at least one variant.*
4. else → *Every barcode on the {total} products we read passes its check digit.*

**Subhead** (join every sentence whose condition holds, in order):

- `{invalidGtin} > 0` → *Google Shopping disapproves a listing whose GTIN is invalid.*
- `{invalidGtin} > 0 && {missingOnly} > 0` → *{missingOnly} others have no barcode on at least one variant, which can limit where Google shows them.*
- `{invalidGtin} == 0 && {missingBarcode} > 0` → *A missing GTIN can limit where Google shows a product; it does not get it disapproved.*
- `{noType} > 0` → *{noType} products have no product type set.*
- `gmcGroundTruth === null` → *Read from your public storefront. We can't see what Merchant Center did with any of them.*
- `gmcGroundTruth !== null` → omit that line; the GMC panel speaks.

**Rules.** Never write "valid" in a clean branch — a check-digit pass is necessary, not
sufficient; GS1 registration is not tested. Never write "N GTINs" — counts are products
with ≥1 failing variant. The `ambiguousAllergen` count does **not** render in the
header (false-positive on coffee, tea, wine, honey); it stays in the pillar breakdown
with the caveat *"products containing none of the 14 regulated allergens need no
statement."* When `truncated`, keep the sampled `{total}` and let `ScanScopeLine` state
scope.

### 2.3 Report email subject — template

Number first, so it survives ~40-character mobile truncation. Replaces
`invisibleCountFor()` entirely.

1. `{invalidGtin} > 0` → *{invalidGtin} of {total} products with a barcode that isn't a valid GTIN — {shopDomain}*
2. `{missingBarcode} == {total}` → *No barcode on any of {total} products — {shopDomain}*
3. `{missingBarcode} > 0` → *Barcodes pass; {missingBarcode} of {total} products have none — {shopDomain}*
4. `{noType} > 0` → *Every barcode passes its check digit; {noType} products with no product type — {shopDomain}*
5. else → *Every barcode passes its check digit: {total} products read — {shopDomain}*

---

## 3. Ship gate — the fetcher

Nothing in §4 goes live until `shopify-fetcher.ts` reads `barcode` from
`/products/{handle}.js`. Planned separately in
`2026-09-09-fetcher-barcode-plan.md`. Design constraints for that plan:

- One extra request per product. The scan's kindness budget (`PACE_MS`, the 250/page
  cap, `maxPages=4`) applies. **Ponytail: sample, and state the sampled count** —
  `{total}` already means the sampled count, and `ScanScopeLine` already states scope.
- Fallback wording when the `.js` endpoint is blocked (password-protected or headless
  storefront): the header must say barcodes were not read, not that none exist.
- A store whose products genuinely carry no barcodes (the `.js` returns `null`) must
  land on headline branch 2, not branch 4.
- `identifiers.ts` severity is currently inverted — `missing-gtin` is *critical* above
  `invalid-gtin-checksum` at *high*. Under Google's actual behaviour that is backwards.
  Swap them in the same change.

---

## 4. Scope — one PR, after §3 lands

### 4.1 Thesis slots
Slots 1–8 as tabled in §2.1.

### 4.2 Same-PR contradictions (the scan result must not contradict the hero)
- `copy.ts:287` `SUPPRESSION_LEDE_EYEBROW` "Likely suppressed in Google Shopping" — remove with SuppressionLede.
- `copy.ts:126,138` pillar descriptions ("the codes AI shopping agents use", "robots rules, sitemaps, llms.txt") — rewrite.
- `copy.ts:160,192` "invisible" sentences — remove.
- `copy.ts:197-206` GPTBot / llms.txt issue titles — rewrite to crawlability without llms.txt.
- `methodology-data.ts:32` → *An invalid identifier gets a product disapproved; a missing one limits where it shows.* `:46` — remove the "invisible to a query" line.
- `app/score/[shop]/page.tsx:64,135` — drop "the seven checks AI shopping agents use" and the llms.txt mention.
- `app/about/page.tsx:144-145` — the company purpose statement; rewrite to the §2 thesis register.
- `app/pricing/page.tsx:52` "Fake barcodes get listings suppressed" → *disapproved* (a fake GTIN is an incorrect one).
- `app/for/plus/page.tsx:20-30` — llms.txt scoring claim and "invisible to every GPT-powered shopping surface"; remove.
- `app/for/food-and-drink/page.tsx:51,89`, `app/for/apparel/page.tsx:58,74` — "invisible to agents/the filter"; rewrite.
- `app/research/components/BodyTop.tsx:228`, `BodyBottom.tsx:431,485` — AI-agent framing and llms.txt; rewrite.
- `components/methodology/BottomChapters.tsx:79` — roadmap item "Real-time GMC suppression status"; remove.
- `app/sitemap/page.tsx:272` — "Phase 2 (post-ingestion-engine, June 2026) lands the actual standard" — the standard is published; fix.
- `MerchantCenterSection.tsx:44` `reason: 'Missing GTIN'` under Disapproved → `'Invalid GTIN'`.

### 4.3 Cuts
- `git rm apps/scanner/src/components/scan/SuppressionLede.tsx` (184 lines; both render states are the wedge). `Results.tsx:32` import and `:78-92` mount block go with it.
- `git rm apps/scanner/src/app/scan/opengraph-image.tsx`; in `scan/layout.tsx` delete `:21-34` (the OG/Twitter override whose stated purpose at `:9-11` is the wedge) and rewrite `:20` to slot 2a. `/scan` inherits the root card.
- `FounderStrip.tsx:66-71` — the *"£3,240/mo — Suppressed listings recovered"* panel. Two panels remain, satisfying the ≥2vh runway rule at `:16-17`. `:64` and `:270-272` — relabel from *"Anonymised composites — not named case studies"* to *illustrative*; there are no customers to composite.
- `packages/ui/src/SiteFooter.tsx:151-157` — the *"App (Plus beta)"* link; the app is retired as a near-term deliverable (ADR 0029 §5).

### 4.4 Tests that are supposed to fail, then be rewritten
- `lib/copy-revenue-lede.test.ts:23-25,38,48` — asserts the "annual demand at risk while these stay suppressed" string.
- `lib/report-email.test.ts:88` — asserts subject contains "invisible to AI agents".
- `lib/copy-integrity.test.ts:4,47-48` — imports `SUPPRESSION_LEDE_SUBHEAD`; breaks at import if the export goes. **Decision: keep the `copy.ts` exports as dead code, delete the SuppressionLede component; the model-retirement PR removes the exports and their tests together.**
- `app/api/scan/route.test.ts:115-130` — asserts `suppressionEstimate` on the payload; safe while the field stays.
- `app/page.hero-fold.test.ts` — checks `lg:min-h-screen` only; safe.

### 4.5 Out of scope, deliberately
- **`suppressionEstimate` / `aov-estimate` model retirement** (`run-scan.ts:129-182`, `packages/scoring/src/pillars/suppression-estimate.ts`, `aov-estimate.ts`, `index.ts:9`, `api/scan/route.ts:150-154`, `copy.ts:287-505`, `gmc-copy.ts` truncatedNote). Own tests, own PR. This PR removes every *render* of the model; the model itself keeps computing into fields nothing displays.
- **`crawlability.ts` llms.txt scoring** (`:8,12,87-110` — 40/100 points). Engine change with scoring consequences; goes with the model-retirement PR. The *copy* about llms.txt goes now.
- **`/methodology:354`** names Ocado as a standard channel. Borderline, not a false claim, and the only public Ocado mention. Left; conscious keep.

---

## 5. PillarWheel — the split (in scope by operator instruction)

Actual total **1,296 lines** across `PillarWheel.tsx` (1,010), `PillarWheelScrollPin.tsx`
(153), `PillarAccordion.tsx` (109), `LazyPillarWheelScrollPin.tsx` (24). Project rule:
no file over 600 (CLAUDE.md §five workflow rules #2). All moves, no rewrite.

| File | Est. lines | Responsibility | Moves from |
|---|---|---|---|
| `pillar-wheel-geometry.ts` | 80 | Pure wedge geometry: constants, `polar()`, `annulusWedge()`, `buildWedges()`, `WedgeGeo` | `PillarWheel.tsx` L61–135 |
| `pillar-wheel-variants.ts` | 95 | Motion vocabulary shared by wheel, panel and modal: easing tuples, the twelve `Variants` tables, `viewportConfig` hoisted from L326 | L137–220, L326 |
| `PillarSpotlightPanel.tsx` | 180 | Desktop spotlight panel (the `aria-live` section) | L551–710 |
| `PillarSpotlightModal.tsx` | 330 | Fullscreen deep-dive dialog; owns `closeRef`, `modalTitleId`, body-scroll lock, the modal `useEffect` from L307–322 | L713–1007 |
| `PillarWheel.tsx` | 370 | What remains: `PillarSpec` (re-exported — page.tsx, Accordion and ScrollPin import from here), state, wheel SVG, composition inside `MotionConfig` | — |
| `pillar-wheel-geometry.test.ts` | 40 | **New.** `buildWedges` on the seven page.tsx weights sums to 360°; every path is a closed annulus wedge | — |

**Seams, by line:** L59/61 type↔geometry · L135/137 geometry↔motion · L220/222 config↔component · L305/307 `handleKey`↔modal effect · L549/551 wheel column↔spotlight panel · L710/713 grid↔`AnimatePresence` · L1007/1008 modal closes↔`MotionConfig` closes.

**Shared-state rules for the split** (each is a real regression if missed):
- `modalTriggerRef` is written at two sites (panel button L682, wedge L276) and read by the modal effect cleanup (L322) for focus restore. Pass the ref down; do not duplicate it.
- The `AnimatePresence` gate moves **into** `PillarSpotlightModal`. `{modalOpen && <Modal/>}` in the parent loses the exit fade.
- The modal must render **inside** PillarWheel's `<MotionConfig reducedMotion="user">` or it silently loses the OS reduced-motion contract — Noor's veto.
- `useId` call order changes; safe only because `LazyPillarWheelScrollPin` sets `ssr:false`. Keep it that way.
- `activeId` is the `AnimatePresence` key for both the centre stack (L473) and the panel (L564). Compute once in PillarWheel, pass down.
- CSS classes `pillar-wheel`, `pillar-wedge`, `pillar-spec-trigger`, `pillar-spec-plus` live in `globals.css:1031-1067`. Move verbatim; the panel and modal keep using them.
- Chunking: all new modules are static imports of `PillarWheel.tsx`, which is the dynamic target. The split must be **chunk-neutral** — verify `page.tsx` first-load JS did not grow.

**Delete, don't move:** `PillarWheel.tsx:269-281`, the mobile-modal branch inside
`handleWedgeActivate` (`window.matchMedia('(max-width: 1023px)')` → open modal from a
wedge tap). Dead since commit `784bfd5` (2026-06-21): `PillarWheelScrollPin:93-105`
returns `<PillarAccordion/>` for every viewport below 1024px, so `PillarWheel` never
renders there. Collapse `handleWedgeActivate` to `setActive(idx)`.

**Tests:** none exist today for any of the four files. The geometry test is the only
cheap one that fits `vitest.config.ts` without a jsdom config change. Otherwise the
split is protected by `pnpm lint`, `tsc --noEmit`, `pnpm build`, the chunk-size check,
and a manual pass at 1280px (pinned wheel, modal open/ESC/focus-restore, and the
`prefers-reduced-motion` unpinned path) and 375×812 (accordion path; wheel never mounts).

**Estimate:** ~3.5 hours.

---

## 6. Verification gates before merge

1. §3 landed and deployed; a public scan of `workshopcoffee.com` shows a barcode count that is not 100% missing.
2. `tsc --noEmit` clean; `pnpm lint` clean; full test suite green with the §4.4 rewrites.
3. `pnpm build`; `page.tsx` first-load JS unchanged or smaller.
4. **Conversion floor at 375×812, measured, numbers reported:** H1 in ≤3 lines; hero lede ≤24 words visible; primary CTA bottom within 1.2 screens (today: 846px on 812 — 1.04 screens, pre-existing); every tap target ≥24×24.
5. Re-measure `/scan` H1 — `globals.css` demotes the saks bracket only under `#hero`, so on `/scan` `[ digit ]` renders at full 48px. If it exceeds 3 lines, extend the demotion selector to `#scan-heading`.
6. OG card rendered once at `fontSize 112` and eyeballed — measurements were estimates; satori may differ.
7. `canon-audit` pass on the final diff.
8. `curl https://flintmere.com/ | grep -ci "suppressed\|invisible"` returns 0.

---

## 7. Risks accepted, named

- **The common result is a pass.** Most catalogs leave barcode blank or paste a real GTIN; the paste usually returns branch 2, 3 or 4, not a wrong digit. The hero is true and the path from a clean result to the £197 letter is thin (one product-type line). Accepted — this page is not the acquisition strategy; partner-first is (pivot spec §3).
- **Diagnostics-fluent merchants** already get their invalid-GTIN list free from Merchant Center. The differentiator is pre-feed, every-variant storefront reading; the copy implies it, doesn't state it. Accepted.
- **Non-Google-Shopping merchants** have no stake in "Disapproved." Accepted per ADR 0015 target; the page self-selects.
- **320px:** *"Disapproved."* measures 292px in a 272px column and the hero's `overflow-hidden` clips it. Needs a `max-sm` font step. 375 was the floor; this is a follow-up, not a blocker.
- **Hero CTA at 846px on 812.** Structural (82px in-flow header above a `100svh` hero), pre-existing, passes at 1.04 screens with 12px of button above the fold. Separate layout ticket.
- **"passes its check digit" is deliberately weaker than "valid."** A well-formed but unregistered GTIN passes here and is later rejected by Google. The wording is precise; a merchant may still read it as cleared.
- **Desktop lede** *"We can't see your feed or Merchant Center"* is unconditional; false for the rare merchant with an active `MerchantGmcConnection` (ADR 0023). Acceptable on the pre-scan hero; **do not** copy it into results ungated (§2.2 already gates it).

---

## 8. Reconciliation owed

- `memory/marketing/seo.md` — target terms still include "ai audit app shopify"; not in scope but the About and research pages that fed them are changing.
- `CLAUDE.md` §Product snapshot — still describes the dead-inventory wedge as the conversion mechanic (already listed in the pivot spec §10).
- `packages/scoring` README — describes the identifiers pillar as reading barcodes from `/products.json`; false, per §1.
