# finance-baseline.md — Finance pointers + formulae

Pointers and formulae for Flintmere finance. Actual numbers live in operator-maintained snapshots and in `metric-catalog.md` (revenue side). `finance-snapshot` reads this file to know **where to look** and **how to compute**.

## Single source of truth pointers

| What | Where | Refresh |
|---|---|---|
| MRR / ARR | `metric-catalog.md` → `mrr`, `arr` | Weekly snapshot, month-end canonical |
| Net revenue retention (per tier) | `metric-catalog.md` → `nrr_quarterly` | Quarterly |
| Cash on hand | `context/admin-ops/finance/cash-<YYYY-MM-DD>.md` (operator-maintained) | Updated after bank reconciliation |
| Burn rate | Computed: rolling 3-month average of (vendor spend + people cost + other) | Monthly |
| Vendor spend | `vendor-register.md` monthly costs + invoices in `context/admin-ops/finance/invoices/` | Monthly |
| Shopify Managed Pricing revenue share | Shopify Partner Dashboard export | Weekly |
| Stripe Agency + Enterprise + concierge revenue | Stripe export in `context/data-intelligence/stripe/` | Weekly |
| LLM spend (Vertex AI + Azure) | Google Cloud Billing export + Azure cost export | Weekly |

`finance-snapshot` does not derive any of these independently. If a number is needed but no canonical source exists, escalate to operator + #35 to define it (route through `define-metric` if it's a metric).

## Revenue streams

Flintmere has two revenue streams that feed MRR differently:

1. **Shopify Managed Pricing** (Growth + Scale) — Shopify handles billing. We get 85% of gross after $1M lifetime; 100% before. Settlement via Shopify's regular payout schedule.
2. **Stripe direct invoicing** (Agency + Enterprise + £97 concierge one-offs) — we bill directly. Standard Stripe 2.9% + 20p UK (varies internationally).

### Shopify revenue share — tracking

- Lifetime gross through Shopify Managed Pricing tracked in `context/admin-ops/finance/shopify-lifetime.md`.
- Crossover trigger: when we approach $1M cumulative, prepare the MRR drop (15% cut kicks in). Communicate internally; no customer-facing change.

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

- **Gross burn** = conservative number; **net burn** = secondary observation.
- Floor net burn to (gross / 4) when computing adjusted runway to avoid wildly optimistic readings during MRR spikes.
- Three-month rolling average smooths one-off spikes (annual vendor renewals).
- LLM spend scales with merchant count — treat as a variable cost, not fixed.

## Burn cadence assumptions

- Vendor renewals per `ops-calendar.md`; smooth across calendar year for monthly burn estimation.
- Payment processor fees scale with revenue; track separately so they don't inflate "operations spend".
- LLM spend scales with enriched merchant count. Budget line for `finance-snapshot`.
- Engineering / contracting costs (if any) via operator-maintained `context/admin-ops/finance/people-<YYYY-MM-DD>.md`.

## What the snapshot contains

`finance-snapshot` produces a brief with these sections in order:

1. **Headline** — one paragraph: cash, runway, MRR trend, biggest moving line.
2. **Cash + runway** — current cash, gross burn, gross runway, net burn, adjusted runway.
3. **Revenue** — MRR, ARR, NRR latest closed quarter, trend. Split by Shopify Managed Pricing vs Stripe direct.
4. **Spend** — vendor spend by category (hosting, LLM, email, monitoring), payment processor fees, people cost, other.
5. **LLM-specific** — spend per merchant (Vertex AI + Azure fallback), trend vs active merchant count.
6. **Pipeline** — Enterprise deals in flight, Agency-tier prospects with high likelihood.
7. **Movements** — what changed since prior snapshot.
8. **Watchlist** — vendors approaching renewal, contracts up for negotiation, runway dipping below threshold, LLM spend anomalies.
9. **Action items** — operator decisions needed.

## Internal vs external

- **Internal snapshot** (default): full numbers, all sections.
- **External snapshot** (investor update, board memo): routes through `claim-review` + `writer` for narrative framing. Numbers identical; framing differs.
- **Public transparency snapshot** (e.g., sponsorship report): routes through `claim-review` + `writer` + `policy-alignment`. Aggregated only; no per-merchant detail.

## Privacy + aggregation

- All revenue numbers aggregated. No merchant named in a snapshot.
- Vendor cost aggregated by vendor, not by invoice line.
- LLM spend aggregated; never per-merchant cost in a shared snapshot.
- If a notable merchant must be referenced (Enterprise pilot, Agency showcase), anonymise ("an Enterprise pilot in beauty") unless explicit authorisation to name.

## Watchlist thresholds

- Runway **< 6 months** → P0 escalation in headline.
- Runway **< 12 months** → P1 in watchlist.
- A single vendor exceeding **30% of monthly spend** → flag for negotiation.
- Vendor renewal within **30 days** → flag for `vendor-review`.
- MRR contraction (negative WoW for 4+ weeks) → flag + cross-link to `cohort-retention`.
- LLM spend **>2× trend month-over-month** → escalate to #17 Performance + engineering for root cause.
- Shopify lifetime gross approaching **$1M** → prepare for 15% cut.

## Anti-patterns

- Reporting MRR as ARR / 12 when ARR was derived from MRR (circular).
- Counting Enterprise pipeline as booked revenue.
- Reporting net burn without gross burn alongside.
- Single-month spike treated as the new burn rate.
- Snapshot that doesn't end with a list of operator decisions.
- Conflating Shopify's 15% cut with gross revenue (always show both).

## Maintenance

- Quarterly review of formulae by #36 + #11 + #35.
- Annual review by #9 (treatment of deferred revenue, VAT, accounting basis).
- Pointer changes (e.g., switching payment processor) require an ADR.

## Changelog

- 2026-04-19: Rewritten for Flintmere. Added Shopify Managed Pricing revenue stream + revenue-share crossover tracking. Added LLM spend as variable cost line. Removed grant-pipeline line (no Web3 grants in Flintmere plan at launch).
