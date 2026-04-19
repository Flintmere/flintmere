# chain-support.md

Scoped rules for EVM chain support. Canonical chain list + RPC providers live in `projects/allowanceguard/ARCHITECTURE.md`; this file is process + invariants only.

## Invariants

- 27 chains supported (source: `projects/allowanceguard/BUSINESS.md:22`). Verify before referencing the count.
- Chain configuration lives in `src/lib/chains.ts` (or canonical source — verify in-repo before editing).
- Every chain has: `chainId`, viem `Chain` config, at least one RPC provider, a block explorer URL, and a display name.
- Fallback RPC required. Single-RPC chains are a known risk, not a shipping state.
- Canonical chain IDs only. Never hardcode a numeric ID inline — import from the chain config.

## Adding a new chain — workflow

This is the producer path for the `add-chain` skill. Every step is a council gate.

1. **Confirm inclusion criteria.** Must have: live mainnet, stable RPC providers (≥2), public block explorer, real approval traffic, user demand or ecosystem signal. #3 Web3/DeFi + #12 Ecosystem sign-off.
2. **Define the chain config.** `chainId`, viem `Chain` definition, RPC provider list (primary + fallback), explorer URL, native currency metadata.
3. **Update the chain list.** Add to the canonical chain config file. Update `BUSINESS.md:22` chain count if needed.
4. **Update the indexer / scanner.** Wire the chain into the approval indexer paths. Confirm ERC-20/721/1155 coverage.
5. **Add a test.** At minimum, a test that the chain config is well-formed and reachable via the primary RPC (mocked or integration).
6. **Update public surfaces.** `ChainLogoCarousel.tsx`, any marketing copy that names the chain count, pricing copy if relevant. Copy changes go through the Copy Council via the marketing skills, not directly from this skill.
7. **Documentation.** Update `projects/allowanceguard/ARCHITECTURE.md` chain list. Update the API reference if the API exposes chain IDs.
8. **Deploy + verify.** Scan a known address on the new chain in staging. Confirm approvals detected, revocation flow works.

## Council gates for chain work

- **#3 Web3/DeFi domain expert** — approve vs increaseAllowance, Permit vs Permit2, ERC-20/721/1155 semantics on this chain. Most chain-specific bugs live here.
- **#32 Blockchain engineer (EVM)** — viem config correctness, multicall availability, RPC quirks (block time, reorg depth, finality).
- **#34 Full-stack debugging engineer** — RPC failure modes, timeout handling, fallback triggering.
- **#4 Security** — any chain-specific approval semantics that change the threat model.
- **#17 Performance** — new chain must not bloat the scanner's per-address time budget.

## Hard bans

- No testnets in the production chain list.
- No chains without a block explorer.
- No chains without a fallback RPC.
- No manually constructed chain objects that bypass the canonical config.

## When chain support is removed

Removal is rarer than addition. Triggers:
- RPC providers disappear and no replacement exists.
- Chain shuts down.
- Legal / compliance block (OFAC-sanctioned jurisdictions).

Removal follows the reverse of the add workflow and must leave user data intact — revocations users already performed stay visible, but new scans skip the chain.
