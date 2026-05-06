# Jet-fighter engine — plan

Date: 2026-05-06
Status: draft, awaiting operator sign-off on phasing
Owner: pending — engineering claims at kick-off

## What we mean by "jet fighter"

Flintmere's audit today is a model-based diagnostic. We read the merchant's
public catalog, score it, and quote a probability range. The 03:51Z handover
("turn the engine into a jet fighter") asked what the same diagnostic would
look like if the inputs and outputs both moved up a tier.

Two parallel tracks deliver that shift:

- **Track A — GMC OAuth.** We read the merchant's actual Google Merchant
  Center account. Disapprovals, impressions, clicks, suppression status. The
  £-band stops being modelled; it becomes "this is the demand Google says
  you missed last month."
- **Track B — Agent-eval harness.** We benchmark the merchant against the
  AI shopping agents that are eating the search funnel right now. Coverage,
  accuracy, hallucination, comparable rank. Nobody is selling this commercially.

Together they reposition the deliverable from "we estimate" to "we know +
we benchmark you against the future." The pricing transition follows the
deliverable transition — see `BUSINESS.md` and the OAuth bundle pricing
table in the 2026-05-06 handover.

## Why both tracks, not one

GMC OAuth alone is a credibility upgrade — same diagnostic, harder data.
Comparables in the £200–500/mo range (Lengow, Channable, DataFeedWatch).
A defensible move but not differentiated.

Agent-eval alone is a category creator but it leaves the existing audit
on its modelled foundation. Operators rationally ask "if you can read my
GMC, why are you guessing?"

Bundled, the two tracks make the proposition: *we read what Google
already knows about you, and we tell you what the agents that are
replacing Google search think of you.* That bundle is genuinely net-new.

## Track A — GMC OAuth (ground-truth credibility)

**Scope (what ships):**
- OAuth 2.0 flow scoped to `https://www.googleapis.com/auth/content` (Content
  API for Shopping). Read-only scope.
- Token storage on a new `MerchantGmcConnection` table (refresh token
  encrypted at rest, access token rotated on demand).
- Disconnect flow + token-revocation handling.
- Read endpoints we consume:
  - `accounts.list` — pick the account when the user has multiple.
  - `accountstatuses.get` — overall account-level issues.
  - `productstatuses.list` — per-product disapprovals and reasons.
  - `accounts.reports.search` — historical impressions/clicks per product
    (last 30/60/90 day window).
- Audit-deliverable extension:
  - "Currently disapproved" replaces the modelled suppression count.
  - "Last 30 days" demand chart per top-disapproved product.
  - Direct disapproval-reason quotes (Google's own language) per product.
- Subscription extension:
  - Daily refresh; alert email when disapproval count spikes >20% week-over-week.

**Engineering estimate (the "week of OAuth"):** ~5–7 working days.
- 1 day: OAuth flow scaffold (state token, redirect, callback).
- 1 day: Token storage + refresh handling. Encryption at rest using existing
  SES envelope pattern (see `apps/scanner/src/lib/encrypted-secret.ts`).
- 1 day: Content API client wrapper + retry/quota handling.
- 1–2 days: Audit-deliverable surface — wire ground-truth disapprovals into
  the existing scoreJson + dashboard.
- 1 day: Disconnect flow + audit-trail logging.
- 1 day: Buffer for Google review of OAuth verification (if scope requires
  it — `auth/content` is a sensitive scope, may need verification).

**Risk:** Google OAuth verification can take 4–6 weeks for new sensitive
scopes. We may need to ship behind a "request access" gate while
verification is in flight, or chain on Eazy Access Ltd's existing
verified Google Cloud project (verify with operator).

**Deliverable surface:** the existing `/score/[shop]` dashboard gains a
"Google Merchant Center" panel; the audit email gains a "Currently
disapproved (read directly from your GMC)" section ahead of the modelled
suppression range.

## Track B — Agent-eval harness (the moat)

**The hard part is the rubric, not the harness.** A 5-prompt eval is a
parlour trick. A 50-prompt rubric per vertical with reproducible scoring
is a defensible methodology that holds up to "what makes this real?"

**Rubric design — proposed shape:**

Three query intents per vertical, ~15 queries each = 45 queries per scan.

1. **Bottom-funnel** (buyer knows what they want):
   - "buy organic stock cubes UK"
   - "vegan protein bar 20g protein"
   - "gluten-free oat flour 1kg"

2. **Comparison** (buyer is choosing):
   - "best UK organic stock cubes for soup"
   - "vegan protein bar vs whey for muscle gain"
   - "gluten-free oat flour for baking sourdough"

3. **Discovery** (buyer doesn't know yet):
   - "what should I cook for friends with coeliac disease"
   - "high-protein vegan snacks for marathon training"
   - "British store cupboard staples for student moving out"

**Three models per query** (cross-model: insulates against single-model
quirks, justifies the "future of shopping" claim):
- Gemini 2.5 Flash (primary, per ADR 0005)
- Claude 4.7 (cross-validation)
- GPT-4o-mini (third leg)

**Scoring dimensions per query:**
- **Surfaced?** Did the merchant appear in the model's response? (binary)
- **Position rank** (when surfaced): 1st, 2nd, 3rd, lower? (1–4 ordinal)
- **Accuracy** (when surfaced): does the model's claim about the product
  match our verified ground-truth catalog data? (binary per claim,
  0–4 score per response)
- **Hallucination** (when surfaced): did the model invent details about
  the merchant that aren't true? (binary, weighted heavily)
- **Comparable**: which 5 competitors did the model mention? Are they our
  merchant's actual competitors per their stated positioning?

**Output shape — per-merchant agent-eval report:**
- Coverage score: 0–100, "you surface in N% of representative queries"
- Accuracy score: 0–100, "when you surface, your data is correct N% of the time"
- Hallucination index: 0–100, "we caught the agents inventing things about
  you in N queries — here's the most concerning"
- Top-5 comparison: visual ranking against the 5 competitors most often
  cited alongside the merchant
- Per-query drill-down: every query, every model, every response, the
  merchant's mention extracted, our scoring shown

**Reproducibility:**
- Query corpora versioned (`agent-eval/queries/food-uk-v1.json`).
- Model versions pinned per-eval (record `model: claude-opus-4-7` etc).
- Re-running the same scan against the same query+model versions reproduces
  scores deterministically (modulo model temperature — pin to 0).

**Defensibility:**
- The rubric is the moat. We publish the methodology (white paper at
  `flintmere.com/research/agent-eval-method`), keep the query corpora
  proprietary. Anyone can copy "we run 50 queries"; nobody can copy
  "we run *these* 50 queries against *these* models with *this* scoring
  rubric and *this* ground-truth method."
- Vertical specialisation compounds. Food-UK-v1 is the wedge. Beauty-UK-v1,
  Apparel-UK-v1, Food-US-v1 are follow-on assets.

**Cost model:**
- 45 queries × 3 models = 135 model calls per merchant scan.
- Average tokens per call: ~1k input, ~500 output.
- Flash @ $0.075/1M input, $0.30/1M output → ~$0.000225/call → $0.030/scan.
- Claude 4.7 Haiku is cheaper baseline; Sonnet for hard cases — budget $0.05/scan.
- GPT-4o-mini @ $0.15/1M input, $0.60/1M output → $0.000450/call → $0.060/scan.
- Combined: ~$0.10–0.15/scan for the cross-model eval.
- One-shot per audit: negligible against £797 ASP.
- Monthly per subscription: $0.10–0.15/mo per sub → 0.04% of £349 MRR.

**Engineering estimate:** ~2–3 weeks.
- Week 1: Rubric design, food-UK-v1 query corpus drafted, ground-truth
  method documented, 5 reference catalogs for calibration.
- Week 2: Harness module — `packages/agent-eval/` with `runAgentEval(input)`
  signature. Cross-model dispatch, scoring, output shaping.
- Week 3: Integration — extend scoreJson with `agentEval` field, dashboard
  widget, audit-email section, white-paper draft.

## Track integration into the existing engine

Both tracks compose with the existing scan pipeline (`runScanForShop` in
`apps/scanner/src/lib/run-scan.ts`):

```
runScanForShop(shopUrl, source)
  → fetchCatalog            // existing
  → fetchCrawlability       // existing
  → scoreCatalog            // existing
  → estimateSuppression     // existing — falls back when no GMC
  → fetchGmcGroundTruth?    // NEW — when merchant has connected
  → estimateAov             // existing
  → runAgentEval?           // NEW — Pro/Plus tier, optional otherwise
  → persist to Scan         // existing
```

Both new steps are optional and gated:
- GMC: only fires when the shop has an active `MerchantGmcConnection`.
- Agent-eval: only fires for Pro/Plus subscribers and audit-band purchases
  (cost gating — free scanner stays free, agent-eval is a paid moat).

When either fires, `scoreJson` carries an extra envelope (`gmcGroundTruth`,
`agentEval`) that the dashboard + email layers project. Same pattern as
the existing `suppressionEstimate` extension. No schema migration needed
beyond `MerchantGmcConnection` for Track A.

## Pricing implication (carryover from 2026-05-06 handover)

| Tier | Today | + GMC OAuth | + Both |
|---|---|---|---|
| Audit Band 1 (≤1,500 SKUs) | £197 | £497 | **£797** |
| Audit Band 2 (1,501–5,000) | £397 | £997 | **£1,497** |
| Audit Band 3 (5,001+) | £597+ | £1,497+ | **£2,497+** |
| Single-vertical sub | £99/mo | £249/mo | **£349/mo** |
| Plus (multi-channel) | from £1,200/mo | from £1,497/mo | **from £1,997/mo** |

Reasoning lives in the handover doc. The pricing change should land
*alongside* the deliverable change, not before — old pricing on new
deliverable for ~30 days lets us calibrate WTP against actual reception.

## Build phasing — proposed

Three options, operator picks:

**Option 1 — sequential (lowest risk, ~5 weeks):**
1. Track B (agent-eval) first. The methodology is the moat; ship it standalone.
2. Track A (GMC OAuth) second. Builds on the agent-eval credibility.

**Option 2 — parallel (highest velocity, ~3 weeks elapsed if two builders):**
- Track A and Track B in parallel branches; integrate at week 3.
- Requires two sets of focused engineering attention.

**Option 3 — Track A first (lowest novelty, fastest pricing leverage):**
- GMC OAuth ships in week 1–2.
- Pricing transition begins immediately at £497 Band 1 / £249 sub.
- Agent-eval follows in weeks 3–5 to justify the second pricing step.

I'd recommend **Option 3**. Track A is shorter, pulls the cheaper price
move forward by 3 weeks, and gives us live merchant feedback before we
commit to the agent-eval rubric design. Track B benefits from real-merchant
data on what "ground truth disapprovals" look like, which informs the
rubric ground-truth method.

## What we're not doing (yet)

- **Multi-channel feed read** (TikTok Shop, Amazon Fresh, Ocado, Deliveroo).
  These are post-launch, post-Plus-tier. The Shopify embedded app is the
  vehicle for these.
- **Active feed remediation.** We diagnose; the merchant fixes (or, on
  concierge band, we draft the fixes for them to apply). No "Flintmere
  fixes your feed for you" — that's a feed-management product (Lengow's
  category), not a feed-intelligence product (ours).
- **Custom rubrics per merchant.** The defensibility is the standard
  rubric, not bespoke ones. Custom rubrics dilute the moat.
- **LLM-as-judge for accuracy scoring.** Ground truth comes from our
  scored catalog data, not an LLM evaluating an LLM. Avoid the eval-loop
  problem.

## Honest doubts

1. **Google OAuth verification timing.** If `auth/content` requires fresh
   verification on Eazy Access Ltd's Google project, the 4–6 week wait
   could blow the Track A schedule. **Mitigation:** check existing
   verification status before committing to Track A timing; have a
   "request access" placeholder UI ready if needed.

2. **Agent-eval rubric calibration cost.** Drafting the food-UK-v1 corpus
   needs ~10 hours of vertical-expert query brainstorming + ~10 hours
   of ground-truth scoring of a calibration set. That's labour, not
   engineering. **Mitigation:** the operator's own subject-matter expertise
   on UK food merchants is the calibration set; the cost is operator-time,
   not contractor-time.

3. **Cross-model variance.** If Gemini, Claude, and GPT disagree on whether
   the merchant surfaces, our coverage score becomes a multi-dimensional
   thing. **Mitigation:** report by-model in the drill-down, but headline
   the cross-model average. Operators understand "in 60% of queries you
   surface on average across the three" — that's a clearer claim than
   "you surface in 80% of Gemini queries but 30% of Claude queries."

4. **Hallucination detection is hard.** Catching "the agent invented that
   you ship to Ireland" requires us to know the merchant doesn't ship to
   Ireland. We need a robust ground-truth source per merchant.
   **Mitigation:** ground-truth comes from the catalog data we already
   read, augmented (Track A) by GMC ground-truth. The two tracks
   reinforce each other here.

5. **Flintmere doesn't have brand power yet to charge £797.** True today;
   the deliverable change earns the brand power. **Mitigation:** WTP
   study at the new price band against 5–10 representative merchants
   before the full pricing roll-over. ADR 0016 anchors the methodology.

## Decision points (operator sign-off needed before kick-off)

1. **Track ordering** — Option 1, 2, or 3.
2. **Agent-eval rubric vertical** — food-UK-v1 only at v1 (recommended,
   per ADR 0015), or also beauty-UK-v1?
3. **Pricing transition timing** — alongside Track A ship, or hold for
   both tracks before changing prices?
4. **Concierge audit interaction** — does the £797 audit include a
   one-shot agent-eval, or is it Subscription-only?

## Pointers

- `apps/scanner/src/lib/run-scan.ts` — current scan execution core; both
  new tracks splice in here.
- `packages/scoring/src/types.ts` — scoreJson envelope; new fields
  `gmcGroundTruth` and `agentEval` extend the same shape.
- `apps/scanner/src/lib/encrypted-secret.ts` — encryption-at-rest pattern
  for OAuth refresh tokens.
- `projects/flintmere/decisions/0005-llm-provider-strategy.md` — model
  routing for the agent-eval harness.
- `projects/flintmere/decisions/0015-uk-food-vertical-first.md` — vertical
  prioritisation for the rubric.
- `projects/flintmere/decisions/0016-vertical-ladder-pricing.md` — pricing
  framework for the WTP study.
- `apps/scanner/src/lib/audit-pricing.ts` — current band ladder; the new
  prices land here when transition happens.

## Next concrete step (when sign-off lands)

If Option 3:
1. Create ADR 0023 — "GMC OAuth as ground-truth track for the audit deliverable"
2. Audit existing Google Cloud project verification status against `auth/content`
3. Draft `MerchantGmcConnection` schema migration
4. Spike the OAuth flow against a sandbox Merchant Center account
5. Wire one disapproval reason into the audit email as proof-of-concept

Day 1 deliverable: a real merchant's real disapproval reason appearing in
a real audit email, no modelling involved. That's the credibility moment
that justifies everything else.
