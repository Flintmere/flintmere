# ADR 0031 — Closing the retail-gate pivot: Option C, and the instrument that could not see the moat

- **Status:** Accepted (operator chose this path on 2026-11-08, having been offered "probe first, decide later" instead)
- **Date:** 2026-11-08
- **Number note:** Verified against `origin/main`, not the working tree — per the numbering-collision lesson recorded in ADRs 0027, 0028, 0029 and 0030. `origin/main` carries 0001–0030 (0012 and 0014 absent, the index gap already flagged in `decisions/README.md`); 0031 is the next free number.
- **Source:** `projects/flintmere/plans/2026-11-07-demand-verdict.md`, written 2026-11-08. Every external figure in it carries a URL and a fetch date; three load-bearing claims were spot-checked against primary text independently of the agents that found them. Plus the operator's own confirmation, given 2026-11-08, that no partner or brand was contacted off-repo at any point since 2026-09-06.
- **Council pre-flight (binding 2026-05-09):** `projects/flintmere/decisions/README.md` — ADR conventions and the index gap, per `canon-source-register.md` §A13. `decisions/0029-retail-gate-pivot.md` §Decision and §Consequences — the thesis this ADR closes, and the Option C path it names as the kill route. `decisions/0030-suppression-wedge-retirement.md` — what the public surfaces now say after the wedge retirement, so that nothing retired there is reinstated here. See §Consequences for a defect found in the register itself during the pre-flight.
- **Executes:** `plans/2026-09-06-retail-gate-pivot-spec.md` §P2's own kill clause — *"no partner traction by week 8 → ADR 0029 §Consequences, Option C. Park it, stop the burn, write the closing ADR."*
- **Closes:** the pivot-spec gate clock. **G1 pass, late.** **G2 fail, forfeited.** G3, P3 and P4 never reached. Also closes **ADR 0024's Gate 2 as Fail**, retrospectively dated 2026-08-10 — first recorded in ADR 0029 §Context premise 5, logged in `STATUS.md` on 2026-11-08, never formally closed until now.
- **Does not supersede:** ADR 0029. Its eight-premise re-test, its three surviving findings and its reading of the gate stand as written, and one of them is strengthened below. This ADR closes the *programme*, not the analysis.
- **Affects:** `projects/flintmere/STATUS.md` §Adoption check log, `plans/2026-09-06-retail-gate-pivot-spec.md` (gate clock closed, not edited). **No code and no customer-facing surface changes under this ADR.**
- **Amendment 1 (2026-11-08, same day):** §Consequences claimed the register's cited `feedback_*.md` files did not exist and that the 2026-05-09 binding had been "degrading silently since May". **The files exist.** They are operator memory under `~/.claude/projects/-Users-abuaa-Projects-Flintmere/memory/`, outside the repository, and a git-history sweep confirms they were never repository files, so none was lost. The original claim came from searching the repository — which is itself the defect, because the register cites them by bare filename with no directory. The verified count is **16 citations over 14 distinct names** — 15 over 13 in the `feedback_*` form the register uses, plus one `project_*` citation in §A6 carrying the same defect — of which 12 resolve exactly as cited and 2 are miscited under a `feedback_` prefix where the file is `project_*`. The section is restated below, and the claim as ratified is preserved here as the record of what was believed. **This corrects the finding, not the decision:** §1 through §6 are unaffected, and the governance defect is real in a narrower form.
- **Existing customers:** none. Unchanged since ADR 0029. Flintmere has never taken a payment from a third party; the three `ConciergeAudit` rows marked `paid` remain operator test transactions.

## Context

ADR 0029 ratified the retail-gate pivot on 2026-09-06 and the pivot spec put a clock on it: a partner approach phase through weeks 3–8, with G2 at week 8 requiring one named firm to have agreed to route a client or listed Flintmere as a supplier.

Week 8 fell on 2026-11-01. The gate was not met, and it was not played. **Twenty-three commits** landed between the pivot's own merge commit (`4c3e20d`, 2026-09-09) and 2026-11-08: 99 file-changes in `apps/scanner`, 21 in `packages/scoring`, 11 in `projects/flintmere`, 5 in `apps/shopify-app`. Not one partner approach was made, in the repo or outside it. *(Counted here from the merge commit forward, which is the window the gate clock actually ran in. `plans/2026-11-07-demand-verdict.md` states 25 commits, counting from 2026-09-06 inclusive and so including the pivot's own three documentation commits. The shape is identical: every commit in the window is scanner copy, scoring, tests or project documentation.)*

**The distinction that governs this ADR: G2 was forfeited, not lost.** A gate that is never played returns no market information. Nine weeks produced an execution record and nothing else. That is why the decision below rests on today's research rather than on G2's outcome, which is empty.

### What the 2026-11-08 research established

**G1 passes.** Fifteen UK firms are named with an identified route in, out of roughly 102 entities enumerated with source URLs and fetch dates. The intermediary population is real and it is reachable.

**The buyer is invisible.** This is the finding that settles it, and nothing in nine months of this project had it. A brand already listed with a retailer has passed the gate. A brand not listed is blocked by the buyer meeting, not by its product data. The only buyer for this service is a brand in the weeks between winning a listing and submitting its data — a cohort with no public register, no storefront signal and no observable trigger event. Twenty-one of the thirty-two firms in the standards layer do this work in-house for exactly that reason: they are already in the room when the listing lands. Flintmere would not be.

**The price anchor is published, and the retailer owns it.** Ocado charges £100/SKU for images and £50/SKU for back-of-pack collation (Supplier Manual, verified by direct text extraction). The £100 half needs a studio, product samples, controlled lighting and dieline control — capital equipment, not software. The £50 half is given away free by Syndigo and productDNA on three major gates, so its competitive anchor is £0.

**Nobody holds the liability.** Allergen declarations carry recall and FSA exposure, and every data pool in the chain assigns accuracy liability to the supplier. No consultancy routes a client to a provider without professional indemnity cover and a contract, which means a free pilot *raises* a partner's risk rather than lowering it. Free reads as uninsured, not as cheap.

**The capacity arithmetic does not clear.** At under 10 hours a week and an optimistic 20–30 minutes per SKU with QA, capacity is roughly 20 SKUs a week. A 200-SKU brand therefore consumes ten weeks of total capacity for one one-off fee, after which the next client must be found inside the invisible cohort above. ADR 0029 premise 8 stated this constraint; today's figures price it.

### The instrument was built, and it was blind

The pivot spec's P1b diagnostic was built and run on three real UK food Shopify brands. It scored barcode presence, GTIN validity and image dimensions correctly. It reported **0% ingredients, 0% nutrition and 0% allergen declarations on all three brands.**

Those three columns are wrong. Pip & Nut's product page carries, published, a full ingredient declaration with allergens in bold, the FIR allergen formula verbatim, a cross-contamination warning and a complete nutrition table per 100g and per serving. **None of it appears in `products.json`.** Shopify keeps food regulatory data in metafields rendered into the product page, and the public catalog endpoint the entire scanner architecture is built on cannot see any of it.

The defect was found by hand-checking a product page, not by the tool. One rendered product-page fetch returns all of it; an instrument built on `products.json` never can.

## Decision

### 1. The partner-first programme is parked

`plans/2026-09-06-retail-gate-pivot-spec.md` P2, P3 and P4 are closed unexecuted. No partner approaches are made. No pricing ADR is written — ADR 0029 §4 deferred the band magnitudes to a subsequent ADR, and that deferral now stands indefinitely rather than being resolved. The ~£130/month standing cost is reduced where the operator can reach it; the recurring spend is the droplet, Postgres, Redis and Resend, not inference.

### 2. A lapsed gate closes at its date

G2 is recorded Fail on 2026-11-01 and is not re-cut. A fresh window designed now, in November, for a gate that fired on 1 November would be the fourth consecutive instance of a gate in this project failing to bind — after ADR 0019's mid-window check (never performed), ADR 0024's Gate 2 (failed unlogged), and ADR 0019's own date (closed early by ADR 0029 to avoid arriving undecided).

The precedent that gates are advisory costs more than the hosting that deferring this one would spend. This clause is the general rule, not a comment on G2: a gate that arrives unmet is closed at its date, and the decision it was written to force is taken on the evidence then in hand.

### 3. The buyer-side probe is the only work that continues

Three sends, drafted at `context/outreach/2026-11-08-buyer-side-probe.md`, roughly three operator-hours in total, to be sent by the operator. *(That path is under gitignored `context/`, per project convention for working notes, so it is a live operator file and not a repository artifact. The three sends are summarised below so this ADR stands on its own if the file goes.)*

1. An open price enquiry to the five full-service firms (Ashbury, Campden BRI, Food Alert, One Scientific, NSF), asked as someone scoping a service and **not** posing as a brand.
2. Three phone calls to brands already scanned, asking one question: who did your retailer data submission, and what did it cost. No one on this project has ever asked a brand anything.
3. An application to GS1 UK's published four-step partner programme, where the application itself is the test.

**The probe is not a condition for reversing this decision.** It is run so the record carries numbers instead of inference, and a refusal from all five firms is itself a finding about how closely the category holds its prices. Every send and every silence is logged, dated, in that file.

### 4. The reopening condition is narrow and literal

This decision returns to the table on **a named brand, with a named retailer, and a named submission deadline.** That is the only configuration in which the buyer is visible, the urgency is real and the scope is bounded. If one arrives — through the GS1 UK application, a brand phone call, or any route at all — the decision is reopened the same day. Nothing short of all three elements reopens it, and the wording is deliberate so it cannot be stretched to cover an expression of interest.

### 5. No public surface changes, and no new claim goes on one

The surfaces stay exactly as ADR 0030 left them. Nothing about the retail-gate service has ever appeared on a public surface and nothing does now. This ADR reinstates no claim retired by ADR 0029 or ADR 0030, and it adds none of its own.

### 6. The `products.json` finding is recorded as a standing architectural fact

Two consequences follow, and both outlive this ADR:

- **"Scan a storefront, show the merchant what is missing" is retired as an acquisition mechanic for regulatory fields.** The one brand hand-checked publishes its full ingredient declaration, bold-allergen formula, cross-contamination warning and a per-100g and per-serving nutrition table on the product page. Whether the other two do is **unknown** — the instrument could not see those fields on any of the three, so its zeroes carry no information either way, and only one page was read by hand. One confirmed case is enough to retire the mechanic: a diagnostic that cannot distinguish "absent" from "invisible to me" cannot be shown to a merchant. The gap this service was built on is not that the data is missing but that it is not in a retailer-submittable *form*.
- **Any future diagnostic that scores regulatory completeness must render product pages.** `products.json` can carry barcode, GTIN validity, image dimensions and title or type structure. It cannot carry allergens, nutrition or ingredients, and no amount of work on a `products.json` instrument will change that.

This **strengthens ADR 0029's surviving finding 4** — that the moat is extraction, mapping and verification rather than the upload surface — by confirming it from the merchant side, where it had only ever been argued from the retailer side.

## Consequences

### The project has no forward offer

Stated plainly, because the alternative is a document that reads as a pause. The subscription ladder was retired by ADR 0029. The suppression wedge was retired by ADR 0030. The retail-gate service is parked by this ADR. What remains live is the seven-pillar scanner as ADR 0030 left it, and ADR 0030's own open question — whether the seven-pillar model survives the pivot at all — is now unanswered with nothing queued behind it.

The scanner is therefore the whole public surface, and it is interim by construction. Do not re-anchor the marketing site on the pillars.

### The canon binding cites sources no dispatch can find in the repository

*(Restated per Amendment 1. The frontmatter carries what this section said at ratification and why it changed.)*

`memory/canon-source-register.md` carries **16 citations across 14 distinct filenames**, and **none of them is lost.** (The register's own repair note counts 15 over 13, which is the `feedback_*` subset; the fourteenth is a `project_*` citation in §A6 with the identical defect. The two counts agree.) All fourteen exist as operator memory under `~/.claude/projects/-Users-abuaa-Projects-Flintmere/memory/`. Twelve resolve exactly as cited; two carry a wrong `feedback_` prefix where the real files are `project_companies_house_13205428.md` and `project_ico_registration_position.md`. A git-history sweep — `--diff-filter=A` on `*feedback_*`, `-S` on the citation string, and a full `rev-list | ls-tree` pass — finds these paths in no commit at any point, so they were never repository files and nothing needed restoring.

**The defect is locatability, not loss.** The register names no directory, so a dispatch told to read `feedback_always_team_voice.md` searches the repository and finds nothing. Two dispatches did exactly that on 2026-11-08 — this ADR's own council pre-flight and the verdict document's canon-audit — and both concluded the files did not exist while reporting a complete pre-flight. The `remember` plugin that wrote them is disabled, so nothing puts them into a dispatch's context automatically either. How many of the dispatches since May failed the same way is not established and is not claimed here.

The register itself is repaired as of 2026-11-08: the directory is declared, the two prefixes are corrected, and the maintenance trigger now demands an existence check. The pivot spec §10, which flagged nine of these as reconciliation owed, is closed against the verified counts.

**The residual risk, and the operator's decision on it.** The binding's sources are machine-local. They sit outside the repository, outside review and outside any other machine, which means a canonical source can be cited in a shipped artifact and never be seen by anyone reviewing it.

**Decided 2026-11-08: they stay as operator memory.** The canon-bearing subset is not promoted into `memory/`, on the register's own reasoning — a repo copy would be a second copy that silently goes stale while the memory system keeps writing the original, which is the failure the register exists to prevent. The mitigation stands in place of promotion, and it is already in force on the register: **never let one of these files be the only source under a customer-facing claim.** Pair it with a repo path or a published URL. A dispatch that cannot reach the directory reports the source as unread rather than treating an empty repository search as proof the rule does not exist.

### Professional indemnity cover is a hard blocker, and its status is unknown

Whether Flintmere holds PI cover is not known to this ADR. Until it is known and in place, nothing touching an allergen declaration can be delivered to a third party, free or paid. This matters beyond the parked programme: it is a precondition on any future reopening under §4.

### ADR 0029's P0 remediation item 2 is still open

The concierge SLA cron cannot be confirmed disabled from the repository — `apps/scanner/src/app/api/cron/concierge-sla/route.ts` is present with no disable guard, and the schedule lives in Coolify. It has emailed daily since May about three operator test orders. This remains operator-owned and is now 63 days older than when ADR 0029 raised it. Do not delete the three `paid` rows without a separate decision.

### The UCP monitor stands and has not fired

ADR 0029's standing monitor — a Google- and Shopify-authored open Food spec defining allergen, nutrition or ingredient fields — was checked on 2026-11-08 against the GitHub API. **Announced only: no `food` directory exists, latest release v2026-08-25.** The monitor survives this ADR, because its firing would settle the reopening question in the negative rather than the positive, and that is worth knowing either way.

### Two carried premises were corrected

- **Booths' Retail Ready Checklist is not a schema.** Sixteen items, of which six concern product data, and two of those six are not scoreable from public data. The pivot spec's open question — whether Booths generalises — is answered: it does not, because it is not detailed enough to generalise from.
- **Booths is not the only UK retailer publishing openly.** Ocado, Co-op, Whole Foods UK, Lidl GB, Brakes and Kitwave/Creed all publish more. Ocado's Supplier Manual is the right target for any future instrument, and the Booths framing should not be carried forward.

### The gate record is now complete

`STATUS.md` §Adoption check log carried exactly one entry, from 2026-04-26, until 2026-11-08. It now carries the four gates this project has run and the three that went unlogged at the time. That log is the record; this ADR is its conclusion.

## Open questions this ADR does not settle

- **What the five full-service firms charge.** Twenty of roughly 102 firms publish nothing. §3's probe exists to answer this, and it remains unanswered until the replies arrive.
- **What Brandbank costs a small supplier.** Verified absent from every public source: the terms name the fee structure with no currency amounts across 101,667 characters, and complete archive indexes for both brandbank.com and nielseniq.com carry no pricing page at any date. It needs one merchant's invoice.
- **Whether Flintmere holds PI cover.** An operator fact, not a market question. See §Consequences.
- **How long the three surfaces stay deployed, and whether the scanner stays live.** Not decided here. §1 parks the programme and reduces cost where reachable; a decision to take surfaces down is a separate one and should be taken deliberately rather than by attrition.
- **Whether the expert hour is bought.** One hour from a GS1 UK partner manager or a named consultancy contact, asking one question: does a one-page gap list built from public product data against Ocado's published spec save them any work, and would they ever route a client to someone who produced it. Priced well under Campden BRI's published £1,300 associate floor. It was specified and not run. A yes would be the first real market signal this project has had.
