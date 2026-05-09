# Day-2 calibration checklist — matersandco dry-run

> 2026-05-10. Print or pin beside `/admin/audit-draft`. Run through this
> while editing. The 16-item send-check from
> `2026-05-09-audit-edit-pass-schema.md` §D, sequenced for the actual edit
> flow. Target: ≤45 min. If it takes >60 min, the prompt needs a fix —
> don't bandage in editing.

## Before you click Generate

- [ ] Shop URL: `matersandco.com`
- [ ] Band: 1 (≤1,500 SKUs)
- [ ] Vertical: food
- [ ] Scan type defaults to `public` — that's correct for a free-scan dry-run

## After Generate, before any editing — read end-to-end as a stranger

- [ ] Close the laptop. Walk away 5 min. Come back.
- [ ] First read: would you pay £197 for this if a stranger sent it to you?
- [ ] Note your first three reactions. They're the calibration signal.

## Pass 1 — Hallucination + numerical anchors (10 min)

The fastest credibility-kill. Verify before voice.

- [ ] **Every product title quoted in the doc exists in the catalog.** Open
      matersandco.com in a tab, ctrl-F each quoted title. If a title isn't
      verbatim on the site, replace with one that is.
- [ ] **Every number traces to source.** Counts, %, £-figures, time
      estimates — open the scan results in a second tab, verify each.
- [ ] **No `[OPERATOR_VERIFY: ...]` placeholders left in the body.**
      Replace each with the verified content, or delete the surrounding
      sentence.
- [ ] **Every regulation cited appears in `regulatory-citations.ts`** with
      its source URL on first reference. The six allowed for food are:
      EU Regulation 1169/2011 (FIC), FSA Big-14 allergen list, DEFRA UK
      Geographical Indication register, GS1 General Specifications, GMC
      Product data specification, GMC Apparel & accessories attributes.
      Anything else → delete or replace with `[OPERATOR_VERIFY]`.
- [ ] **Every linked URL works** and points to the right doc — paste each
      into a fresh tab and check.

## Pass 2 — Voice + tone (15 min)

This is where the £197 is earned.

- [ ] **No exclamation marks anywhere.**
- [ ] **No emojis anywhere.**
- [ ] **No banned adjectives**: `leverage` (verb), `synergise`, `optimise`
      (verb), `best-in-class`, `cutting-edge`, `AI-powered`,
      `next-generation`, `industry-leading`, `world-class`, `robust`,
      `seamless`, `scalable`, `fantastic`, `amazing`, `excellent`,
      `incredible`. Each is a tell that a human didn't pick the word.
- [ ] **No competitor brand names.** Replace with "a top-quartile UK food
      merchant in your category."
- [ ] **British English throughout.** Find/replace `optimize`, `colorize`,
      `favorite`, `analyze`.
- [ ] **No apologetic hedging** — no "we hope this helps," no "we apologise
      for any inconvenience," no "we regret to inform."
- [ ] **Voice register**: declarative, one load-bearing claim per
      paragraph, occasionally aphoristic. Reference: methodology page.
      If a sentence reads like a consultant deck, rewrite it.

## Pass 3 — Canon (5 min)

- [ ] **Pillar names match canon exactly** — `Identifiers`, `Attributes`,
      `Titles`, `Mapping`, `Consistency`, `Checkout eligibility`,
      `Crawlability`. No paraphrases ("the GTIN pillar" — out).
- [ ] **Coverage caveat** in exec summary body for free-scan: "This is a
      free-scan audit covering four of the seven pillars (55% of the
      composite score)."
- [ ] **Install-gated pillars** (Attributes, Mapping, Checkout
      eligibility) carry the placeholder line: "This pillar requires the
      Shopify app to be installed; not measured in this scan." No
      priorities written for these three.
- [ ] **Vertical-correct prose** — food merchant gets food-retail
      mechanics: allergens, FSA labelling, Natasha's Law where relevant,
      GS1 GTIN-13 for grocery. Generic e-commerce framing → rewrite.

## Pass 4 — Operator-specific adds (10 min) — where you earn the £197

The LLM cannot or will not do these. Each is the difference between
"computer-generated audit" and "Flintmere audit."

- [ ] **One operator-specific note** signalling a human read the site.
      Read the matersandco About page + product pages — find one specific
      observation. "I noticed your About page mentions you started…" or
      "Your product photography is already the strongest in your
      category — that's an asset for the AI shopping channels we're
      talking about." This is the highest-leverage edit you make.
- [ ] **One linked GMC help article per top priority** — the merchant can
      click through and read the source.
- [ ] **Sequencing advice on top priorities** — "do priority #1 this week
      before #2 — they're related; #2's fix is harder once #1 has
      propagated." LLMs list, they don't sequence.
- [ ] **A specific weekday for the re-scan** — "re-run the free scan on
      Wednesday next week." Concrete dates beat "after you ship the
      fixes."
- [ ] **Retainer pitch reads as natural next step**, not a sales bolt-on.

## Pass 5 — Final read (5 min)

- [ ] Read end-to-end one more time as the merchant.
- [ ] **Defensible if forwarded** — would this hold up if matersandco
      forwarded it to their lawyer or a competitor?
- [ ] **Worth £197** — yes/no. If no, where did it fall short?

## Send

- [ ] Click **Copy as markdown**.
- [ ] Resend dashboard → New email.
- [ ] To: your own inbox (Day 2 is dry-run; merchant address comes Day 3+).
- [ ] Subject: `matersandco — your Flintmere AI-readiness audit`
- [ ] Reply-to: your personal address.
- [ ] Send.
- [ ] Back in `/admin/audit-draft` → mark as **sent**.

## After send — calibration debrief

- [ ] **Read the email in your own inbox.** Phone screen if possible —
      most merchants will read it on mobile first.
- [ ] **Time the whole flow.** End-to-end clock target: ≤45 min after
      this calibration run. Note today's number.
- [ ] **List the top 3 prompt drift candidates you hit.** If any of them
      match the canon-audit's flagged P1s (product fabrication,
      competitor naming, banned adjectives, GMC clause paraphrase,
      install-gated example consistency), prompt iteration earns its
      keep before audit #2.
- [ ] **Decision**: does the v1.1 prompt + edit pass produce a £197-
      worthy audit? Yes → Day 3 outreach starts. No → iterate
      `apps/scanner/src/lib/audit-draft/prompt.ts` based on the three
      drift candidates, re-run on a second test merchant.
