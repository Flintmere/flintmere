# finance-baseline.md — Finance pointers + formulae

This file holds the **pointers and formulae** for finance. The actual numbers live in operator-maintained snapshots and in `metric-catalog.md` (revenue side). `finance-snapshot` reads this file to know **where to look** and **how to compute**.

## Single source of truth pointers

| What | Where | Refresh |
|---|---|---|
| MRR / ARR | `metric-catalog.md` → `mrr`, `arr` | Weekly snapshot, month-end canonical |
| Net revenue retention (Pro + API) | `metric-catalog.md` → `nrr_quarterly` | Quarterly |
| Cash on hand | Operator-maintained pointer at `context/admin-ops/finance/cash-<YYYY-MM-DD>.md` | Updated by operator after every bank reconciliation |
| Burn rate | Computed: rolling 3-month avg of (vendor spend + people cost + other) | Monthly |
| Vendor spend | `vendor-register.md` monthly costs + actual invoices in `context/admin-ops/finance/invoices/` | Monthly |
| Grant pipeline value | `metric-catalog.md` → `grant_pipeline_value` (sourced from `memory/growth/grants-history.md`) | Weekly |
| Grant awards (closed) | `memory/growth/grants-history.md` (status = awarded) | On status change |
| Payment processor fees | Stripe export under `context/data-intelligence/stripe/` | Weekly |

`finance-snapshot` does not derive any of these independently. If a number is needed but no canonical source exists, escalate to operator + #35 to define it (route through `define-metric` if it's a metric).

## Runway formula

```
runway_months = cash_on_hand / monthly_burn

monthly_burn = mean(monthly_total_spend, last 3 months)

monthly_total_spend = vendor_spend + people_cost + other_opex

(if MRR is material)
net_burn = monthly_total_spend - mrr
adjusted_runway_months = cash_on_hand / max(net_burn, monthly_total_spend / 4)
```

Notes:
- Use **gross burn** for the conservative number; report **net burn** as a secondary observation.
- Floor net burn to (gross / 4) when computing adjusted runway, to avoid wildly optimistic readings during MRR spikes.
- **Three-month rolling average** smooths one-off spikes (e.g., annual vendor invoice).
- Grant awards count as cash on receipt; pipeline value does not extend runway directly — it's a secondary observation with probability weighting.

## Burn cadence assumptions

- Vendor renewals occur per `ops-calendar.md`; smooth across the calendar year for monthly burn estimation.
- Payment processor fees scale with revenue; track separately so they don't inflate "operations spend."
- Engineering / contracting costs (if any) — pointer to `context/admin-ops/finance/people-<YYYY-MM-DD>.md` (operator-maintained).

## What the snapshot contains (canonical sections)

`finance-snapshot` produces a brief with these sections in order:

1. **Headline** — one paragraph: cash, runway, MRR trend, biggest moving line.
2. **Cash + runway** — current cash, gross burn, gross runway, net burn, adjusted runway.
3. **Revenue** — MRR, ARR, NRR (latest closed quarter), trend.
4. **Spend** — vendor spend (by category), payment processor fees, people cost, other.
5. **Pipeline** — grant pipeline value (probability-weighted), partnerships in flight.
6. **Movements** — what changed since the prior snapshot (new vendor, plan change, grant decision).
7. **Watchlist** — vendors approaching renewal, contracts up for negotiation, runway dipping below threshold.
8. **Action items** — operator decisions needed (cancel X, renegotiate Y, file grant Z).

## Internal vs external

- **Internal snapshot (default):** full numbers, all sections.
- **External snapshot (investor update, board memo):** routes through `claim-review` + `writer` for narrative framing. Numbers identical; framing differs.
- **Public transparency snapshot (e.g., RPGF report):** routes through `claim-review` + `writer` + `policy-alignment` if posted to a platform with content rules. Aggregated only; no per-customer detail.

## Privacy + aggregation

- All revenue numbers are aggregated. No customer named in a snapshot.
- Vendor cost is aggregated by vendor, not by invoice line.
- Grant pipeline cites programmes by name (those are public), never inquiry contact persons.
- If a snapshot must reference a single notable customer (e.g., a Sentinel design partner), the customer is anonymised ("a Sentinel design partner") unless they've explicitly authorised being named.

## Watchlist thresholds

- Runway < 6 months → P0 escalation in headline.
- Runway < 12 months → P1 in watchlist.
- A single vendor exceeding 30% of monthly spend → flag for negotiation.
- Vendor renewal within 30 days → flag for `vendor-review`.
- MRR contraction (negative WoW for 4+ weeks) → flag + cross-link to `cohort-retention` (Pro D30 / D90).

## Anti-patterns

- Reporting MRR as ARR / 12 when ARR was derived from MRR (circular).
- Counting grant pipeline as cash.
- Reporting net burn without gross burn alongside.
- Single-month spike treated as the new burn rate.
- Snapshot that doesn't end with a list of operator decisions.

## Maintenance

- Quarterly review of formulae by #36 + #11 + #35.
- Annual review by #9 (treatment of grants, deferred revenue, accounting basis).
- Pointer changes (e.g., switching from Stripe to a new processor) require an ADR.
