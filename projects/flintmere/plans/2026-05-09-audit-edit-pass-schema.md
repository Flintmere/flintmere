# Audit-draft edit pass — operator schema (v1.1)

> 2026-05-09 — frozen with the £197 deliverable spec. Run this against
> every paid audit before send. The Gemini draft is the raw material;
> this schema is what makes it shippable as a Flintmere deliverable.
>
> **v1.1 update (2026-05-09 evening)**: folded four corrections from
> the audit-engine v2.1 delta after re-reading `flintmere.com/methodology`
> as the canonical voice + structural source. The v1 of this schema was
> written from generic LLM-deliverable instinct without first reading
> methodology — the v2.1 delta caught (a) reversed regulation-citation
> rule, (b) sharpened voice register, (c) canonical pillar-name
> enforcement, (d) install-gated handling. Changes inline below.
>
> Council pre-flight: #5 Product, #11 Founder voice, #1 Editor, #4
> Engineering, #9 Lawyer, #37 Consumer psychology, #36 Conversion,
> #18 Sales, #34 Brand voice, #39 Regulatory Affairs. Nine lenses
> converge on the same shape: verify every claim, strip every word that
> would feel out of place at dinner with the merchant, cite the canon
> confidently from a verified set, add the human note the LLM can't.

---

## Section A — Must-haves (every audit ships with these)

### Factual core
1. **Merchant domain referenced verbatim** at least three times across
   the doc — proves we read their site, not a templated send.
2. **Real product count** from the scan, not a rounded-to-50 guess.
3. **Correct grade + score** — verify against the persisted scan record
   before send.
4. **Correct vertical** — if the catalog is food-and-drink, the prose
   must talk about food-retail mechanics (allergens, FSA labelling,
   Natasha's Law, GS1 GTIN-13) not generic e-commerce.
5. **At least 3 specific issues**, each with:
   - **What** the issue is, mechanically (not "your titles are weak" —
     "your titles miss the brand prefix Google Shopping requires for
     brand-name match")
   - **Which** products are affected — actual product titles or handles
     pulled from the scan, not abstract counts ("47 products affected,
     including: 'Yirgacheffe Whole Bean 250g', 'Sidamo Espresso 1kg',
     'House Blend 500g'")
   - **Why** it matters — impact on Google Shopping suppression / AI
     shopping channels / Amazon Fresh feed eligibility, in concrete
     terms
   - **How** to fix it — a step a merchant could action this week, not
     "implement a comprehensive product data strategy"
6. **Two-beat lede on every wedge claim** — deterministic anchor first
   ("47 of your 312 products miss valid GTINs"), modelled range after
   ("which puts roughly £600–£1,200/month at risk in Google Shopping").
   See `feedback_probability_range_in_headline_reads_as_guess.md`.
7. **One operator-specific note** per audit — a sentence that signals a
   human read the site. "I noticed your About page mentions you started
   the brand because…" or "Your product photography is already the
   strongest in your category — that's an asset for the AI shopping
   channels we're talking about." This is the highest-leverage edit you
   make. The LLM can't write it.
8. **Retainer + re-scan CTA** at the end, framed as "what month 1–3 looks
   like if we keep working" — not "buy our retainer."

### Voice + structure
9. **British English throughout** — find/replace `optimize`, `colorize`,
   `favorite`, `analyze`. The audit comes from a UK-registered company.
10. **Voice register: declarative, load-bearing-claim-per-paragraph,
    occasionally aphoristic.** The reference voice is
    `flintmere.com/methodology`. Examples of the right register:
    - "Products without GTINs lose impressions before they lose ad budget."
    - "An audit that ranks well but cannot complete checkout has ranked
      itself broke."
    - "The fix here is one feed-app rule, not 80 manual edits."
    - "Fail one, lose the sale."

    Counter-examples that read too soft for the brand:
    - "It might be worth considering whether..."   (hedged, low conviction)
    - "We hope this is helpful..."                 (apologetic)
    - "Some merchants find that..."                (vague)

    Aphoristic where natural; never forced. The "calm authority" v1
    framing was incomplete — methodology voice is sharper.
11. **The structural skeleton stays** — exec summary → revenue impact →
    top priorities → per-pillar → next-steps. Don't rearrange. Don't
    merge. Don't add new top-level sections.
12. **Every confidence label preserved** — don't strip Gemini's
    confidence percentages. They calibrate trust by being honest where
    the model is uncertain.

### Canonical reference data (per `flintmere.com/methodology`)
13. **Pillar names match the methodology page exactly.** Use:
    `Identifiers`, `Attributes`, `Titles`, `Mapping`, `Consistency`,
    `Checkout eligibility`, `Crawlability`. Never paraphrase ("the GTIN
    pillar", "the category-mapping pillar"). The names match what the
    merchant sees in the scanner UI; drift is an immediate trust break.
14. **Pillar weights cited correctly when referenced.**
    01. Identifiers          20%   public
    02. Attributes           20%   install-gated
    03. Titles               15%   public
    04. Mapping              15%   install-gated
    05. Consistency          15%   public
    06. Checkout eligibility 10%   install-gated
    07. Crawlability          5%   public

    Composite: 100. Public-source pillars: 55%. Install-gated: 45%.
15. **Standard / methodology citations point to the canonical URL** —
    `flintmere.com/methodology` (live, citable);
    `standards.flintmere.com/food/v1` is target Q3 2026 and must NOT
    be cited as live before then. If the draft would cite a clause of
    the food catalog standard, write `[OPERATOR_VERIFY: standard
    clause once v1 publishes]` instead.

### Install-gated handling (free-scan vs install-full)
16. **Honour the `scan_type` input contract.** For `public` scans (the
    default for free-scan audits), data exists only for the four public
    pillars: Identifiers, Titles, Consistency, Crawlability. Attributes,
    Mapping, and Checkout eligibility are scored 0 / null / absent.

    The audit MUST:
    - Open the Executive summary with: "This is a free-scan audit
      covering four of the seven pillars (55% of the composite score)."
    - Write Top priorities ONLY for pillars with data (the four public
      ones). Don't infer install-gated findings from public-pillar data.
    - For each install-gated pillar, the per-pillar section says exactly:
      "This pillar requires the Shopify app to be installed; not measured
      in this scan." plus a one-sentence note on what the pillar measures.
    - Add one Operator TBD: "If the merchant installs the Shopify app,
      re-score for the install-gated 45% and re-issue."

    For `install_full` scans, all seven pillars are treated normally; no
    partial-coverage caveat in the Exec summary.

    **Why this rule exists**: without it, the LLM hallucinates priorities
    for pillars where it has no input data — the highest-frequency
    failure mode the v2.1 delta caught.

---

## Section B — Do-not-do-no-matter-what

### Hallucination class (kills credibility instantly)
1. **Never cite a number that doesn't trace to source data.** Every
   count, percentage, £-figure, time estimate — verifiable or out.
2. **Never name a product that doesn't exist in the catalog.** If the
   draft says "Premium Coffee Blend," verify it's actually a SKU.
   Hallucinated product titles read as fraud the moment the merchant
   ctrl-F's their own site.
3. **Cite regulations confidently FROM the verified playbook; nowhere
   else.** v1 of this schema said "default to descriptive" — that was
   wrong. Source-cited regulatory references are the published moat
   per `flintmere.com/methodology`; saying "UK food labelling rules"
   gives up the moat in the deliverable.

   **Allowed**: cite a regulation by name + number ONLY when it appears
   in `memory/canon-source-register.md` §A10 (or the future
   `regulatory_citations` playbook) with an associated source URL. Use
   the canonical short form (e.g., "EU Regulation 1169/2011 (FIC)",
   "the FSA Big-14 allergen list") and link to the source URL on first
   reference per audit.

   **Forbidden**: citing any regulation, clause, schedule, or article
   that is NOT in the verified register. If the draft would write a
   citation that isn't in the register, write `[OPERATOR_VERIFY:
   regulation reference for <topic>]` instead. The register is curated
   by #39 Regulatory Affairs council seat; assume any citation outside
   it is unreliable.
4. **Never name a specific competitor by brand.** "Workshop Coffee is
   beating you on titles" — out. "A top-quartile UK food merchant in
   your category gets this right by…" — in.
5. **Never quote a Google policy clause unless verified.** Link to the
   Merchant Center Help article instead of paraphrasing the rule from
   memory.

### Voice class (kills authority)
6. **No exclamation marks.** Anywhere. Even in the friendly closing.
7. **No emojis.** Anywhere.
8. **No "fantastic," "amazing," "excellent," "incredible."** Anywhere.
9. **No "leverage," "synergise," "optimise" as verbs**, "best-in-class,"
   "cutting-edge," "AI-powered," "next-generation," "industry-leading,"
   "world-class," "robust," "seamless," "scalable" as adjectives. Each
   of these is a tell that a human didn't pick the word.
10. **No apologetic hedging.** No "we apologise for any inconvenience,"
    no "we hope this helps," no "we regret to inform."
11. **No marketing-speak about Flintmere itself.** The merchant doesn't
    care that we're a "vertical-specialist commerce-data platform." Talk
    about their catalog, not our company.
12. **No second-person flattery.** "You have a wonderful brand" — out.
    Compliment via specifics ("your product photography is already the
    strongest in your category"), never via adjective.

### Promise class (kills trust + creates legal exposure)
13. **No outcome promises.** "You will see a 30% lift" — out. "Merchants
    who fix the top-3 issues at this score typically see suppression
    drop materially within the first re-index cycle" — acceptable
    (qualified, calibrated).
14. **No competitor comparisons by name.** Defamation risk if our score
    is wrong.
15. **No SLA promises in the audit body.** ("We respond within 24
    hours.") Those live on /audit, not in deliverables.
16. **No claims of accreditation or certification we don't hold.** No
    "ISO 27001," no "GDPR-certified" (no such cert exists), no
    "Google-approved" (no such status).

### Structural class (kills the unit-economics)
17. **No new sections.** If the LLM added a section the schema doesn't
    have, delete it. Section additions compound across audits and
    eventually require a v2 deliverable spec.
18. **No re-ordering of priorities.** If priority #2 should be #1,
    operator picks the order in the audit-draft UI BEFORE accepting
    the draft, not by hand-editing the markdown after.

---

## Section C — The high-leverage adds (where operator earns the £197)

These are things the LLM cannot or will not do well. Each one is the
difference between "computer-generated audit" and "Flintmere audit."

1. **Vertical-specific regulatory grounding.** The LLM may not know that
   the FSA requires the 14 mandatory allergens in bold and that this
   becomes a Google Shopping disapproval flag if missing from
   structured data. Operator inserts the regulatory anchor.
2. **One linked Google Merchant Center help article per top priority** —
   the merchant can click through and read the source. This is the
   single biggest credibility-builder per minute of editing time.
3. **Sequencing advice** — "do priority #1 this week before #2 — they're
   related; #2's fix is harder once #1 has propagated." LLMs tend to
   list, not sequence.
4. **Customer-context notes** — if the merchant is a small team ("you're
   running a 5-person operation per your About page, so we've put the
   highest-impact / lowest-effort fix at #1"), say so. If they have a
   dedicated catalog ops person ("your job posts mention you're hiring
   a catalog manager"), shift the framing. The LLM can't read their
   careers page and tune the audit to it.
5. **A specific weekday for the re-scan** — "re-run the free scan on
   Wednesday next week to see priority #1 reflected in your score."
   Concrete dates beat "after you ship the fixes."

---

## Section D — Send-check (run before clicking Send in Resend)

Answer YES to all sixteen before send. If any is NO, edit, re-check.

**Factual correctness**
- [ ] Every specific product named in the doc actually exists in the
      catalog (ctrl-F against the scan results)
- [ ] Every number (count, %, £-figure) traces to source data
- [ ] Every linked URL works and points to the right doc
- [ ] Every regulation citation appears in `canon-source-register` §A10
      (the verified-citations list) with its source URL on first use;
      no citation outside the register
- [ ] No `[OPERATOR_VERIFY: ...]` placeholders left in the body

**Voice + canon**
- [ ] No exclamation marks anywhere
- [ ] No emojis anywhere
- [ ] No words from the banned-adjective list (Section B §9)
- [ ] British English throughout
- [ ] Voice register is declarative + load-bearing-claim-per-paragraph
      (not consultant-diplomatic, not "calm authority" alone)
- [ ] Pillar names match canon exactly (Identifiers, Attributes, Titles,
      Mapping, Consistency, Checkout eligibility, Crawlability) — no
      paraphrased pillar names

**Coverage + structure**
- [ ] Vertical-correct prose (food merchant gets food-retail mechanics)
- [ ] If `scan_type` is public: Exec summary opens with the partial-
      coverage caveat; install-gated pillars carry the placeholder line;
      no priorities written for install-gated pillars
- [ ] At least one operator-specific note signalling a human read the
      site
- [ ] The retainer pitch at the end reads as a natural next step, not
      a sales bolt-on
- [ ] The whole doc would be defensible if the merchant forwarded it
      to their lawyer or to a competitor

---

## Section E — Time-budget framework

Target: ≤45 min per audit after one calibration run.

- 5 min — read end-to-end as a stranger; close the laptop; come back
- 10 min — hallucination + numerical-anchor verification (Sections A, B
  hallucination class)
- 15 min — voice + tone pass (Section B voice class)
- 10 min — vertical-relevance + operator-note injection (Section C)
- 5 min — final read-through + send-check (Section D)

If a calibrated audit takes >60 min, the underlying Gemini prompt needs
a fix — don't compensate by editing harder. Update the system prompt at
`apps/scanner/src/lib/audit-draft/prompt.ts` instead.

---

## Section F — Things this schema does NOT cover yet

Deliberately deferred to v2 (post first 5 sales):

1. **Worked exemplars per pillar** ("here's what a 90/100 title looks
   like in your category"). Operator raised this 2026-05-09; defer
   until we read 5 paid audits as merchants and confirm it's the
   missing piece. If yes, Shape A is hand-curated exemplars baked into
   the prompt; Shape B is auto-pull from the 156-merchant cohort by
   pillar score.
2. **GMC ground-truth integration** (per ADR 0023) — replaces the
   "estimated suppression" framing with the merchant's actual
   disapproval list. Pending OAuth flow shipping.
3. **Hosted report page with shareable URL** — replaces the Resend
   markdown body. Lands in v2 deliverable spec.
4. **PDF export** — same.
5. **Comparative quartile framing** ("you're in the bottom quartile
   for food-retail; here's the median") — needs benchmark cohort to
   be UK-food-specific (currently mostly US).

---

## Section G — v1 → v1.1 changelog (audit-engine v2.1 corrections folded)

- **§A item 10 (voice register)**: replaced "calm authority" with the
  declarative + load-bearing-claim-per-paragraph + occasionally
  aphoristic prescription, with positive + counter examples drawn from
  the methodology page.
- **§A items 13-15 (canonical reference data)**: NEW. Pillar names +
  weights + standard-citation discipline.
- **§A item 16 (install-gated handling)**: NEW. Honour the `scan_type`
  input contract; partial-coverage caveat + placeholder lines for the
  three install-gated pillars; no priorities written for pillars with
  no data. Highest-impact correction — closes the load-bearing
  hallucination hole the v1 schema left open.
- **§B item 3 (regulation citations)**: REVERSED. v1 said "default to
  descriptive (UK food labelling rules)"; v1.1 says "cite confidently
  from the verified register, OPERATOR_VERIFY anything outside it."
  Source-cited regulatory references are the published moat per
  `flintmere.com/methodology`; saying "UK food labelling rules" gives
  up the moat in the deliverable.
- **§D send-check**: expanded from 11 to 16 items to cover the v1.1
  additions (regulation citation in register, no OPERATOR_VERIFY left,
  declarative voice register, exact pillar names, scan_type handling).
- **Council pre-flight**: added #39 Regulatory Affairs (binding seat on
  regulatory-citation register curation per ADR 0019).
