# brand.md — Allowance Guard voice

Canonical voice lives in `memory/VOICE.md`. Commercial rationale lives in `projects/allowanceguard/BUSINESS.md:64-80`. This file is the operational brief marketing skills read before they write.

## Principles

- Imperative mood. Short sentences. No hedging.
- No "please", no "try to", no apologies, no filler ("Note that...", "It's worth mentioning...").
- No emojis unless the user explicitly asks.
- Evidence-first. Every claim traces to a source (`BUSINESS.md`, `ARCHITECTURE.md`, or an ADR).
- Educate, clarify, guide. Do not exaggerate. Do not weaponise fear.

## Hard bans (non-negotiable)

Copied from `memory/VOICE.md:14-25`. Gatekeeper: Investor / founder voice (#11 on the Standing Council).

- "Free Forever" (as a blanket statement)
- "No premium features, no paywalls, no subscriptions"
- "100% free"
- "No VC"
- "No token"
- "Community-funded"
- "Donation-funded"
- Any defensive financial self-disclaimer

These block grant, SEIS/EIS, and VC funding applications, and contradict the open-core freemium + B2B API revenue model. Replace with operational claims (open source, independent, sustainable) — never with financial self-disclaimers.

## Preferred phrasing

From `memory/VOICE.md:33-37` and `BUSINESS.md:68-70`.

- "Core tool: free and open source. Always."
- "Premium monitoring and API access for power users and teams."
- "Open source core. Independently operated. Built to last."

## Register

| Use | Avoid |
|---|---|
| approvals, permissions, smart contracts | "degen", "ape in", "wagmi", "gm" |
| risk, exposure, visibility | "cope", "cooked", "rekt" |
| revoke, scan, monitor | "nuke it", "smash revoke" |
| wallet, address, signer | "bag", "wallet fren" |

Security tooling register. Not memecoin register.

## Proof standards

- **Chain count**: 27 (source: `BUSINESS.md:22`, `ARCHITECTURE.md`). Never "10+", never "100+".
- **Pricing**: Pro $9.99/mo or $79/yr; Sentinel $49.99/mo or $499/yr; API Developer $39/mo or $374/yr; API Growth $149/mo or $1,490/yr. Source: `BUSINESS.md:49-54`.
- **Free tier**: scan up to 3 wallets, single-chain, manual revocation, basic risk labels, no account required. Source: `BUSINESS.md:11-17`.
- **Three capabilities, kept distinct**:
  - Visibility — see what's approved. Free tier does this.
  - Monitoring — continuous watch + alerts. Pro/Sentinel only.
  - Revocation — send the on-chain transaction. Free tier is manual; Sentinel has automated rules.

## Never claim

- Absolute safety ("you are protected", "scam-proof", "never lose funds").
- Custody or control over user funds. Allowance Guard is non-custodial — users sign every transaction in their own wallet.
- Automated protection on the free tier. Monitoring is a paid feature.
- Legal, financial, or tax advice.

## Cross-references

- Banned phrases — `memory/VOICE.md`
- Rationale behind bans — `BUSINESS.md:64-80`
- Voice workflow rules — `memory/PROCESS.md` (Copy Council #20, #21, #22)
- Legal gating — `memory/PROCESS.md` (Legal Council #9, #23, #24)
