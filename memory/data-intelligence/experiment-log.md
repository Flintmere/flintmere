# experiment-log.md

Append-only product-wide experiment log for Flintmere. Hypothesis → variant → metric → readout → decision.

Distinct from `memory/marketing/experiments.md`:
- This log covers **product experiments** (in-app flows, onboarding, Shopify app dashboard, fix-apply UX, pricing enforcement, API console).
- The marketing log covers **marketing-surface experiments** (scanner hero, pricing page, blog headers, social copy, outreach subject lines).
- A pricing-page experiment that touches both sides is logged in **both**, with cross-link.

## Format

```
### YYYY-MM-DD — <slug>

- Skill: experiment-design (or originating skill)
- Owner: <council #>
- Hypothesis: <what we expect; why; cite prior evidence>
- Surface(s): <scanner | pricing | shopify-app dashboard | onboarding | fix flow | billing | docs>
- Variant: <what changes vs control; exact copy / config diff if small>
- Primary metric: <one — pre-declared, from metric-catalog.md>
- Secondary metrics (observations only): <list>
- Sample size target: <n per arm; calculated for MDE = X% at α=0.05, power=0.8>
- Minimum observation window: <calendar days; never stop early>
- Decision rule: <if primary moves +X% with p < 0.05 → keep; if flat or negative → revert; if inconclusive at window end → re-run / archive>
- Status: planned | running | analysis | shipped | reverted | inconclusive
- Started: YYYY-MM-DD
- Window ends: YYYY-MM-DD
- Readout: <added on close; cites `experiment-readout` brief under context/data-intelligence/experiments/>
- Decision: <added on close>
- Cross-references: <marketing/experiments.md entry if dual-logged; ADR if it changed a tier or core flow>
```

## Rules

1. One primary metric per experiment. Secondary metrics are observations, never deciders.
2. Pre-declared minimum window. No early stopping. Inconclusive is valid.
3. No two conflicting experiments on the same surface simultaneously. Conflict = same primary metric or same primary user action.
4. Hypothesis cites data that motivated it. "We think X will move Y" without prior evidence is a guess, not a hypothesis.
5. Decision rule pre-declared. Post-hoc adjustment = p-hacking.
6. Readouts written by `experiment-readout`; this log only tracks running entries + final decision.
7. Reverts are first-class outcomes. Note them with the same care as wins.
8. Experiments touching merchant-facing UI require Noor (#8) accessibility pass on both variants.

## Flintmere-specific experiment categories

- **Scanner → install** — URL input copy, CTA wording, trust microcopy, email gate position.
- **Shopify app onboarding** — install-to-first-scorecard UX, initial scan priority, bulk sync status visibility.
- **Fix apply flow** — dry-run preview UX, bulk-apply confirmation, confidence-threshold defaults.
- **Pricing + tier enforcement** — Growth tier pricing (from SPEC §7.3), first-month promo wording, upgrade prompts.
- **Channel Health widget** — placement, which metrics shown, how AI-agent attribution is framed.

## Pre-registered experiments (from SPEC §7.3)

These are queued for launch once the relevant surface is live:

| Experiment | Hypothesis | Primary metric | Window |
|---|---|---|---|
| Growth price £49 vs £29 vs £69 | £49 optimises filter + conversion | `growth_d30_retention` + `growth_tier_signup_rate` combined | 30 days |
| Email gate position (before vs after pillar details) | Gating later improves opt-in | `email_optin_rate_weekly` | 14 days |
| Bracket in scanner CTA ("Scan my store" vs "Scan [ my store ]") | Bracketed nouns increase CTR on B2B surfaces | scanner submission rate | 14 days |
| Concierge price £97 vs £197 | £97 optimises validation; £197 filters to higher-intent | `concierge_audits_paid_weekly` + 30-day conversion | 30 days |

## Entries

<!-- Appended by experiment-design (planned), updated to running by operator, closed by experiment-readout. -->

## Changelog

- 2026-04-19: Adapted for Flintmere. Added Flintmere-specific experiment categories + pre-registered SPEC §7.3 list. Accessibility pass requirement on UI experiments.
