# ecosystems.md

Live tracked ecosystems with their funding programmes, deadlines, contacts, and evaluation criteria. This is the **operational file** for `grant-application`. Targets in general live in `targets.md`; programme-specific detail lives here.

## Tracking format

```
## <Ecosystem name>

- **Programme(s):** <name each open programme>
- **Application URL:** <link — verify before use>
- **Amount range:** <typical award size>
- **Evaluation cycle:** <rolling | seasonal | ad-hoc>
- **Typical deadline:** <when the next one is if seasonal>
- **Decision timeline:** <typical days from submission to outcome>
- **Contact:** <ecosystem lead, email, community channel>
- **Evaluation criteria (verbatim or paraphrased with source):** <>
- **Common disqualifiers:** <things that reject applications>
- **AG's fit:** <why AG matches this programme>
- **Evidence of AG's fit:** <chain support, user count, public writeups, open-source commits>
- **Last updated:** YYYY-MM-DD
```

## Ethereum Foundation

- **Programme(s):** Ecosystem Support Program (ESP), Academic Grants, Next Billion Fellowship.
- **Application URL:** <verify live URL before use; the EF regularly updates their programme pages>.
- **Amount range:** $10K–$250K typical; larger for infrastructure grants.
- **Evaluation cycle:** rolling (ESP); seasonal (others).
- **Decision timeline:** 4–12 weeks.
- **Evaluation criteria:** public-goods orientation; developer / ecosystem impact; open source; credibility of the team.
- **AG's fit:** security infrastructure for Ethereum users; open-core; 27-chain coverage reinforces Ethereum-centric story.
- **Common disqualifiers:** closed-source; token launch baked into application; primarily L1-competing.
- **Last updated:** <to set on first use of this file>

## Optimism

- **Programme(s):** RPGF (Retroactive Public Goods Funding) rounds; Grants Council (standard grants); Mission Grants (specific initiatives).
- **Application URL:** <verify>.
- **Amount range:** highly variable. RPGF: six-figure to seven-figure for top projects. Standard grants: $10K–$100K.
- **Evaluation cycle:** RPGF seasonal (previously ~2×/year; check current cadence). Standard: quarterly-ish.
- **Evaluation criteria:** (RPGF) retroactive impact on the Optimism ecosystem; (standard) forward-looking deliverables aligned with roadmap.
- **AG's fit:** security for OP-stack chains; growing footprint across Base + Optimism + other OP-stack networks.
- **Common disqualifiers:** projects that have already received substantial funding elsewhere (RPGF accounts for this).
- **Last updated:** <>

## Base (Coinbase ecosystem)

- **Programme(s):** Base Ecosystem Fund (in partnership with Coinbase Ventures); Builder Grants.
- **Application URL:** <verify>.
- **Amount range:** Ventures: material equity / token rounds. Builder grants: smaller.
- **Evaluation cycle:** Ventures: ongoing. Builder grants: rolling.
- **Evaluation criteria:** Base adoption signal; alignment with Coinbase product roadmap; revenue potential for ecosystem.
- **AG's fit:** wallet security on Base; Coinbase Commerce already in our payment stack.
- **Common disqualifiers:** pure infrastructure without user-visible story.
- **Last updated:** <>

## Arbitrum Foundation

- **Programme(s):** STIP (Short-Term Incentive Programme), LTIPP (Long-Term), Domain Grants.
- **Application URL:** <verify; Arbitrum Forum proposals are part of the flow>.
- **Amount range:** varies; STIP rounds have been $ARB-denominated with material grants for qualifying protocols.
- **Evaluation cycle:** seasonal rounds with specific open windows.
- **Evaluation criteria:** ecosystem activity; on-chain metrics the programme specifies; decentralised governance vote where applicable.
- **AG's fit:** approvals security for Arbitrum ecosystem.
- **Common disqualifiers:** weak on-chain activity (programmes evaluate against TVL / user metrics).
- **Last updated:** <>

## Polygon

- **Programme(s):** Polygon Village grants; Polygon Ventures.
- **Application URL:** <verify>.
- **Amount range:** variable.
- **Evaluation cycle:** rolling.
- **AG's fit:** Polygon support in AG; approvals on POS and zkEVM.
- **Last updated:** <>

## Gitcoin Grants

- **Programme(s):** Quadratic-funded rounds; Beta rounds; community rounds.
- **Application URL:** `grants.gitcoin.co` (verify).
- **Amount range:** community-funded; matching pool varies by round. Often $100–$10K per project per round.
- **Evaluation cycle:** seasonal rounds.
- **AG's fit:** security public good; open-core story fits quadratic funding.
- **Common disqualifiers:** sybil flags; poor community engagement during round.
- **Last updated:** <>

## Protocol Guild

- **Programme(s):** Open-source funding for Ethereum protocol maintainers.
- **Application URL:** <verify>.
- **Amount range:** material; ongoing rather than one-off.
- **AG's fit:** **limited** — Protocol Guild is for L1 protocol maintainers specifically. AG is ecosystem-adjacent. Cite only where a direct contribution to protocol-level infrastructure is credible.
- **Last updated:** <>

## a16z Crypto Startup School / Paradigm Fellowship

- **Programme(s):** Accelerator cohorts (a16z CSS); research fellowships (Paradigm).
- **Amount range:** equity / fellowship-based rather than straight grant.
- **AG's fit:** accelerator story is stronger than fellowship (AG is a shipping product).
- **Common disqualifiers:** geographic restrictions on cohort participation; commitment requirements.
- **Last updated:** <>

## Smaller ecosystem programmes

Each of the following has a grant programme worth tracking (add per-programme entries as they become relevant):

- Avalanche Foundation
- BNB Chain Innovation Program
- Scroll ecosystem grants
- zkSync ecosystem
- Linea ecosystem
- Mantle grants
- Blast ecosystem (when post-incentive phase matures)

Our 27-chain coverage means most major EVM ecosystems have some fit — but the evaluation criteria differ widely. Tier 3 (monitor) until a specific programme becomes relevant.

## Ecosystems we do not pursue

Write these down to avoid re-asking:

- Closed-source only programmes — AG is open-core; closed-source grants are a poor fit.
- Token-gated programmes that require launching a token — we do not have a token, and launching one against the claim "no token" in our voice memo would be catastrophic.
- Programmes that require equity at terms that conflict with founder governance.
- Programmes in OFAC-sanctioned jurisdictions (see `memory/compliance-risk/jurisdictions.md`).

## How this file is maintained

- On every `grant-application` run: verify the programme's URL is live and the criteria haven't shifted.
- When a programme launches / ends / restructures: update here + note in `grants-history.md`.
- When we are invited into a programme we didn't apply to: add an entry here noting the relationship origin.
- Every entry cites a source + date on its last-updated line.

## Open questions for the operator

- What is AG's current annual revenue / run-rate? Some programmes require financials.
- Is AG a UK Ltd company only, or are there sister entities? Jurisdictional fit matters.
- Is there a stated policy on equity / token / convertible structures the company will / won't accept? Needed for accelerator programmes.
- Who is authorised to sign grant agreements? (Usually the founder, but must be documented.)

Answer these once; they become canonical. Store answers in `BUSINESS.md` or an ADR, not here.
