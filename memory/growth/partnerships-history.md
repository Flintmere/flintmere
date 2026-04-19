# partnerships-history.md

Append-only log of partnership + integration conversations for Flintmere. Every meaningful outbound / inbound leaves a trace here.

## Entry format

```
## YYYY-MM-DD — <partner name> — <status>

- **Partner:** <name + role in ecosystem>
- **Category:** agency | complementary-app | Shopify-platform | research-media | Enterprise-merchant | event | other
- **Shape:** outbound proposal | inbound request | continuation of prior
- **Owner (our side):** <operator | council member>
- **Owner (their side):** <name, role, company>
- **Brief:** <one paragraph — what the conversation is about>
- **Status:** scoping | proposal drafted | proposal sent | meeting booked | technical conversation | integration build | live | declined | paused | terminated
- **Brief file:** `context/partnerships/<YYYY-MM-DD>-<slug>.md`
- **Council sign-offs:** <#12 Ecosystem, #6 B2B API, #9 Lawyer, #11 Investor voice, #24 Data protection — as applicable>
- **Outcome to date:** <>
- **Next action + date:** <>
- **Risks flagged:** <>
- **Last activity:** YYYY-MM-DD
```

## Rules

- **Append-only.** Do not rewrite past entries; add follow-up entries.
- **Every outbound partnership conversation gets an entry,** even if it goes nowhere. Pattern data matters.
- **Inbound requests** also get entries. Forgotten inbound is lost revenue.
- **Do not record personal details that aren't relevant** (no DOBs, political views, unrelated background). Public professional signal only.
- **No double-outreach to the same target** within 90 days without explicit reason.

## Log

<!-- Append newest first. No entries yet. -->

## Patterns to watch

As entries accumulate, watch for:

- **Partners who ask then disappear** — record the disappearance; do not keep nudging.
- **Partners who only engage when we're in press** — calibrate our ask accordingly.
- **Partners who introduce us to other partners** — force multipliers. Invest in the relationship.
- **Integration shapes that fail repeatedly** — if three PIM vendors in a row reject deep integration, shallow cross-promotion is the right shape for now.
- **Agencies that buy then refer peer agencies** — the agency-to-agency referral is Flintmere's highest-leverage growth loop.

Record patterns in `targets.md` or `integrations.md` once the second data point arrives.

## Lifecycle

### Outbound proposal (initiated by us)

1. `partnership-brief` or `integration-proposal` produces draft + internal brief.
2. `claim-review` passes the draft.
3. Operator sends.
4. Entry created here with status `proposal sent`.
5. Status updates as conversation progresses.
6. Final state: `live`, `declined`, `paused`, or `terminated`.

### Inbound request (initiated by partner)

1. Someone reaches out (email, DM, conference, GitHub issue, Shopify partner inbound).
2. Entry created with status `scoping`.
3. If pursued: proceed as outbound from step 2.
4. If declined: record with reason (`inbound-declined`).

### Partnerships that turn into integrations

An integration is a technical partnership. Once a proposal becomes an engineering workstream:
- `partnerships-history.md` stays as the relationship log.
- `integrations.md` becomes the technical source of truth.
- `integration-proposal` hands off to engineering's `build-feature` or `add-integration`.

### Partnerships that end

- **Amicable wind-down**: one party's priorities shifted. Record the rationale; invest in maintaining the relationship.
- **Contested termination**: #9 Lawyer involved. Record facts only; never speculation.
- **Silent death**: partner stops responding for 90+ days → mark `paused`; another 90 days → `terminated - unresponsive`. Do not chase further.

## Cross-references

- Targets (who we pursue) — `targets.md`.
- Integration technical detail — `integrations.md`.
- Grants (different partnership shape with ecosystems) — `grants-history.md`.
- Outreach emails (tactical, press + researchers) — `memory/marketing/outreach.md`.
- Claims made in partnership materials — `memory/compliance-risk/claims-register.md` upon ship.

## A note on relationship quality

Growth work compounds. An agency that becomes a Tier 1 Agency-tier distributor in year 2 often started as a cold LinkedIn DM in year 1. Every entry here is a seed. Tend the garden.

## Changelog

- 2026-04-19: Adapted for Flintmere. Categories updated to match Flintmere's target list (agencies, complementary apps, Shopify platform, research media, Enterprise merchants, events). Council sign-off row adjusted.
