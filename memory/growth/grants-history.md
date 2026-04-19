# grants-history.md

Append-only log of grant applications + their outcomes. Every application leaves a trace here.

## Entry format

```
## YYYY-MM-DD — <grant programme> — <status>

- **Programme:** <ecosystem + programme name>
- **Application link:** <if available>
- **Amount requested:** <>
- **Amount awarded:** <if won; blank otherwise>
- **Application file:** `context/grants/<YYYY-MM-DD>-<slug>.md`
- **Submitted:** YYYY-MM-DD
- **Decided:** YYYY-MM-DD (or TBD)
- **Decision:** pending | won | declined | paused-for-revision | abandoned
- **Decision rationale (from grantor if provided):** <>
- **Lessons learned:** <what we'd do differently; what resonated>
- **Follow-ups:** <milestones to deliver if won; reapply cadence if declined>
- **Owner:** <the person on our side who shepherded this>
```

## Rules

- **Append-only.** Do not edit a past entry to rewrite history; add a follow-up entry for updates.
- **Every application gets an entry**, even abandoned ones. Abandonment is data.
- **Every award comes with a milestone list.** Grants have deliverables; miss them and the relationship + future applications suffer.
- **Decline is not failure.** The programme may not have fit. Record the rationale and move on.
- **Multi-stage grants** (e.g., RPGF) get one entry per stage.

## Log

<!-- Append newest first. No entries yet under this department structure. -->

## Patterns to watch

As entries accumulate, patterns will emerge. Examples to watch for:

- **Chronic mismatch** — a programme consistently declines us for reasons that suggest poor fit. Remove from `ecosystems.md` active list.
- **Pricing / amount patterns** — programmes routinely award less than we request. Adjust initial ask.
- **Timing patterns** — programmes have stated windows; missing them has a cost. Put deadlines in the team calendar.
- **Evaluation patterns** — specific criteria that move the needle (open-source commits, developer testimonials, on-chain metrics).

Record patterns in `ecosystems.md` per programme after the second data point. One outcome is a story; two is a pattern.

## Reapplication cadence

- **Declined with feedback:** reapply after addressing feedback, typically next cycle.
- **Declined without feedback:** wait at least two cycles; send a brief re-intro before reapplying.
- **Won:** deliver milestones; maintain relationship; reapply to successor programmes or complementary ones at the ecosystem.
- **Paused-for-revision:** ecosystem is in flux; wait for stabilisation signal.

## Reporting obligations (once a grant is won)

Every won grant has obligations:

- Public disclosure — many grants require acknowledgement on the website or in a blog post. The acknowledgement runs through `claim-review` + Legal Council.
- Progress reports — most grantors require milestone reports. Calendar them.
- Financial reporting — some require audited accounts or tax treatment documentation. #9 Lawyer + #23 Regulatory review.
- Token considerations — some programmes grant in native tokens. #9 + #23 + #24 (tax + regulatory + data) convene before accepting.

Obligations tracked per-entry. Missed obligations are logged as entries with `decision: default`.

## When a won grant goes wrong

- **Milestone missed due to product change:** notify grantor proactively; negotiate revision. Record in this file.
- **Relationship sours:** unwind gracefully; refund unused funds if the grant terms require; record the unwind rationale.
- **Grantor fails to fund:** rare but possible. Record; consult #9 Lawyer; unlikely to sue — record and move on.

## Integration with other memory

- Programme details live in `ecosystems.md`.
- Specific partner contacts live in `targets.md`.
- Application copy drafts live in `context/grants/`.
- Public claims that arise from won grants (e.g., "funded by Optimism RPGF") register in `memory/compliance-risk/claims-register.md`.
