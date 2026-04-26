# 0019 — Strategic gate: 6-month window, latest-by 2026-10-26

- **Status:** Accepted
- **Date:** 2026-04-26
- **Source:** `projects/flintmere/strategy/2026-04-26-final-report.md` §2 (12-month proposal), shortened to 6-month window per operator (Q4) + council standing recommendation.
- **Affects:** `STATUS.md` `## Strategic gates` section (new), quarterly self-review cadence, fallback path for the standards-business thesis.

## Context

The strategic report proposed a 12-month gate evaluating 2027-04-26: *"a third party citing the Flintmere food catalog standard in their own documentation, blog post, RFP, or onboarding guide, without being prompted by Flintmere."* Operator pushback: 12 months is too long; commit to a shorter, window-based gate.

Council ran the timing math: standards v1 publishes ~Month 2 (~late June 2026 per ADR 0018). Trade press / vertical PIM / consultant pickup typically takes 60–90 days post-publication to surface as an unprompted citation. A window shorter than ~4 months post-publication = gate that cannot pass on physics, not on strategy. A window longer than 6 months = compounding rationalisation risk (#11 voice flag: "the date becomes pseudo-committed").

## Decision

**6-month window, evaluating 2026-10-26.** This is a *latest-by* date, not a not-before. An earlier citation passes the gate immediately; the window simply caps the maximum waiting time before a forced strategy review.

### Proof condition (unchanged from report §2)

A third party citing the *Flintmere food catalog standard* in their own published artifact, without being prompted by Flintmere within the prior 30 days.

### Sources that count

- Trade press article (The Grocer, Food Manufacture, Speciality Food, Just Food, FoodNavigator, etc.).
- Vertical PIM blog post or onboarding documentation.
- Regulatory consultant referencing the standard in client advice or published guidance.
- Trade body publication (FDF, FSB, SFIB, Allergen Bureau UK, etc.).
- Academic citation in a published dissertation, research paper, or conference proceeding.
- Shopify Plus merchant publicly referencing the standard (blog, case study, RFP language).
- Standards body or government reference (FSA acknowledgment, BSI listing, etc. — these would massively exceed the gate).

### Sources that do NOT count

- Anything Flintmere personally pitched within the 30-day prior window (the citation must be downstream of organic discovery or beyond pitch reach).
- Reposts / quotes of Flintmere's own published content (operator's own blog, social, newsletter).
- Comments on Flintmere social posts, replies to operator's threads.
- Direct customer testimonials (these matter for sales, not for the moat thesis).
- Anonymous or unverifiable references.

### Outcome paths

- **Pass (citation lands):** Standards business validated. Continue. 12-month-from-pass review schedules: cadence upgrade (Q3c → Q3d), beauty + apparel standards consideration, capital plan for second vertical.
- **Fail (window closes 2026-10-26 with zero qualifying citations):** Revert to consulting-led with SaaS support. Standards positioning retired. Brand canon, pricing, hiring plan, and capital strategy re-evaluated under the consulting-business thesis (£97 audits scaled to £200–500 per the report §2). This is a *viable business*, not a failure mode — but it's a different business with different operator commitments.
- **Partial (qualifying-but-marginal citation, e.g., a tier-3 trade publication):** Gate passes but 12-month-out review extends rather than commits. Half-yearly cadence holds; quarterly upgrade deferred until a tier-1 citation lands.

### Mid-window check

A quarterly self-review entry is appended to `STATUS.md` `## Strategic gates` at:
- **2026-07-26** (mid-window check, ~30 days post v1 publication): list every external reference observed; if zero from non-pitched sources, treat as yellow flag and escalate outreach. Tier-1 outreach campaign moves up if not already running.
- **2026-10-26** (window close): outcome ADR — pass / fail / partial. New ADR supersedes 0019.

## Consequences

- New `STATUS.md` section: `## Strategic gates`. Initial entry: 2026-04-26 strategy adoption + 2026-10-26 evaluation date + mid-window check.
- Quarterly self-review discipline: 2026-07-26 entry mandatory.
- Capital plan must survive the fail outcome (standards positioning retired). This means: no fundraise pitched on the standards thesis until 2026-10-26 has passed. Bridge cash plan + concierge audit volume + grandfathered subscriptions cover the operator-income floor in either outcome.
- Hiring: regulatory-affairs contractor (£500–1,400/yr Tier 6) and any other vertical-strategy hires deferred until 2026-10-26 outcome.
- Brand canon: amber + bracket + neutral-bold are *vertical-agnostic* anyway; no canon change conditional on outcome.
- Marketing pages: Beauty + apparel pages stay live in either outcome (they earn SEO regardless).

## Rollout

- **Phase 1 (this commit):** ADR landed; `STATUS.md` `## Strategic gates` section added.
- **Mid-window (2026-07-26):** check entry appended to `STATUS.md`. If signal weak, escalate outreach via `outreach` skill.
- **Window close (2026-10-26):** outcome ADR (0020 or later). Either continuation or pivot is captured as a new ADR; 0019 marked `Status: Superseded by NNNN`.

## Re-open conditions

- Citation arrives before 2026-10-26 → gate evaluated immediately. Outcome ADR written; 0019 superseded.
- Major external event materially changes citation likelihood (FSA major rule change announcement during the window, Shopify ships its own food catalog standard, vertical-PIM acquisition) → re-evaluate window timing in light of changed conditions.
- Mid-window check (2026-07-26) reveals systematic pitch-failure (zero traction from outreach despite full-effort campaign) → consider amending the proof condition to include solicited-but-credible references; ADR amendment, not full re-open.
- Operator capital plan changes (additional runway via grant, fundraise, or significant audit volume) → 6-month window may extend by ADR amendment, not as default. Default behaviour: hold the window and let the gate force decision.
