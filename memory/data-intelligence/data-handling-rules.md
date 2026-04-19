# data-handling-rules.md — The law for the dept

This file is the hard law of Data & Intelligence. #24 has VETO on any breach. Every skill in `.claude/skills/` under this dept must comply. If a brief, spec, or readout cannot be produced without breaking these rules, the answer is: route it back, escalate, or refuse.

## R1 — Aggregated only

- No skill processes wallet addresses, IP addresses, customer emails, customer IDs, or session-level identifiers alongside behavioural data.
- Aggregation = count, sum, average, median, percentile — by surface, by route, by cohort, by tier, by week. Never by identity.
- Minimum cohort size for any reported number: **N=50** unless the report is to the operator only and the small-N caveat is stated explicitly. Cohorts smaller than 50 are noise and risk re-identification.
- Bucketing schemes (e.g., scan-return cohort bucketing) require #19 sign-off. Once set, the bucket scheme is canonical; changes require a new sign-off.

## R2 — Consent boundaries

- Analyses use data collected under the **live** Privacy Policy. If the policy was different when the data was collected, that older basis applies.
- Cookie consent is honoured as captured. We do not retroactively expand the lawful basis.
- The cookie-consent rejection rate is observed; never optimised. Any proposal to "improve" it is a P0 — escalate to #24.

## R3 — Source restriction

- Read-only against local exports under `context/`. No live API calls. No direct Postgres connection.
- Engineering owns the export pipeline. Data-intelligence consumes the pre-aggregated artefact.
- A new data source must be registered in `data-sources.md` with #19 + #24 sign-off before any skill references it.

## R4 — Retention in `context/`

- Default retention of raw exports in `context/`: **30 days**. Operator deletes after 30 days unless a specific brief pins a snapshot.
- Aggregated numbers extracted into `metric-catalog.md` or briefs may persist; the underlying raw export is removed.
- No raw export is committed to git. `context/` is gitignored; verify before commit.

## R5 — Cross-source joins

- Joining two sources is allowed only if **both** are aggregated and the join key is non-identifying (e.g., week × surface).
- Joining at identity level (e.g., customer_id × session_id) is **prohibited** in this dept. If a question requires identity-level join, escalate to #19 + #24 + engineering — they may build a one-off pre-aggregated artefact.

## R6 — External sharing

- A brief shared **internally** (operator + council) is Level 2; aggregation rules apply.
- A brief shared **externally** (transparency post, investor update, partner deck) routes through `claim-review` first. Every number cited.
- Numbers shared externally must come from the canonical source (`metric-catalog.md`). No first-time-derived numbers in an external brief.
- No external brief names individual customers, individual partners (without their sign-off), or individual contributors (beyond what's already public).

## R7 — Security claims

- Any brief that introduces a new security-related metric (e.g., "we flag X% of malicious approvals") routes through `security-claim-audit` before publication. The claim must trace to the code.
- Reliability metrics (scan success rate, webhook delivery) are operational, not security claims; they don't trigger the audit unless framed as protection.

## R8 — Experiment data

- Pre-declared primary metric. No metric switching after results land.
- Pre-declared minimum observation window. No early stopping.
- Pre-declared decision rule. Decisions adjusted post-hoc to fit the data are p-hacking — escalate to #35.
- Inconclusive is a valid outcome. Log it. Move on.

## R9 — PII incidents

- If a raw export delivered to `context/` contains unexpected PII (e.g., engineering's pre-aggregation regressed), the protocol is:
  1. Stop the analysis.
  2. Delete the export.
  3. Notify the operator + #19 + #24 + #4 immediately.
  4. File an entry in `memory/product-engineering/incident-history.md`.
  5. Do not write a brief from the offending data, even after deletion. The underlying record is suspect.

## R10 — Refusal

- A skill that cannot complete its workflow without breaking R1–R9 must refuse and explain. Refusal beats violation. The operator decides whether to:
  - re-shape the request,
  - pre-aggregate differently,
  - escalate to legal,
  - or drop the analysis.

## VETO

- **#24 Data protection** holds VETO on:
  - Any new data source.
  - Any change to cohort bucket size or scheme.
  - Any external brief that names individuals or quotes user content.
  - Any analysis that joins identity-level data, even one-off.
- **#19 Privacy / GDPR** is a co-reviewer; #24's VETO is final.

## Maintenance

- Annual review by #19 + #24 + #35.
- A change to any rule above requires an ADR in `projects/allowanceguard/decisions/`.
- Council-only edit; no skill modifies this file.
