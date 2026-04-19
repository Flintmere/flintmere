# experiments.md

Append-only log of Flintmere marketing experiments. Hypothesis, variant, metric, result. Most recent at the bottom.

Format:

```
### YYYY-MM-DD — <slug>

- Hypothesis: <what we expect and why>
- Variant: <what changed vs the control>
- Surface: <scanner hero | pricing page | blog header | social post | outreach subject line | email gate | …>
- Metric: <the one number that decides — from metric-catalog.md>
- Observation window: <start date → end date; minimum stated before launch>
- Result: <added when known — keep, roll back, inconclusive>
```

## Rules

- One primary metric per experiment. Secondary metrics are observations, not results.
- Minimum observation window stated up front. No stopping early to catch a positive signal.
- Do not run two conflicting experiments on the same surface at the same time.
- Inconclusive is a valid outcome. Log it. Do not chase significance.
- Every experiment goes through `experiment-design` skill before launch (data-intelligence department).
- Tie every experiment back to a hypothesis derived from `metric-catalog.md` definitions.

## Experiment categories (Flintmere-specific)

- **Scanner conversion** — URL input copy, CTA wording, trust microcopy.
- **Email gate** — value proposition, gate position in the results flow, CTA language.
- **Pricing page** — tier order, badge placement, First-Month £29 promo visibility.
- **Shopify app onboarding** — install-to-first-scorecard path, initial scan priority.
- **Content** — blog post headline A/B, social post framing.
- **Outreach** — cold email subject lines + openers.

## Pre-registered experiment list (from SPEC §7.3)

| Experiment | Hypothesis | Metric | Target window |
|---|---|---|---|
| Growth tier price: £49 vs £29 vs £69 | £49 is the optimal balance of filter + conversion. | Free → paid conversion rate + 60-day retention + LTV | 30 days post-MVP launch |
| Email gate position: before vs after pillar details | Gating later (after pillar preview) improves opt-in. | Email opt-in rate | 14 days post-scanner launch |
| Bracket in scanner CTA: "Scan my store" vs "Scan `[ my store ]`" | Bracketed nouns increase CTR on B2B surfaces. | Scanner submission rate | 14 days |
| Concierge price: £97 vs £197 | £97 optimises for validation signal; £197 may filter to higher-intent. | Paid concierge conversions | 30 days |

None of these fire until their prerequisites exist (scanner live, pricing page live, etc.).

---

<!-- Appended by the conversion skill or campaign-manager after experiment approval. -->

## Changelog

- 2026-04-19: Adapted for Flintmere. Added experiment categories tied to Flintmere surfaces and pre-registered list from SPEC §7.3 pricing experiment.
