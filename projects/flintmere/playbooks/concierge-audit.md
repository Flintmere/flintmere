# Concierge Audit — Methodology Playbook

**Scope.** Internal, step-by-step. How John delivers the £97 written
concierge audit. This is the source of truth — every customer-facing
surface (scanner `/audit` page, report email Door 1, concierge
confirmation email, homepage `£97` stat, EmailGate Door 1) must match
the deliverable shape defined below. If the shape changes here, update
all six surfaces in the same commit.

**Non-goal.** This is not a marketing page. It's the operator manual.
Written in the second person — "you" = John.

---

## 1. The promise, in one paragraph

For £97 the customer gets five things, delivered within **three working
days**, with a **30-day re-scan** tail:

1. A written audit letter (~1,500 words, specific products named,
   annotated screenshots).
2. A per-product fix CSV covering every product with a problem — and
   for the worst 10 offenders, the full replacement text drafted
   (title, description, metafield values) ready to paste into Shopify.
3. A one-page 30-day fix sequence ranked by unblock-count.
4. A GS1 UK barcode path specific to where the business is registered.
5. A 30-day re-scan: the scanner re-runs on day 30 and emails a
   progress report.

**No video. No call. No upsell.** The URL is all you need. Reply to
every email. (An optional 15-minute walk-through call is offered if
Calendly is configured, but the default is zero live synchronous
contact.)

**Time budget.** 90 minutes per audit. If you're over 120 minutes,
something is wrong — triage, don't go deeper. Scale depends on you
being able to ship two per working day when demand arrives.

---

## 2. Intake

Trigger: Stripe `payment_intent.succeeded` webhook fires. The scanner
auto-sends the customer a confirmation email from `hello@flintmere.com`
and an ops notification to John. Both carry the shop URL and the
Stripe payment intent ID.

Before touching the catalog, verify:

- The shop URL resolves (200 on `/`, `/robots.txt`, `/sitemap.xml`).
- The shop is Shopify (view-source for `cdn.shopify.com` references,
  or `x-shopid` response header).
- No customer has emailed back with a URL correction in the last ten
  minutes. If they have, pause — they know their own URL best.

If the URL is broken or not Shopify: reply from your inbox within the
hour. Offer a refund or a swap for a different store URL. Do not start
the audit.

---

## 3. Deep scan (step 1 — machine)

Run the scanner against the URL. This is the same scanner customers
ran on themselves — you are not producing a second scoring system, you
are reading its output more carefully than they can.

Capture, in a working doc:

- **Composite score, grade, and per-pillar breakdown.** Unlocked and
  locked pillars both.
- **Every issue** with its severity, affected count, and one example
  product (name + URL).
- **The three evidence rows** that the scanner's
  `issueCodeToFounderSpeak` translation surfaced in the customer's
  report email. These are what they already believe about their store.
  Your letter must start from them.

The scanner caps scanning for anonymous public fetches. For the
concierge audit, lift that cap: run an authenticated long-pass and
pull the full product set. Store the JSON output in
`ops/concierge/<payment-intent-id>/raw-scan.json`.

---

## 4. Catalog read (step 2 — human)

This is the step that costs £97. It is not automatable yet. Budget
**45 minutes.**

Open the store in a browser. Navigate it as a buyer would.

Check these five things in order, and take a screenshot when you find
each one:

1. **Top 10 best-selling products (or top 10 by collection rank if
   sales data isn't visible).** Are the titles spec sheets or
   marketing fluff? Is there a visible barcode, brand, and
   manufacturer part number metafield? Are structured attributes
   populated or buried in the description?
2. **A random sample of 20 products across the long tail.** Count how
   many have missing GTINs, missing brand, thin descriptions, no alt
   text on primary image. This is the real inventory health signal.
3. **Collections with >50 products.** Are they filterable on structured
   attributes? If the only filters are price and availability, agents
   see an undifferentiated list.
4. **Checkout.** Walk through to the payment step with a test product.
   Does the shop have the external product URL metafield populated
   (required for agentic checkout)? Does the cart show structured line
   items?
5. **`/robots.txt`, `/llms.txt`, `/sitemap.xml`.** Read them. Not just
   whether they exist — what they say. A robots.txt that blocks
   `GPTBot` by design is a legitimate business choice and the letter
   should reflect that, not treat it as a bug.

Every screenshot saved into
`ops/concierge/<payment-intent-id>/screens/` with a filename that
matches the issue it illustrates: `01-no-brand-navy-trainers.png`.

---

## 5. Write the letter (step 3 — human)

**Length target: 1,200–1,800 words.** Plain English. No jargon from
the scanner's `BANNED_JARGON` list (pillar, crawlability, metafield,
identifier, mapping, eligibility, ceiling, GTIN-less). Translate those
concepts into the customer-facing labels defined in
`apps/scanner/src/lib/copy.ts` (`pillarLabelCustomerFacing`,
`issueCodeToFounderSpeak`).

Structure:

```
[ domain.com — Flintmere concierge audit, {date} ]

1. Headline finding.  One sentence. The single most important thing
   you learned reading this catalog. Example: "Your top sellers are
   clean, but 78% of your long-tail products have no brand field —
   which is the first thing AI agents filter on."

2. What AI agents see first.  Three paragraphs, each one anchored to
   a specific product on their store (linked, with a screenshot).
   These are the first three gaps an agent hits. Describe what the
   agent does in response, in terms of the buyer's outcome — not the
   data model.

3. The pattern behind the gaps.  One paragraph diagnosing why this
   shape of gap exists. Most stores have a cause: a migration, a
   supplier integration, a theme template. Naming the cause earns
   trust.

4. The five things to fix, in order.  Numbered list. Each item names
   the fix, says how many products it unblocks, and links (where
   possible) to the Shopify admin page where the fix lives. Order
   them by unblock-count, not by severity — the point is to move the
   score fastest.

5. What's out of scope for this audit.  One short paragraph.
   Transparency about what you didn't check — competitor comparison,
   pricing strategy, inventory operations, fulfilment. Keeps the
   deliverable honest.

6. Sign-off.  — John Morris, Flintmere founder.  Reply direct.
```

**Rules of the letter:**

- Name specific products by their actual name, not a placeholder.
- Embed screenshots inline (one per finding, maximum six).
- Zero em-dash sentences starting "And —" or "But —". Read aloud and
  trim anything that sounds like a pitch.
- Do not say "we" — you are one person. Use "I".
- Do not promise score outcomes. Say "this fix typically moves your
  score from X-ish to Y-ish" only when the scoring model guarantees
  it.

---

## 6. Build the per-product CSV (step 4 — machine + human)

Export every product flagged by the scanner into a CSV with these
columns:

```
product_url, product_title, issue_code, issue_title_founderspeak,
severity, affected_field, current_value, suggested_value, notes
```

Pre-fill `issue_title_founderspeak` from `issueCodeToFounderSpeak`.
Leave `suggested_value` blank for everything except the **worst 10**.

**For the worst 10** (ranked by `severity × affectedCount`), write the
full replacement text yourself:

- If the issue is `title-marketing-fluff`: write a new title that
  keeps the brand, names the product type, and carries two
  distinguishing specs. ≤ 150 characters.
- If the issue is `description-too-short`: write 80–150 words of
  spec-sheet copy — material, dimensions, use-case, one use-scenario.
  No marketing adjectives.
- If the issue is `missing-brand`: fill in the brand as it appears on
  their product photos or packaging. If you cannot tell, leave blank
  and note "needs merchant input".
- If the issue is `missing-gtin`: leave blank and route them through
  step 8 (GS1 UK path).

CSV saved as `ops/concierge/<payment-intent-id>/fixes.csv`. Open it in
a spreadsheet before sending — the worst-10 drafted cells must be
visually distinct (bold or background fill) so the merchant sees
immediately which rows are ready to paste.

---

## 7. Write the 30-day fix sequence (step 5 — human)

One page. Markdown with a header per chunk. Ranked by unblock-count.

Template:

```
Day 1 — the one-click wins (≤ 30 min)
  • [what]: unblocks [n] products. [link to Shopify admin].
  • [what]: unblocks [n] products. [link].

Week 1 — bulk metadata (≤ 3 hours)
  • [what]: unblocks [n] products. Use Matrixify / Bulk Edit.

Week 2 — titles and descriptions (≤ 6 hours, split across days)
  • Start with the worst-10 drafted in the CSV. Paste and go live.
  • Then work through rows ordered by severity × affectedCount.

Week 3 — GS1 barcodes (calendar week, mostly waiting)
  • Apply for GS1 UK membership [link].
  • When codes arrive, import via [script / Matrixify template].

Week 4 — re-check and publish
  • Run the free scanner again yourself — expect X-ish grade.
  • Day 30: Flintmere re-runs automatically and emails you the result.
```

The sequence must be survivable by one merchant with no developer.
Every step that needs dev time gets flagged `dev required` explicitly.

---

## 8. GS1 UK barcode path (step 6 — human, lookup)

Look up the merchant's registered office country. Route accordingly:

- **England, Wales, Scotland, NI**: GS1 UK — https://www.gs1uk.org/
  (membership-based; tiered by annual turnover).
- **Ireland**: GS1 Ireland — https://www.gs1ie.org/.
- **USA**: GS1 US — https://www.gs1us.org/.
- **Anywhere else**: look up at https://www.gs1.org/contact/offices.

The audit letter's GS1 section says:

1. Which office they need and the direct link.
2. Which membership tier matches their turnover band.
3. How many codes they need to buy (count of flagged products +
   20% headroom for variants).
4. How to import the codes into Shopify — the Matrixify CSV column
   is `Variant Barcode`. Reference template at
   `ops/concierge/templates/gs1-import.csv`.
5. The checksum rule (modulo-10) so they can sanity-check the codes
   before uploading.

Do not sell them anything. Flintmere is not affiliated with GS1. The
letter must carry the standard disclaimer:
*"Flintmere is not affiliated with GS1. Identifier requirements vary
by marketplace and jurisdiction."*

---

## 9. Delivery (step 7 — machine)

Send from `hello@flintmere.com`. Single email thread. Subject:
`Your Flintmere concierge audit — {shop domain}`.

Email body (plain text, no marketing scaffold):

```
Here's the audit for {shop}.

Three files attached:

  1. audit-letter.pdf — the detailed read with screenshots (~1,500 words).
  2. fixes.csv — every flagged product, with the worst 10 drafted.
  3. 30-day-sequence.md — what to do when.

Start with day 1 in the sequence. Reply with questions — I read
every one.

— John
```

Save a copy of all three files and the email itself to
`ops/concierge/<payment-intent-id>/delivered/` before sending. This
is the audit trail.

Mark the record in the database: `concierge_bookings.delivered_at =
NOW()`, `concierge_bookings.delivery_files_uri = <path>`.

---

## 10. The 30-day re-scan (step 8 — machine)

A cron job runs at `00:15 UTC` daily and picks up every
`concierge_booking` where `delivered_at + 30 days` has passed and
`re_scan_sent_at IS NULL`. For each, it:

1. Re-runs the scanner against the shop URL.
2. Diffs the new composite score against the score captured at
   intake.
3. Emails the merchant from `hello@flintmere.com` with subject
   `{shop} — 30-day re-scan · grade {was} → grade {now}` and a short
   body describing which issues cleared, which remain, and what to
   do next.

If the score moved up: celebrate it briefly, name the top three
fixes that drove the change, invite them to upgrade to Growth if the
locked pillars now matter. If the score moved down or did not move:
ask whether they hit a blocker, offer to hop on a call.

Do not re-send the letter or CSV. Do not pitch a second audit.

---

## 11. Quality gates (before you hit send)

Before delivery, every audit must pass these six:

1. **Specificity.** Letter names at least five products by their actual
   name. Zero lorem-ipsum placeholders.
2. **Plain language.** No word from `BANNED_JARGON`. Flesch-Kincaid
   reading level ≤ 10 (paste the letter into a checker).
3. **Linkability.** Every reference to the Shopify admin or a product
   page is a live clickable link.
4. **Worst-10 drafted.** The CSV has 10 rows with full replacement
   text in the `suggested_value` column. Not 9, not 11 — 10. Pick the
   worst 10 by `severity × affectedCount`.
5. **GS1 routing accuracy.** The office named matches the merchant's
   registered country. If in doubt, don't guess — ask in the reply
   thread before delivering.
6. **Disclaimer present.** The letter carries the GS1 non-affiliation
   disclaimer and the Eazy Access Ltd legal footer.

If any gate fails, don't ship. Fix it.

---

## 12. Time budget (hard cap)

| Step | Target | Hard cap |
|---|---|---|
| 1. Intake | 5 min | 10 min |
| 2. Deep scan run | 5 min (mostly waiting) | 15 min |
| 3. Catalog read (human) | 45 min | 60 min |
| 4. Write letter | 25 min | 40 min |
| 5. Build CSV + draft worst-10 | 20 min | 30 min |
| 6. Write 30-day sequence | 10 min | 15 min |
| 7. GS1 routing | 5 min | 10 min |
| 8. QA + send | 10 min | 15 min |
| **Total** | **~125 min** | **~195 min** |

If you're trending past the hard cap on step 3 or 4, the catalog is
larger or messier than normal — escalate: email the customer, explain
the audit will take five working days instead of three, offer the
option to refund. Never silently ship a rushed audit.

---

## 13. What triggers a refund

- You can't scan the shop (not Shopify, auth wall, geo-blocked).
- You deliver late by more than one working day without warning.
- The merchant requests a refund within 14 days of delivery.

Process: Stripe dashboard → payment → refund. Note the reason in
`concierge_bookings.refund_reason`. Always email the merchant
confirming the refund the same day.

---

## 14. Governance

This playbook is canonical. If you change the deliverable shape (add
a sixth item, drop the CSV, change the 30-day tail):

1. Update section 1 of this file first.
2. Update `CONCIERGE_DELIVERABLE_LIST` in
   `apps/scanner/src/lib/copy.ts`.
3. Verify the six customer-facing surfaces still match:
   - `apps/scanner/src/app/audit/page.tsx`
   - `apps/scanner/src/app/audit/success/page.tsx`
   - `apps/scanner/src/app/page.tsx` (£97 stat + founder panel)
   - `apps/scanner/src/components/EmailGate.tsx` (Door 1)
   - `apps/scanner/src/lib/report-email.ts` (Door 1, HTML + text)
   - `apps/scanner/src/lib/concierge-email.ts` (customer confirmation)
4. Ship all in one commit. Shape-drift between this playbook and the
   surfaces is the single worst failure mode — it makes the audit
   feel untrustworthy before the customer even reads the letter.

---

## Changelog

- 2026-04-21: Initial version. Written-deliverable shape; no video,
  no call default. 90-min time budget. Six-surface sync rule.
