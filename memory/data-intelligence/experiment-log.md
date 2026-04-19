# experiment-log.md

Append-only product-wide experiment log. Hypothesis → variant → metric → readout → decision.

Distinct from `memory/marketing/experiments.md`:
- This log covers **product experiments** (in-app flows, pricing, onboarding, dashboard, API onboarding) plus any cross-surface experiment.
- The marketing log covers **marketing-surface experiments** (homepage hero, pricing copy, blog headers, social copy, outreach subject lines).
- A pricing-page experiment that touches both sides is logged in **both**, with a cross-link.

## Format

```
### YYYY-MM-DD — <slug>

- Skill: experiment-design (or where it originated)
- Owner: <council #>
- Hypothesis: <what we expect; why; cite the data behind the prior>
- Surface(s): <homepage scan / pricing / dashboard / onboarding / API console / billing / docs>
- Variant: <what changes vs control; include exact copy / config diff if small>
- Primary metric: <one — pre-declared>
- Secondary metrics (observations only): <list>
- Sample size target: <expected n per arm; calculated for MDE = X% at α=0.05, power=0.8>
- Minimum observation window: <calendar days; never stop early>
- Decision rule: <if primary moves +X% with p < 0.05 → keep; if flat or negative → revert; if inconclusive at window end → re-run / archive>
- Status: planned | running | analysis | shipped | reverted | inconclusive
- Started: YYYY-MM-DD
- Window ends: YYYY-MM-DD
- Readout: <added on close; cites `experiment-readout` brief in context/data-intelligence/experiments/>
- Decision: <added on close>
- Cross-references: <marketing/experiments.md entry if dual-logged; ADR if it changed a tier or core flow>
```

## Rules

1. One primary metric per experiment. Secondary metrics are observations, never deciders.
2. Pre-declared minimum window. No early stopping. Inconclusive is valid.
3. No two conflicting experiments on the same surface at the same time. Conflict = same primary metric or same primary user action.
4. The hypothesis cites the data that motivated it. "We think X will move Y" without prior evidence is a guess, not a hypothesis.
5. Decision rule pre-declared. Decisions made post-hoc to fit the data are p-hacking.
6. Readouts written by `experiment-readout`; this log only tracks the running entries + the final decision.
7. Reverts are first-class outcomes. Note them with the same care as wins.

## Entries

<!-- Appended by experiment-design (planned), updated to running by the operator, closed by experiment-readout. -->
