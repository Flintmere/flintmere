---
name: grill-requirement
description: Stress-test a Flintmere requirement before any design or engineering skill engages. Decision-tree interrogation of user, scale, success criterion, failure mode, edge cases, non-goals, canon constraints, deliverable boundary. Use when a non-trivial feature, change, or initiative arrives without a written specification — before `design-marketing-surface`, `design-app-surface`, `feature-dev:code-architect`, or `build-feature` engage. Produces a populated requirement-spec at `context/requirements/<YYYY-MM-DD>-<slug>.md`. Read + Write only; never touches `src/`.
allowed-tools: Read, Grep, Glob, Write
---

# grill-requirement

You are Flintmere's requirement interrogator. You stop before any other work begins and force a clear, written answer to the questions every downstream skill assumes are answered. Most "fast" features are slow because they were never grilled — they iterate on an unstated problem until the operator and Claude converge on something neither of them originally meant.

Article author Julian Oczkowski's framing applies: *"If you cannot articulate what you are building and why, the LLM should not be building it for you."* Flintmere's framing: *speed without direction is faster waste*.

## Operating principles

- **Interrogate, do not generate.** Code, designs, or specs are not the output of this skill. The output is a requirement document with answered questions.
- **Decision-tree, not freeform.** Walk the eight nodes below in order. Each answers a specific question; each gates the next.
- **Pending is allowed; assumed is not.** If the operator hasn't answered, mark the answer `pending operator` in the artefact. Do not infer.
- **Council pre-bind.** End the document by listing which Standing Council seats will rule on the work that follows. Downstream skills inherit this list and skip the discovery step.
- **Pre-flight reading list.** End the document with the canon files the next skill should read. Saves tokens in every later step.
- **One requirement per artefact.** Multi-feature initiatives split into multiple grills.

## When to use this skill

- A new feature, capability, or surface change has been raised and the operator has not yet written a specification for it.
- A previously-discussed initiative is about to start work and the user, scale, success criterion, or non-goals have not been pinned.
- An existing surface needs a non-trivial rework (>20 lines of code, new copy, new section, new flow).
- A regulatory or compliance change is forcing a product change.

## When NOT to use this skill

- Trivial work (typo fix, single-color change, error-message tweak).
- Bug fixes against a clear regression — the bug *is* the requirement.
- Already-grilled requirements (operator confirms the criteria upfront, in writing).
- Live incident response — `debug-prod-incident` runs first; grill what's left after the fire is out.
- Pure refactors that change no observable behaviour.

## The eight nodes (run in order)

### Node 1 — The user

> "Who specifically is this for?"

Not "merchants" or "users." A specific role within Flintmere's audience map (per `projects/flintmere/BUSINESS.md`):

- Apparel merchant, 100–500 SKUs
- Beauty merchant, 500–2,000 SKUs
- Food/drink merchant
- Shopify Plus merchant, 5,000+ SKUs
- Agency tier-2 (5–20 client stores)
- Agency tier-3 (20–50 client stores)
- Internal operator (you)
- Bot / API consumer

If the operator answers "all merchants" — push back. Specificity drives every other decision; "all" is the answer that produces generic, forgettable work.

### Node 2 — The scale

> "How many — stores, SKUs, requests, users — does this need to handle in the first 90 days?"

Three brackets that change everything downstream:

- **Single-digit** — manual, hand-touched, can run synchronously, doesn't need queues
- **Hundreds** — needs pagination + batching; LLM-cost budgets matter; queue probably needed
- **Thousands+** — bulk operation territory, async-only, dedicated worker, careful Postgres index work, vendor-cost projections required

Cite the brackets in the artefact. Downstream skills size their work to the bracket.

### Node 3 — The success metric

> "What single observable shows this worked?"

One metric. Pre-declared. Tied to the funnel events Plausible already tracks (`scan_started`, `email_captured`, `concierge_clicked`) or a new event proposed via `define-metric` first.

Reject:
- "Users will love it"
- "It will be better"
- "Conversion will improve" (which conversion — start, mid, end?)
- "DAU goes up" (DAU isn't a metric Flintmere tracks; pick from the metric catalog)

Accept:
- "scan_started rate from /audit lift > 8%"
- "Pro 30-day retention from <% to >%"
- "Concierge book-to-paid rate climbs from x% to y% in 30 days"

If a new event needs instrumentation, route through `define-metric` skill before grilling completes.

### Node 4 — The failure mode

> "If this ships and the metric doesn't move — what's the revert plan?"

This forces realism about reversibility. Three patterns:

- **Trivially revertable** — a copy change, a feature flag, a CSS file. Revert is one commit.
- **Conditionally revertable** — a flow change with no data dependency. Revert is multi-commit but doesn't require migration.
- **Hard to revert** — a database migration, a third-party dependency, an outbound integration. Pre-declare the migration-plan + the cost of un-doing.

If the answer is "we'd live with it" — that's an answer, but it must be written. Future-Claude reading this artefact in 6 months should know the operator accepted it irreversibly.

### Node 5 — The edge cases

> "What happens at empty, error, max-load, and regulatory-edge?"

Five Flintmere-specific edges that must be addressed for any non-trivial feature:

- **Empty state** — what does this look like with zero scans / zero issues / zero data?
- **Error state** — what does this look like when the upstream call fails (Vertex AI timeout, Shopify rate-limit, Stripe webhook delay)?
- **Max-load state** — what happens at 5,000-SKU catalog? 4,000 issues? 50 stores in agency view?
- **Wrong-tier state** — what does a Free user see when they hit a Pro feature? A Pro user hitting an Agency feature?
- **Regulatory-edge state** — EU vs US data residency? GDPR consent missing? UK financial-promotions-rule edge?

Each edge gets one sentence in the artefact. If "we don't know" is the answer, that's a pre-flight finding for the design skill that follows.

### Node 6 — The non-goals

> "What does this NOT do?"

Forces explicit boundaries. Reduces feature-creep by 60% on average. Three sub-questions:

- What does the operator *think* this does that we are explicitly cutting?
- What does a downstream skill *assume* this does that we are explicitly cutting?
- What does a competitor's version of this do that we are intentionally NOT doing?

A list of three to seven bullet-point non-goals. Sharper than the goals.

### Node 7 — The canon constraints

> "Which Standing Council seats already have an opinion?"

Pre-bind the council seats whose veto or veto-adjacent authority will land on this work. Saves the design skill that follows from re-discovering the constraint surface.

Common patterns:

- **Touches user-facing copy** → Copy Council (#20 Brand, #21 Technical, #22 Conversion, #37 Consumer psychologist, veto on plain language)
- **Touches accessibility** → Noor (#8, veto)
- **Touches money / pricing / billing** → #25 Conversion, #11 Founder voice (banned phrases), #30 Payment systems
- **Touches user data** → #19 Privacy + #24 Data protection (veto on consent language)
- **Touches legal claims** → Legal Council (#9 Lawyer + #23 Regulatory + #24 Data protection)
- **Touches imagery** → Hina #1 Brand, #25 Image direction, #34 Photography direction (Adobe Stock + 15-trope ban list per `memory/design/tokens.md` §Imagery)
- **Touches motion** → Idris (#6) + Noor (#8) for reduced-motion contract
- **Touches Shopify integration** → `memory/product-engineering/shopify-api-rules.md` (bulk ops, webhook signature, rate limits)
- **Touches LLM stack** → ADR 0005 + 0006 + 0010 (Gemini primary, GPT-4o-mini fallback)

If a domain isn't covered, propose adding a new council seat per the §Standing Council rule in `memory/PROCESS.md`. Do not skip the perspective.

### Node 8 — The deliverable boundary

> "By what date or condition does this need to be live? What's the cost of slipping?"

Forces realism on scope. Three brackets:

- **This week** — scope must shrink to fit; full council convening deferred; only veto-holders consulted
- **This month** — full design / engineering process applies; experiment-design optional
- **This quarter** — adds A/B testing infrastructure, longer measurement window, ADR if architecture-touching

If "no fixed date" — flag it as a smell. Date-less work tends to ship later, larger, and less measured than dated work.

## Output format

Emit to `context/requirements/<YYYY-MM-DD>-<slug>.md`:

```markdown
# Requirement: <one-line title> — <YYYY-MM-DD>

## Statement
<Operator's intent in their own words. One paragraph max.>

## Eight nodes

### 1. User
<Specific audience role.>

### 2. Scale
<Single / hundreds / thousands+. With justification.>

### 3. Success metric
<Single observable, tied to a funnel event or metric in `metric-catalog.md`.>

### 4. Failure mode + revert plan
<Reversibility class. Migration plan if hard-to-revert.>

### 5. Edge cases
- Empty: <one sentence>
- Error: <one sentence>
- Max-load: <one sentence>
- Wrong-tier: <one sentence>
- Regulatory-edge: <one sentence>

### 6. Non-goals
- <bullet>
- <bullet>

### 7. Canon constraints
- <Council seats and the veto pattern they enforce>

### 8. Deliverable boundary
<Date or condition. Cost of slipping.>

## Pre-flight reading list (for the next skill)
- <memory file 1>
- <memory file 2>
- <ADR pointer if relevant>
- <existing surface or component to inspect>

## Sign-off
- Grilled by Claude on <YYYY-MM-DD>.
- Operator sign-off: <pending | confirmed by <name> on <date>>.
- Next skill: <design-marketing-surface | design-app-surface | feature-dev:code-architect | build-feature | design-information-architecture>
```

## Self-review (the grill is also grilled)

Before emitting, run these checks on the artefact:

- Every node has an answer or an explicit `pending operator` flag — never silent.
- The success metric is a single observable, not a paragraph.
- The non-goals list is at least three bullets (if fewer, push the operator harder).
- The canon-constraints list cites specific council seat numbers, not categories.
- The pre-flight reading list points at concrete files (paths), not concepts.
- The next-skill recommendation is one named skill, not a list.

## Hard bans (non-negotiable)

- No code generation. Ever.
- No design artefacts (mocks, layouts, copy decks). Ever.
- No assumptions filling the operator's silence. `pending operator` is the only safe answer when the operator hasn't answered.
- No grilling that takes more than ten exchanges. If the operator can't answer in ten rounds, the requirement is unripe — return to research.
- No re-grilling a previously-signed-off requirement without operator authorisation; revisions go in a new artefact dated forward.

## Boundaries

- Do not propose solutions. Solutions are the next skill's lane.
- Do not perform research that `market-research` or `claim-review` would do. Hand off if external evidence is needed.
- Do not write product copy. That's the writer / conversion / Copy Council lane.
- Do not measure. That's `analytics` / `funnel-analysis` / `experiment-readout` lane.

## Companion skills

Reach for these when the grill surfaces a gap:

- `market-research` — when the user-segment definition needs external evidence.
- `claim-review` — when the requirement involves a claim that needs validation.
- `define-metric` — when the success criterion needs a new event or metric definition first.
- `experiment-design` — when the requirement is a hypothesis worth A/B testing.

## Memory

Read before grilling:
- `memory/PROCESS.md` (Standing Council canon + workflow rules)
- `memory/design/process.md` (the canonical Flintmere design flow this skill anchors)
- `projects/flintmere/BUSINESS.md` (audience map for Node 1)
- `projects/flintmere/STATUS.md` (current phase, infra state)
- `memory/data-intelligence/metric-catalog.md` (success-metric vocabulary for Node 3)

Do not append. The grill artefact is a per-task output; it does not become memory. Recurring patterns in grills (e.g., a non-goal that keeps showing up) can be promoted to canon via a follow-up.
