# partnerships-history.md

Append-only log of partnership + integration conversations. Every meaningful outbound / inbound leaves a trace here.

## Entry format

```
## YYYY-MM-DD — <partner name> — <status>

- **Partner:** <name + role in ecosystem>
- **Category:** wallet | protocol | security tool | ecosystem | education | press (rare — most press lives in marketing/outreach.md)
- **Shape:** outbound proposal | inbound request | continuation of prior
- **Owner (our side):** <>
- **Owner (their side):** <>
- **Brief:** <one paragraph — what the conversation is about>
- **Status:** scoping | proposal drafted | proposal sent | meeting booked | technical conversation | integration build | live | declined | paused | terminated
- **Brief file:** `context/partnerships/<YYYY-MM-DD>-<slug>.md`
- **Council sign-offs:** <#12 Ecosystem, #6 B2B, #9 Lawyer, #11 Investor voice — as applicable>
- **Outcome to date:** <>
- **Next action + date:** <>
- **Risks flagged:** <>
- **Last activity:** YYYY-MM-DD
```

## Rules

- **Append-only.** Do not rewrite past entries; add follow-up entries.
- **Every outbound partnership conversation gets an entry,** even if it goes nowhere. Pattern data matters.
- **Inbound requests** (someone reaches out to us) also get entries. Inbound that isn't recorded is inbound that gets forgotten.
- **Do not record personal details that aren't relevant to the partnership** (no DOBs, political views, etc.). Public professional signal only.
- **No double-outreach to the same target** inside the same 90-day window without explicit reason.

## Log

<!-- Append newest first. No entries yet under this department structure. -->

## Patterns

As entries accumulate, watch for:

- **Partners who ask then disappear** — record the disappearance; do not keep nudging.
- **Partners who only engage when we're in press** — calibrate our ask accordingly.
- **Partners who introduce us to other partners** — they are force multipliers. Invest in the relationship.
- **Integration shapes that fail repeatedly** — if three wallets in a row reject Snaps for the same reason, Snap is not the right surface for AG right now.

Record patterns in `targets.md` or `integrations.md` once the second data point arrives.

## Lifecycle

### Outbound proposal (initiated by us)

1. `partnership-brief` or `integration-proposal` produces the draft + internal brief.
2. `claim-review` passes the draft.
3. User sends.
4. Entry created here with status `proposal sent`.
5. Status updates as conversation progresses.
6. Final state: `live`, `declined`, `paused`, or `terminated`.

### Inbound request (initiated by partner)

1. Someone reaches out (email, DM, conference conversation, GitHub issue).
2. Entry created with status `scoping`.
3. If pursued: proceed as outbound from step 1.
4. If declined: record declination with reason (`inbound-declined`).

### Partnerships that turn into integrations

An integration is a technical partnership. Once a proposal becomes an engineering workstream:
- `partnerships-history.md` entry stays as the relationship log.
- `integrations.md` becomes the technical source of truth.
- `integration-proposal` (this skill) hands off to engineering's `build-feature` for implementation.

### Partnerships that end

- **Amicable wind-down:** one party's priorities shifted. Record the rationale; invest in maintaining the relationship.
- **Contested termination:** #9 Lawyer involved. Record facts only; never speculation.
- **Silent death:** partner stops responding for 90+ days. Mark `paused`; if another 90 days pass, mark `terminated - unresponsive`. Do not chase further.

## Cross-references

- Targets (who we pursue) — `targets.md`.
- Integration technical detail — `integrations.md`.
- Grants (different kind of partnership with ecosystems) — `grants-history.md`.
- Outreach emails (tactical, press + researchers) — `memory/marketing/outreach.md`.
- Claims made in partnership materials — registered in `memory/compliance-risk/claims-register.md` upon ship.

## A note on relationship quality

Growth work compounds. A wallet that becomes a distribution partner in year 2 often started as a cold email in year 1. Every entry here is a seed. Tend the garden.
