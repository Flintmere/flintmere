# grants-history.md

Append-only log of grant applications + outcomes for Flintmere. Every application leaves a trace here.

**Current posture**: grants are **low priority at launch**. Flintmere is a commercial SaaS selling Shopify-app subscriptions; the business model is not grant-funded. This file exists so that if UK/EU SME programmes or digital-commerce research grants become relevant at month 4+, we have the discipline to apply seriously.

## Entry format

```
## YYYY-MM-DD — <grant programme> — <status>

- **Programme:** <ecosystem + programme name>
- **Application link:** <>
- **Amount requested:** <>
- **Amount awarded:** <if won; blank otherwise>
- **Application file:** `context/grants/<YYYY-MM-DD>-<slug>.md`
- **Submitted:** YYYY-MM-DD
- **Decided:** YYYY-MM-DD (or TBD)
- **Decision:** pending | won | declined | paused-for-revision | abandoned
- **Decision rationale (from grantor if provided):** <>
- **Lessons learned:** <>
- **Follow-ups:** <milestones if won; reapply cadence if declined>
- **Owner:** <operator + council member who shepherded>
```

## Rules

- **Append-only.** No rewriting past entries; add follow-ups.
- **Every application gets an entry**, even abandoned ones. Abandonment is data.
- **Every award comes with a milestone list.** Missed milestones damage relationships + future applications.
- **Decline is not failure.** The programme may not have fit. Record rationale and move on.
- **Multi-stage grants** get one entry per stage.

## Log

<!-- Append newest first. No entries yet. -->

## Programmes of interest (revisit month 4+)

### UK SME / SaaS programmes

- **Innovate UK** — SME innovation grants (£25K–£250K typical). Relevant if Flintmere pursues AI-specific R&D. Criteria: innovation + commercial potential.
- **UK R&D Tax Credits** — not a grant per se, but material cash-flow instrument for SaaS dev costs. Route via accountancy, not `grant-application`.
- **Tech Nation / UK Digital successor programmes** — scale-up support. Relevant Series A-adjacent.

### EU digital commerce programmes

- **Horizon Europe — digital commerce / SME Instrument** — large, bureaucratic, research-heavy. Not a good early-stage fit.
- **EIT Digital accelerators** — scale-up programmes across EU. Variable fit.

### Research grants (academic partnerships)

- Partnerships with UK / EU ecommerce research programmes (LBS, INSEAD, Wharton Baker Retailing Center). Co-authored research with aggregated scanner data.

### Shopify-specific (not grants, but funding-adjacent)

- **Shopify Partner resources** — tools, credits, API quotas. Inherently part of Partner Program.
- **Built-for-Shopify badge** — credibility benefit, not cash.

## Programmes we do not pursue

- **Web3 / crypto grants** (Ethereum Foundation, Optimism, Base, Arbitrum, Gitcoin, Polygon) — inherited from allowanceguard kit; do not apply. Flintmere is not Web3.
- **Programmes requiring token launch** — we do not have a token; no plan to.
- **Programmes in OFAC-sanctioned jurisdictions**.
- **Closed-source-only programmes** — inconsistent with how we handle `packages/scoring` (currently closed; open-core consideration deferred).

## Patterns to watch (as entries accumulate)

- **Chronic mismatch** — a programme consistently declines for reasons suggesting poor fit. Remove from `ecosystems.md` active list.
- **Amount patterns** — programmes award less than requested routinely. Adjust initial ask.
- **Timing patterns** — programmes with stated windows. Miss them = cost.
- **Evaluation patterns** — specific criteria that move the needle (merchant count, case studies, open-source commits if relevant, measurable outcomes).

Record patterns in `ecosystems.md` per programme after second data point.

## Reapplication cadence

- **Declined with feedback** — reapply after addressing feedback, typically next cycle.
- **Declined without feedback** — wait at least two cycles; send brief re-intro before reapplying.
- **Won** — deliver milestones; maintain relationship; reapply to successor programmes.
- **Paused-for-revision** — ecosystem in flux; wait for stabilisation signal.

## Reporting obligations (once a grant is won)

Every won grant has obligations:

- **Public disclosure** — many grants require acknowledgement on website or in blog post. Routes through `claim-review` + Legal Council.
- **Progress reports** — most grantors require milestone reports. Calendar them.
- **Financial reporting** — some require audited accounts. #9 Lawyer + #23 Regulatory review.
- **Follow-up communications** — maintain relationship post-award for future opportunities.

Obligations tracked per-entry. Missed obligations logged as entries with `decision: default`.

## When a won grant goes wrong

- **Milestone missed due to product change** → notify grantor proactively; negotiate revision. Record here.
- **Relationship sours** → unwind gracefully; refund unused funds if required. Record the unwind rationale.
- **Grantor fails to fund** → rare but possible. Consult #9 Lawyer; record and move on.

## Integration with other memory

- Programme details in `ecosystems.md`.
- Specific partner contacts in `targets.md`.
- Application copy drafts in `context/grants/` (gitignored).
- Public claims from won grants register in `memory/compliance-risk/claims-register.md`.

## Changelog

- 2026-04-19: Rewritten for Flintmere. Removed Web3 grant programmes (Ethereum Foundation ESP, Optimism RPGF, Base ecosystem, Arbitrum STIP/LTIPP, Polygon Village, Gitcoin, Protocol Guild, a16z Crypto Startup School, Paradigm Fellowship). Added UK SME + EU digital commerce programmes (Innovate UK, R&D Tax Credits, Horizon Europe, EIT Digital) as low-priority future targets.
