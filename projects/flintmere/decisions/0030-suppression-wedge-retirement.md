# ADR 0030 — Retiring the suppression wedge: the surfaces, the model, and the revenue derivation

- **Status:** Accepted (ratified by operator 2026-09-10)
- **Date:** 2026-09-10
- **Number note:** Verified against `origin/main`, not the working tree — per the numbering-collision lesson recorded in ADRs 0027, 0028 and 0029. `origin/main` carries 0001–0029 (with 0012 and 0014 absent, an index gap already flagged in `decisions/README.md`); 0030 is the next free number.
- **Source:** ADR 0029 §5, plus a repository sweep on 2026-09-10 that enumerated every surviving surface. Ground truth read directly from `packages/scoring/src/pillars/suppression-estimate.ts`, `aov-estimate.ts`, `apps/scanner/src/lib/copy.ts` and the `/scan` route.
- **Council pre-flight (binding 2026-05-09):** `projects/flintmere/decisions/0029-retail-gate-pivot.md` §5 (what is retired, and why the signals fail); `memory/VOICE.md` §AI-agent outcome claims + §Overpromises (what replacement copy may assert); `memory/compliance-risk/claims-register.md` §Banned claim patterns (quantified-outcome discipline). Verified live against `https://flintmere.com/methodology` for pillar names and weights.
- **Executes:** ADR 0029 §5, second clause.
- **Amends:** ADR 0029 §5's phrase "`llms.txt` as a scored pillar" — factually imprecise; corrected below.
- **Affects:** `apps/scanner/src/app/scan/{layout,page,opengraph-image}.tsx`, `apps/scanner/src/app/page.tsx`, `apps/scanner/src/app/api/scan/route.ts`, `apps/scanner/src/components/scan/{SuppressionLede,Results,types}.tsx`, `apps/scanner/src/components/sections/FounderStrip.tsx`, `apps/scanner/src/lib/{copy,run-scan}.ts`, `packages/scoring/src/pillars/{suppression-estimate,aov-estimate}.ts`, `packages/scoring/src/types.ts`, `memory/compliance-risk/claims-register.md`, and — added during implementation, see Amendment 2 — `apps/scanner/src/lib/methodology-data.ts`, `apps/scanner/src/components/methodology/EvidenceFigure.tsx`, `apps/scanner/src/lib/outreach/template.ts`.
- **Existing customers:** none. Unchanged from ADR 0029 — Flintmere has never taken a payment from a third party.
- **Amendment 1 (2026-09-10, same day):** §2 as first ratified kept the signal counting on the stated grounds that the three signals feed the Identifiers, Attributes and Mapping pillars. Implementation disproved it. The pillars compute those signals themselves — `identifiers.ts` does its own barcode and `isValidGtin` counting, `mapping.ts` its own GMC coverage via `googleProductCategoryByProduct`, `attributes.ts` its own allergen metafield checks. `estimateSuppression` had exactly two consumers, `estimateAov` and `SuppressionLede`, both retired by this ADR. Keeping the counting would have left roughly 600 lines computing on every scan with nothing reading the result. §2 is restated below; the original rationale is preserved here as the record of what was believed at ratification.

- **Amendment 2 (2026-09-10, same day):** implementation found the wedge on two surfaces this ADR's original `Affects` list did not name, both broken rather than merely off-canon. (a) `methodology-data.ts` ships live on `flintmere.com/methodology` claiming "a missing or invalid identifier is the most common reason a product is suppressed from a feed" — which contradicts ADR 0029 premise 2 (missing GTIN yields `Limited`, relaxed from disapproval 2023-12-21; only an *incorrect* GTIN disapproves) and carries an unsourced superlative. `EvidenceFigure.tsx` quotes the same prose. (b) `outreach/template.ts` sends merchants to the scan URL promising "the full breakdown including an estimated suppressed-revenue band" — a band the scanner no longer produces, so the email would promise output that cannot appear. Both are corrected in the implementation and added to `Affects`.

## Context

ADR 0029 §5 retired two things in a single sentence: "invisible to AI shopping" as positioning, and the dead-inventory wedge together with "the `suppressionEstimate` model that computes it."

It enumerated neither surface. Both stayed live. The 2026-09-10 sweep (PR #112) retired the "invisible" half across nineteen strings. This ADR does the suppression half, which is larger, because it reaches the scoring engine and a public API response rather than only copy.

### What the model actually does

`estimateSuppression` scores each product on three deterministic signals — missing GTIN, ambiguous allergen text on a food-vertical product, missing GMC category — then maps the signal count onto a probability band:

| Signals | Probability of suppression |
|---|---|
| 3 | 0.85 – 1.00 |
| 2 | 0.45 – 0.70 |
| 1 | 0.15 – 0.35 |
| 0 | 0 |

ADR 0029 premise 2 grades the load-bearing signal **False**. Missing GTIN yields Google's `Limited` status — "showing on Google, but only in some instances" — relaxed from disapproval on 2023-12-21. Only an *incorrect* GTIN disapproves. The other two signals were never independently evidenced against Merchant Center behaviour at all; ambiguous allergen text is a regulatory-completeness signal, and an empty `productType` is a proxy for a proxy.

A probability band resting on a false premise does not become defensible by being expressed as a range. The range communicated uncertainty about the count. The error was in the mechanism.

### The wedge already has two beats, and only one of them dies

This is the finding that makes the retirement surgical rather than a demolition. `suppressionLede()` returns a headline and a subline:

- **Beat 1, the deterministic anchor** — "N of your M products are missing data Google Shopping looks for." Reproducible by the merchant from their own admin. It asserts a data state and claims no suppression.
- **Beat 2, the probabilistic subline** — "Roughly X–Y are likely already suppressed today." This is the model's output.

Beat 1 survives ADR 0029 untouched. Beat 2 is exactly what ADR 0029 kills.

The codebase already recorded doubt about beat 2. The anchor was introduced because the 1-signal band's 15–35% spread "puts a ~2.3× spread on the dominant cohort" and "read as a guess" (`copy.ts` §suppressionLede, and `feedback_probability_range_in_headline_reads_as_guess.md`). The design compensated for a weak model by leading with a strong number. The compensation was sound; the model beneath it was not.

### The revenue claim is downstream

`estimateAov(catalog, suppressionEstimate)` takes the suppression estimate as an argument and produces the "Annual demand at risk" band — the `/scan` State 1 hero, per `SuppressionLede.tsx`. A revenue figure derived from a retired model inherits its retirement. This was not named in ADR 0029 and is named here.

### Deliverable parity

Checked and clean. No suppression or demand-at-risk claim appears in `concierge-deliverable.ts`, `concierge-email.ts`, or the `/catalog-letter` page. The paid deliverable never promised a suppression figure, so no refund exposure attaches to this retirement.

## Decision

### 1. `/scan` reframes to neutral catalog readiness

The Google Shopping suppression framing leaves the acquisition surface entirely. Specifically retired:

- the page title and the OpenGraph and Twitter card descriptions, all three currently reading "Which of your products are suppressed in Google Shopping today?" (`app/scan/layout.tsx`, `app/scan/opengraph-image.tsx`)
- the `[ suppressed ]` bracket at Saks scale on both `/scan` and the homepage (`app/scan/page.tsx`, `app/page.tsx`)
- the suppression lede and the demand-at-risk lede in their entirety

`/scan` leads on the seven-pillar readiness score. The bracket signature stays — the canon requires one `[ word ]` moment per surface — but it carries a word that is not a retired claim.

The deterministic anchor is not preserved as a lede. Keeping it would have been the smaller diff, but it retains a Google Shopping framing on a surface the pivot is moving away from, and it invites the probabilistic subline back the moment someone wants a sharper hook.

### 2. The suppression and AOV modules are deleted outright

*(Restated per Amendment 1. See the frontmatter for what this section said at ratification and why it changed.)*

`suppression-estimate.ts` and `aov-estimate.ts` are removed, with their types (`SuppressionEstimate`, `AovEstimate`, `RevenueEstimate`), their package exports, their tests, and their `run-scan` wiring.

The distinction that mattered — **counting products that lack a barcode is a fact; asserting what Google will do about it was the claim** — turns out not to require keeping this module. The pillars already count the facts. This module counted them a second time, from the public catalog, for no purpose but to feed the lede and the revenue band. With both retired, nothing reads it.

What survives is the pillar scoring, untouched: a merchant still learns how many products lack a barcode, lack a GMC category, or lack structured allergen data. They learn it from Identifiers, Mapping and Attributes, which is where it was always computed.

### 3. `suppressionEstimate` and `scaledSuppressionEstimate` leave the public API response

Both fields are removed from `/api/scan` (`route.ts:150-151`). This is a breaking change to a public, unauthenticated contract, taken deliberately: leaving a retired model's output in a public response is worse than the break. No third-party consumer is known to exist.

### 4. FounderStrip keeps three panels; the recovery figure changes basis

The proof ledger keeps its three-beat structure and its "Representative examples. Actual results vary per merchant" disclaimer, which Legal Council signed off and which is not at issue. The "£3,240/mo suppressed listings recovered" panel changes basis, because it illustrates a mechanism that no longer holds. The replacement figure's source is an open question below.

### 5. ADR 0029's `llms.txt` clause is corrected

ADR 0029 §5 retires "`llms.txt` as a scored pillar." There is no such pillar. `llms.txt` is a scored **check inside the Crawlability pillar**, worth 40 of that pillar's points (`llmsTxtPresent` 30 plus `llmsTxtWellFormed` 10, per `pillars/crawlability.ts`). Crawlability is 5% of the composite, so retiring the check moves roughly 2% of the total score and requires redistributing Crawlability's remaining check weights.

The seven pillars and their weights — Identifiers 20, Attributes 20, Titles 15, Mapping 15, Consistency 15, Checkout eligibility 10, Crawlability 5 — are unchanged by this ADR, and remain as published at `flintmere.com/methodology`.

## Consequences

### The scanner loses its concrete hook

"Which of your products are suppressed in Google Shopping today?" is a sharper question than "how ready is your catalog." Replacing it with a readiness score trades specificity for defensibility.

The trade is affordable on the evidence. ADR 0029 records nine real human scans in five months. The hook was not converting. Retiring a claim that was both indefensible and ineffective costs less than the record suggests it should.

### Persisted scans must tolerate the absence

Older `ScanResult` rows carry a `suppressionEstimate`. `SuppressionLede` already has a backward-compatibility path for scans persisted before `productsWithAnySignal` shipped; the re-render path at `/score/[shop]` must now tolerate the field being present in old rows and absent from new ones without crashing. Do not backfill or delete persisted rows — that is a data decision, not a copy one, and it is not taken here.

### claims-register.md carries retired entries

The "AI visibility uplift — 3–4× at 99%+ attribute completion" entry is marked **active** and cites `SPEC.md` Appendix A. It rests on the same unmeasurable premise ADR 0029 grades in premise 1. It is retired by this ADR and must be struck from the register rather than left with a stale verification date.

### VOICE.md remains self-contradicting

§Preferred positioning language offers "ChatGPT lists you and every competitor. Yours ranks `[ last ]`." as the sanctioned replacement for "invisible" — a ranking claim its own §AI-agent outcome claims bans, and one ADR 0029 premise 1 undermines. This ADR does not fix it, because the replacement positioning is unsettled. Until it is reconciled, that line is not usable as replacement copy, and `claim-review` should reject any draft that reaches for it.

### Pillar naming drift is now more visible

With the wedge gone, the pillar names carry more of the surface. The homepage labels drift from the published canon: "Google category match" against **Mapping**, "Product IDs" against **Identifiers**, "Structured attributes" against **Attributes**, "Agent crawlability" against **Crawlability**. Reconcile to `flintmere.com/methodology` when the reframe lands.

## Open questions this ADR does not settle

- **What replaces the acquisition hook.** A readiness score is a measurement, not a reason to act. ADR 0029's answer is passage through a retailer product-data gate, but the Booths diagnostic that would make that concrete is spec P1b and unbuilt. `/scan` is therefore interim by construction.
- **Whether the seven-pillar model survives the pivot at all.** ADR 0029 §Decision 1 sells knowledge of an unpublished retailer schema. The pillar model measures agent-readiness, which is a different thing. Leading `/scan` on the pillar score may be a bridge rather than a destination. Do not re-anchor the marketing site on the pillars until this is settled.
- **The FounderStrip replacement figure's source.** No third-party engagement exists. Any figure is necessarily modelled, and modelling is what this ADR just retired. The honest options are a non-monetary proof beat or dropping to two panels; both were considered and neither was chosen, so this returns to the operator.
- **Whether `llms.txt` remains a scored check at reduced weight or is removed outright.** Crawlability's five checks total 100 points; `llms.txt` holds 40 of them. Removing it either drops the pillar's maximum to 60 or redistributes those 40 across the surviving three (`aiAgentsAllowed` 30, `sitemapPresent` 20, `sitemapReferenced` 10). The two produce different scores for the same catalog, so the choice is not cosmetic.
