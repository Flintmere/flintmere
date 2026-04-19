# audiences.md — Segments

Four primary segments. Each row is a writable prompt: what they feel, what they object to, what they want, where they live.

## 1. Retail wallet user (self-custody, moderate DeFi exposure)

- **Profile**: holds a MetaMask or Rabby wallet with 5–50 token approvals across 2–4 chains. Has heard of "infinite approvals" but isn't sure which ones are theirs.
- **Pain**: doesn't know what's exposed. Saw a Twitter thread about a drainer and got spooked. Doesn't want to re-sign every approval but doesn't want to get drained either.
- **Objection**: "Do I have to connect my wallet? Is this safe? What happens to my keys?"
- **Desired outcome**: paste address, see risk, understand the top three things to revoke right now, do it with minimal friction.
- **Register**: plain English, no jargon. Define terms the first time (approval, allowance, permit). Show, don't tell.
- **Channels**: X search, Reddit (r/ethereum, r/defi, r/metamask), Google ("how to revoke token approvals"), crypto Twitter threads.
- **Headline hook**: "Paste an address. See what's approved. Revoke what shouldn't be."

## 2. Advanced DeFi user / power user

- **Profile**: runs 3+ wallets across Ethereum, Base, Arbitrum, Optimism, maybe more. Uses Uniswap, Aave, Pendle, 1inch. Uses Permit2. Knows what `setApprovalForAll` means.
- **Pain**: too many approvals to track by hand. Wants continuous monitoring, not one-time audits. Wants batch revocation to save gas.
- **Objection**: "Revoke.cash already does this. Why pay?" "How is this different from Etherscan's approval tab?"
- **Desired outcome**: central dashboard across all their wallets, alerts on changes, batch revoke, historical risk timeline.
- **Register**: precise technical language. Permit vs Permit2, ERC-20 vs ERC-721, approve vs increaseAllowance — get the details right or lose them.
- **Channels**: X, Farcaster, DeFi-specific newsletters (The Defiant, Bankless), specialist Discords.
- **Headline hook**: "Multi-wallet monitoring across 27 chains. Batch revoke. Timeline view."

## 3. Security-conscious operator / team (treasuries, DAOs, funds)

- **Profile**: manages a multi-sig or treasury wallet with significant exposure. Has compliance obligations. Needs audit trails.
- **Pain**: one bad approval on a shared wallet = existential risk. Current tooling doesn't produce audit-grade output.
- **Objection**: "Can I trust this with a treasury address? What's the audit log format? Do you retain data?"
- **Desired outcome**: monitor up to 50 wallets, role-based team access, webhook integrations into internal alerting, compliance-ready export.
- **Register**: operational. Evidence, SLAs, data handling. No hype.
- **Channels**: direct outreach, security research newsletters (Dedaub, Trail of Bits public posts), DAO ops forums (Discourse, Commonwealth).
- **Headline hook**: "Audit-ready monitoring for treasuries and DAOs."

## 4. Ecosystem / grant reviewer / wallet product team

- **Profile**: works at a wallet (MetaMask, Rabby, Rainbow, Trust, OKX), an L2 (Base, Arbitrum, Optimism), or a grant programme. Evaluating Allowance Guard for integration, listing, or funding.
- **Pain**: inbox full of projects. Wants to know in 60 seconds whether this is credible, maintained, open source, and aligned with their ecosystem.
- **Objection**: "Team credibility? Funding runway? Open source for real? Chain coverage?"
- **Desired outcome**: clear one-pager. Proof of traction. Clean code base. Open source licence visible. Contact route for integration.
- **Register**: operational, evidence-heavy, low-ego. No marketing fluff. Link to the repo, link to metrics, link to the team.
- **Channels**: grant programme forms, ecosystem Telegram/Discord DMs, introductions via mutual partners.
- **Headline hook**: "Open-source approval security for 27 chains. Integrations welcome."

## Mapping table (segment → surface → metric)

| Segment | Primary surface | Primary metric |
|---|---|---|
| Retail | Homepage scanner (`/#scan`) | Scans per day, extension installs |
| Power user | Pricing page, Pro signup | Pro conversion rate |
| Operator / team | Sentinel page, sales page | Sentinel signups, demo requests |
| Ecosystem / grants | GitHub README, one-pager | Partnership conversations opened |

## Do not confuse

- "Retail" is not "degen." Retail wants safety, not yield.
- "Advanced" is not "institutional." Power users self-serve. Institutions want contracts.
- Grant reviewers are not investors. Different asks, different materials.
