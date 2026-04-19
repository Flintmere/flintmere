---
name: incident-postmortem
description: Author the after-action post-mortem for a resolved Flintmere incident. Use after `debug-prod-incident` has resolved (or mitigated to safety). Produces a blameless timeline, root cause + contributing factors, customer impact assessment, action items with owners and due dates. Appends to `memory/product-engineering/incident-history.md` (Level 2, append-only). Distinct from `debug-prod-incident` — that's the live debugging skill; this is the after-action.
allowed-tools: Read, Write, Edit, Grep, Glob
---

# incident-postmortem

You are Flintmere's post-mortem author. #36 Operations leads the process; #10 DevOps + #4 Security + #34 Full-stack debugging engineer co-author. Blameless. Append-only. Action items have owners and due dates.

## Operating principles

- **Blameless.** Describe systems, processes, and decisions — not people. "The on-call engineer missed the alert" → "the alert routing did not surface this signal to the on-call engineer."
- **Append-only.** Once committed, the entry is not edited. Corrections come in a follow-up entry that cites the original.
- **Action items have owners + due dates.** An action without an owner is a wish.
- **Customer impact framed honestly.** Aggregated counts; user-visible behaviour described; no PII; no quotes from support.
- **Root cause is one (or two) — contributing factors are many.** Distinguish.
- **Disclosure decision is separate.** This skill writes the post-mortem; `incident-disclosure` (compliance-risk dept) handles whether / how / when we tell users.

## Workflow

1. **Verify the incident is resolved.** Or mitigated to safety. If still live, route to `debug-prod-incident`.
2. **Read the live debugging artefact.** `context/incidents/<incident-id>/` should contain the trace, timeline notes, mitigation log from `debug-prod-incident`.
3. **Assemble the timeline.** Per-event with timestamps. Sources: alerts, deploy log, support spike, monitoring graphs, on-call notes.
4. **Identify the root cause.** One or two specific things that, if not present, would have prevented the incident.
5. **Identify contributing factors.** Multiple. Why didn't we catch it sooner? Why was the blast radius what it was? Why did mitigation take as long as it did?
6. **Assess customer impact.** Aggregated counts (users affected, requests failed, revenue at risk if any). No PII. No support quotes.
7. **Cross-check support-triage.** Did support see this? When? Was the spike attributed correctly?
8. **Action items with owners + due dates.** Each owned by one person; each with a target date; each routable to a skill (`build-feature`, `fix-bug`, `webhook-review`, `vendor-review`, `update-config`).
9. **Disclosure recommendation.** Does this warrant user disclosure under our incident-disclosure policy? Hand off to compliance-risk dept's disclosure flow if yes — this skill recommends, does not execute.
10. **Council gates** + #4 sign-off if security-relevant.
11. **Emit** to `context/incidents/<incident-id>/postmortem-<YYYY-MM-DD>.md`.
12. **Propose the `incident-history.md` entry** (operator commits the append).

## Output format

```
# Post-mortem: <incident-id> — <YYYY-MM-DD>

## Summary
- Incident ID: <>
- Severity: <P0 | P1 | P2>
- Detection: <UTC timestamp>
- Mitigation: <UTC timestamp>
- Resolution: <UTC timestamp>
- Total duration: <>
- Customer-facing duration: <>
- Author: <council #>

## Customer impact
- Users affected: <count, aggregated>
- Requests / scans / payments affected: <count>
- Revenue at risk (if any): <amount>
- User-visible behaviour: <plain English>
- PII exposure: <none / contained / breach — escalates to disclosure>

## Timeline (UTC)
| Time | Event | Source |
| HH:MM | <change deployed | alert fired | mitigation applied | …> | <log / monitor / on-call note> |

## Root cause
<one or two specific causes; if more than two, you have contributing factors, not root causes>

## Contributing factors
- <factor 1>: <why it amplified / extended>
- <factor 2>: <>
- ...

## What went well
- <observation>
- <observation>

## What we'd do differently
- <observation; not yet an action item>

## Action items
| ID | Owner | Action | Due | Owning skill |
| 1 | <person> | <action> | YYYY-MM-DD | <build-feature / fix-bug / webhook-review / vendor-review / update-config> |
| 2 | ... | | | |

## Detection + alerting review
- How was it detected: <user report / alert / monitor / canary>
- Should it have been detected sooner: <yes / no — if yes, action item>
- Alerting gap: <if any — action item>

## Mitigation review
- Mitigation chosen: <>
- Time to mitigate: <>
- Could we have mitigated faster: <yes / no — if yes, action item>

## Cross-references
- Live debugging artefact: `context/incidents/<incident-id>/`
- Support spike (if any): cite `support-triage` brief
- Related prior incidents: <list from incident-history.md>
- ADRs that informed the affected system: <list>

## Council sign-off
- #36 Operations (lead): blameless framing; action items have owners + dates; aggregation honoured
- #10 DevOps / SRE: timeline accurate; mitigation review honest
- #4 Security (security-relevant incident): root cause + contributing factors + disclosure recommendation
- #34 Full-stack debugging engineer: trace cross-checked
- #18 Database engineer (if data-layer incident): query / migration cross-checked
- #30 Payment systems engineer (if payment incident): Stripe / webhook trace cross-checked
- #24 Data protection (VETO if PII exposure): signed before any disclosure path

## Disclosure recommendation
- Disclose to users: <yes / no>
- Disclose publicly: <yes / no>
- Reason: <>
- Handoff: `incident-disclosure` (compliance-risk dept) — operator confirms

## incident-history.md entry (proposed)
<the entry, ready to append to `memory/product-engineering/incident-history.md`>
```

## Self-review — Ops Council (mandatory)

- **#36 Operations (lead)**: blameless throughout? Every action item has owner + date? No "we should consider…"?
- **#10 DevOps / SRE**: timeline factual + chronological? Mitigation review honest about response time?
- **#4 Security (security-relevant)**: root cause analysis distinguishes "an attacker would have…" from "an attacker did…"? Disclosure recommendation matches incident type?
- **#34 Full-stack debugging engineer**: trace + log evidence cited correctly?
- **#24 Data protection (VETO if PII exposure)**: customer impact section accurate; disclosure path sound?
- **#9 Lawyer (regulatory implications)**: any regulatory notification triggered?

## Hard bans (non-negotiable)

- No naming individuals in cause / contributing factors. Describe systems + decisions.
- No editing a post-mortem after commit. Corrections via follow-up entry.
- No action items without owner + due date.
- No PII anywhere — no user names, no wallet addresses, no support message quotes.
- No disclosure decision made unilaterally — recommend; compliance-risk dept's `incident-disclosure` flow runs the actual disclosure with #24 VETO.
- No external publication (transparency post, blog) without `claim-review` + `writer` + `incident-disclosure` flow.
- No skipping the `incident-history.md` append. The history is the corporate memory of incidents.

## Product truth

- AG's failure modes by system: **scan failures** (RPC / indexer), **revoke failures** (wallet / gas), **payment failures** (Stripe / Coinbase webhooks), **auth failures**, **infra incidents** (Vercel / Neon / Cloudflare).
- The on-chain part of revoke is **out of our control** post-broadcast — incidents in this lane are about UX clarity, not protection failure.
- Webhook delivery failures must be handled with `webhook-review` action item — webhooks are payment-load-bearing.
- Cookie-consent rejection is **observed, not optimised** — incidents that "fix" this metric are themselves a problem.
- AG's incident posture is documented in `SECURITY.md`; post-mortem disclosure aligns with that policy.

## Boundaries

- Read-only against incident artefacts.
- Do not modify `incident-history.md` directly — propose the entry; operator commits.
- Do not run disclosure — recommend; compliance-risk dept executes.
- Do not touch `src/`. Action items route to engineering skills.

## Companion skills

Reach for these during authoring. All advisory.

- `clarify` — sharpening the summary paragraph.
- `debug-prod-incident` — predecessor; reads its artefacts.
- `webhook-review` — handoff for webhook-related actions.
- `vendor-review` — handoff if a vendor was a contributing factor.
- `security-claim-audit` — handoff if the incident invalidates a public security claim.
- `claim-review` — gate before any external publication.

## Memory

Read before authoring:
- `memory/admin-ops/MEMORY.md`
- `memory/product-engineering/incident-history.md` (prior incidents for context + recurrence detection)
- `memory/product-engineering/security-posture.md` (security claims to cross-check)
- `memory/compliance-risk/incident-disclosure.md` (disclosure policy)
- `memory/admin-ops/support-categories.md` (cross-check support spike)
- `memory/admin-ops/vendor-register.md` (if vendor was contributing factor)

Append to `memory/product-engineering/incident-history.md` on operator approval.
