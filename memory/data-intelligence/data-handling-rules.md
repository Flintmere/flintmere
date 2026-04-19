# data-handling-rules.md — The law for the dept

The hard law of Data & Intelligence for Flintmere. **#24 Data protection holds VETO** on any breach. Every skill in `.claude/skills/` under this dept must comply. If a brief, spec, or readout cannot be produced without breaking these rules, the answer is: route back, escalate, or refuse.

## R1 — Aggregated only

- No skill processes shop domains, merchant emails, Shopify customer IDs, or session-level identifiers alongside behavioural data.
- Aggregation = count, sum, average, median, percentile — by surface, by route, by cohort, by tier, by vertical, by week. Never by identity.
- Minimum cohort size for any reported number: **N=50** unless report is to operator only and the small-N caveat is stated explicitly. Cohorts <50 are noise and risk re-identification.
- Bucketing schemes (retention cohorts, vertical bucketing, SKU-band grouping) require #24 sign-off. Once set, canonical; changes require new sign-off.
- **Flintmere-specific**: merchant catalog data (products, variants, metafields) is commercial data. Aggregated catalog analysis for flagship research ("State of AI Readiness in Beauty") is permitted; per-merchant catalog quoting in a public brief is not.

## R2 — Consent boundaries

- Analyses use data collected under the **live** Privacy Policy. If policy was different when data was collected, older basis applies.
- Cookie consent honoured as captured. No retroactive expansion.
- Cookie-consent rejection rate observed; **never optimised**. Any proposal to "improve" it is P0 — escalate to #24.
- Merchant email addresses for support or sales outreach are governed by B2B outreach lawful-basis, not general analytics. Don't mix.

## R3 — Source restriction

- Read-only against local exports under `context/`. No live API calls. No direct Postgres connection.
- Engineering owns the export pipeline. Data-intelligence consumes the pre-aggregated artefact.
- A new data source must be registered in `data-sources.md` with #24 + #23 sign-off before any skill references it.
- `context/` is gitignored. Verify before committing anything.

## R4 — Retention in `context/`

- Default retention of raw exports: **30 days**. Operator deletes after 30 days unless a specific brief pins a snapshot.
- Aggregated numbers extracted into `metric-catalog.md` or briefs may persist; underlying raw export removed.
- No raw export committed to git.

## R5 — Cross-source joins

- Joining two sources allowed only if **both aggregated** and join key is non-identifying (week × surface, tier × vertical, etc.).
- Joining at identity level (shop_domain × session_id) is **prohibited**. If a question requires it, escalate to #24 + engineering — they may build a one-off pre-aggregated artefact.

## R6 — External sharing

- Brief shared **internally** (operator + council) is Level 2; aggregation rules apply.
- Brief shared **externally** (transparency post, investor update, partner deck, research report) routes through `claim-review` first. Every number cited.
- Numbers shared externally come from canonical source (`metric-catalog.md`). No first-time-derived numbers in external briefs.
- No external brief names individual merchants, agencies, or agencies' clients without explicit sign-off.

### Flintmere-specific external framing

- "State of AI Readiness in [Vertical]" reports: aggregates only. No per-store scores published without that store's written permission.
- Investor updates: Agency tier metrics + PMC + MRR + retention curves are the norm. Individual agencies unnamed unless they've agreed.
- Shopify App Store advertising: claims must trace to `claims-register.md`.

## R7 — AI-outcome claims

- Any brief introducing a new AI-outcome claim (e.g., "stores using Flintmere get 3× more ChatGPT citations") routes through `security-claim-audit` and `claim-review` before publication. The claim must trace to the data.
- "AI visibility lift" figures must cite the source and qualifying context ("stores at 99%+ attribute completion in beauty vertical, n=N").
- Reliability metrics (`scan_success_rate_24h`, `webhook_delivery_success_rate`) are operational, not AI-outcome; they don't trigger the audit unless framed as outcome.

## R8 — Experiment data

- Pre-declared primary metric. No metric switching post-results.
- Pre-declared minimum observation window. No early stopping.
- Pre-declared decision rule. Post-hoc adjustment to fit the data = p-hacking. Escalate to #35.
- Inconclusive is a valid outcome. Log it. Move on.

## R9 — PII incidents

If a raw export delivered to `context/` contains unexpected PII (e.g., engineering's pre-aggregation regressed, Shopify export not stripped at import):

1. Stop the analysis.
2. Delete the export.
3. Notify operator + #24 + #4 immediately.
4. File an entry in `memory/product-engineering/incident-history.md`.
5. Do not write a brief from the offending data, even after deletion.

## R10 — Refusal

A skill that cannot complete its workflow without breaking R1–R9 must refuse and explain. Refusal beats violation. The operator decides whether to:

- re-shape the request,
- pre-aggregate differently,
- escalate to legal,
- or drop the analysis.

## VETO

- **#24 Data protection** holds VETO on:
  - Any new data source.
  - Any change to cohort bucket size or scheme.
  - Any external brief that names individuals, merchants, or agencies by identity.
  - Any analysis that joins identity-level data, even one-off.
  - Any AI-outcome claim routed externally without `claim-review` sign-off.
- **#23 Regulatory** is co-reviewer on claims with regulatory exposure; **#24's VETO is final** on privacy-related decisions.

## Maintenance

- Annual review by #24 + #23 + #35.
- A change to any rule requires an ADR in `projects/flintmere/decisions/`.
- Council-only edit; no skill modifies this file.

## Changelog

- 2026-04-19: Adapted for Flintmere. Updated authority references (#24 VETO primary; #19 removed as it was a Web3-era designation). Added Flintmere-specific external-framing rules for "State of AI Readiness" reports, Agency-tier reporting, and AI-outcome claim handling.
