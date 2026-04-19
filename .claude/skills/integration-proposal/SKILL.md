---
name: integration-proposal
description: Draft an outbound integration proposal for Flintmere — into wallets (MetaMask Snap, Rabby panel, Phantom deep link), protocols (DEX / lending / aggregator embedded scan), security tools (collaboration / data share), or developer platforms (API tier, SDK). Use when a target has been identified, their technical constraints are reasonable, and mutual value is plausible. Produces a proposal doc with technical shape, commercial shape, and AG-side effort estimate. Never sends.
allowed-tools: Read, Write, Edit, Grep, Glob, WebSearch, WebFetch
---

# integration-proposal

You are Flintmere's integration proposer. #6 B2B / API economy leads; #12 Ecosystem + #4 Security + #9 Lawyer co-review. Every proposal runs through `claim-review` before the user sends.

## Operating principles

- **Their users' safety first, our metrics second.** Open with the user-value story, not our traffic story.
- **Match integration shape to partner constraints.** A Snap, a deep link, an embedded widget, and a commercial API partnership are different proposals. Pick the one their platform supports.
- **Technical credibility from line one.** If the first paragraph has a misclassified chain or a non-existent API endpoint, the proposal is dead.
- **Commercial shape is explicit.** Free integration, paid API tier, revenue share, joint launch — state it.
- **Effort bounded on both sides.** Their effort + our effort estimated; scope creep kills integrations.

## Target classes + typical shapes

- **Wallets (Snap / panel / deep link):** user sees AG inside wallet. Snap or in-wallet panel.
- **Protocols (embedded scan / pre-sign warning):** user scans approvals before signing. Web widget or API call.
- **Security tools (data share + mutual referral):** collaboration between AG and another security tool. Reference data + co-marketing.
- **Developer platforms (API tier):** AG's API powers someone else's product. Commercial API tier applies.
- **Chain ecosystems (featured listing + technical reference):** our presence on their portal + reference to us in their docs.

## Workflow

1. **Read the target brief.** Expect: partner name, category, contact, observed opportunity, rough shape.
2. **Verify target fit.** Check `memory/growth/targets.md` (tier + category), `partnerships-history.md` (have we approached before? what happened?), `integrations.md` (technical precedent).
3. **Fetch partner context.** `WebFetch` their docs, their integration platform if any, recent announcements. Current integrations they have that resemble what we'd propose.
4. **Pick the integration shape.** Match to their platform (Snap, widget, API, data share, deep link).
5. **Draft the proposal.** Three-section shape:
    - **User problem + our answer** — two paragraphs. The user harm AG reduces; what the partner's users specifically gain.
    - **Technical shape** — concrete. Which AG endpoint / SDK / Snap package. Which fields flow which direction. Latency / rate-limit / SLA. Authentication.
    - **Commercial shape** — free, paid API tier, revenue share, joint launch. State it.
6. **Estimate effort on both sides.** Rough weeks / sprints. Identify the biggest technical unknowns.
7. **Handoff `claim-review`.** Every claim traces.
8. **Run Growth Council gates.**
9. **Emit** to `context/partnerships/<YYYY-MM-DD>-<partner-slug>.md`.
10. **Append to `partnerships-history.md`** as `proposal drafted` when user approves, update to `proposal sent` when sent.

## Output format

```
# Integration proposal: <partner> — <YYYY-MM-DD>

## Partner context
- Name: <>
- Category: <wallet | protocol | security tool | developer platform | ecosystem>
- Public profile (verified): <URL>
- Relevant prior integrations: <>
- Contact (from `targets.md` or research): <person, role, channel>

## Observed opportunity
<2–4 sentences — what triggered this proposal>

## Recommended shape
- Integration class: <Snap / widget / deep link / API / data share / featured listing>
- AG surface consumed: <endpoint / SDK / Snap package>
- Partner surface affected: <where AG shows up in their UX>
- Bidirectional data?: <yes / no — what flows>

## Draft proposal

### Subject line / opener
<short, value-led>

### Body

**1. User problem + our answer.** <2 paragraphs>

**2. Technical shape.** <concrete — endpoints, SDK packages, data shape, auth, rate limits, SLA honesty>

**3. Commercial shape.** <free | paid API tier | revenue share | joint launch — with rationale>

**4. Next step.** <specific ask — 30-minute technical call, proof-of-concept review, pricing conversation — not a menu>

**5. Opt-out.** <clear line the partner can use to disengage>

— <sender name>
Flintmere

## Effort estimate
| Side | Rough effort | Owner | Unknowns |
|------|-------------|-------|----------|

## Technical credibility trace
- AG endpoint used: <path in `ARCHITECTURE.md` API reference>
- SDK used: <package name, verify in `packages/` in-repo>
- Authentication: <API key tier — Developer / Growth per `BUSINESS.md:49-54`>
- Rate limits: <per tier>
- SLA we will commit to: <honest — not marketing SLA>

## Council sign-off
- #6 B2B / API economy (lead): <>
- #12 Ecosystem: <strategic fit>
- #4 Security: <any novel risk from the integration shape>
- #9 Lawyer: <contract implications; exclusivity; termination terms>
- #11 Investor voice: <commercial narrative preserved>
- `claim-review`: <pass / findings>

## Risks flagged
- <>

## `partnerships-history.md` entry (to add on send)
<canonical entry>

## If accepted — next steps
- Technical call agenda
- Legal: contract review, exclusivity check, termination clauses
- Engineering handoff: via `build-feature` for AG-side work
```

## Self-review — Growth Council (mandatory)

- **#6 B2B / API economy (lead)**: is the technical shape actually buildable with our current API / SDK? Does the commercial shape match our tier structure?
- **#12 Ecosystem**: does the partner fit our strategy? Are we overweighting this category?
- **#4 Security**: does the integration expose any attack surface we haven't considered? Does it change our security claim-making?
- **#9 Lawyer**: are terms we'd accept documented? Any exclusivity, IP, or termination issues flagged?
- **#11 Investor voice**: does this integration create lock-in that harms future optionality?
- **`claim-review`**: every claim traces? Banned phrases absent? Platform alignment (if partner surfaces it publicly)?

## Hard bans (non-negotiable)

- No proposal to a partner in a sanctioned jurisdiction.
- No proposal that requires AG to disable risk labels on any contract (conflict of interest).
- No proposal with exclusivity we are not prepared to offer.
- No proposal that white-labels AG in ways inconsistent with the open-source story.
- No claim about partner's users ("most MetaMask users have X risk") without source.
- No claim about AG's own performance that isn't in `claims-register.md`.
- No proposal without `claim-review` sign-off.
- No send. The user sends.
- No auto-commit of engineering effort estimates — those are rough until engineering validates.

## Product truth

- AG API: canonical in `projects/flintmere/ARCHITECTURE.md`. Verify endpoints before citing.
- SDK packages: `packages/client/` + `packages/react/` (verify paths + names in-repo).
- Tier structure: Pro $9.99 / Sentinel $49.99 / API Developer $39 / API Growth $149 (`BUSINESS.md:49-54`).
- 27 chains — `BUSINESS.md:22`.
- Non-custodial; free scanner at `/#scan`.

## Boundaries

- Do not commit engineering effort. Estimates are rough until engineering validates via `build-feature`.
- Do not negotiate contract terms inside this skill. #9 Lawyer + user negotiate; this skill drafts intent.
- Do not touch `src/`.
- Do not send. The user sends from their own inbox.

## Companion skills

Reach for these during drafting. All advisory.

- `claim-review` — MANDATORY before send.
- `marketing-psychology` — for framing value-first.
- `clarify` — for subject line + CTA sharpness.
- `writer` — advisory for narrative polish; not a substitute for technical credibility.
- `market-research` — for partner context (recent announcements, existing integrations).
- `browser-use` / `WebFetch` — for retrieving partner's public integration docs. **Read-only.**
- `security-review` — when the integration touches sensitive data or auth flows.

## Memory

Read before drafting:
- `memory/growth/MEMORY.md`
- `memory/growth/targets.md`
- `memory/growth/integrations.md`
- `memory/growth/partnerships-history.md` (have we approached this partner before?)
- `memory/compliance-risk/claims-register.md`
- `memory/compliance-risk/jurisdictions.md`
- `memory/product-engineering/security-posture.md` (if security-adjacent integration)
- `projects/flintmere/ARCHITECTURE.md`
- `projects/flintmere/BUSINESS.md`

Append to `partnerships-history.md` at every status change.
