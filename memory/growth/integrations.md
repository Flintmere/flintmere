# integrations.md

Current integrations + requested integrations + technical constraints per integration partner. This is the **operational file** for `integration-proposal`.

## Integration shapes

AG can be integrated outbound (we provide API / SDK / data; partner consumes) or inbound (we consume partner data). Most opportunities are outbound — our value to partners is the approval scan engine, the revocation flow, and the risk labelling.

### Outbound integration surfaces

- **REST API** — `projects/allowanceguard/ARCHITECTURE.md` documents the canonical API. Two tiers: API Developer ($39/mo — `BUSINESS.md:49-54`), API Growth ($149/mo).
- **JS client package** — `@allowance-guard/client` (verify package name in `packages/client/`). Types generated from OpenAPI.
- **React components** — `@allowance-guard/react` (verify in `packages/react/`). Drop-in widgets.
- **Webhook** — for protocols wanting async risk notifications.
- **Reference data** — malicious-contract lists (where available); safe-to-revoke heuristics.

### Inbound integrations (where AG consumes partner data)

- **RPC providers** — Alchemy, Infura, QuickNode, Ankr. Already core infrastructure.
- **Malicious-contract feeds** — Chainabuse, ScamSniffer, MistTrack (potential; evaluate legal + commercial terms).
- **Wallet risk data** — Harpie, Chainalysis (potential; caution on cost + privacy).
- **Token metadata** — CoinGecko, Trust Wallet assets, 1inch tokens list.

## Current integrations

### Cloudflare Turnstile

- **Shape:** inbound infrastructure.
- **Surface:** signup form, subscribe form, certain docs paths (`src/components/TurnstileWidget.tsx`, `src/lib/turnstile.ts`).
- **Agreement:** Cloudflare standard ToS.
- **Notes:** respect accessibility requirements (Noor review).

### Stripe

- **Shape:** payment integration.
- **Surface:** subscription checkout, webhook-driven entitlement.
- **Agreement:** Stripe standard ToS + Restricted Businesses approved status.

### Coinbase Commerce + Coinbase Business

- **Shape:** crypto payment integration.
- **Surface:** crypto checkout (USDC on Base primarily).

### Neon

- **Shape:** database infrastructure.

### Vercel

- **Shape:** hosting infrastructure.

### GitHub

- **Shape:** code hosting + CI.

(This list is inbound-infrastructure heavy; outbound integration targets are where the growth opportunity lives.)

## Requested / in-progress integrations

<!-- Append as conversations begin. Entries here become `partnerships-history.md` records once formal engagement happens. -->

### Example template

```
### <Partner name>

- **Shape:** outbound API | SDK | widget | data | Snap | deep link | other
- **Status:** scoping | proposal drafted | proposal sent | technical conversation | integration build | live | declined | paused
- **Contact:** <person, role, company, channel>
- **Technical constraints:**
    - Required chains: <>
    - Required response time: <>
    - Required SLA: <>
    - Data shape: <>
- **Commercial shape:** <free, paid API tier, revenue share, grant-funded integration>
- **Timeline:** <>
- **AG-side work:** <engineering effort estimate; handoff to build-feature>
- **Partner-side work:** <their effort estimate>
- **Risk flags:** <jurisdiction, compliance, security concerns>
- **Last activity:** YYYY-MM-DD
```

## Integration shapes by partner type

### Wallets → AG Snap / panel / deep link

- **Snap (MetaMask):** TypeScript Snap consuming AG API + rendering in wallet UI. Snap permissions model is the constraint.
- **Rabby / Phantom / Coinbase Wallet:** deep-link integration or in-wallet panel via the wallet's platform.
- **Safe / multisig:** transaction-preview integration before approval; different risk story (team signing).

### Protocols → AG embedded scan

- DEX / lending / aggregator embeds "Check your approvals" CTA → deep-link to AG scan.
- Advanced: protocol calls AG API during user session to warn before approval.

### Security tool collaborations

- Data-sharing partnerships (AG exports malicious-contract observations; partner reciprocates).
- Mutual-endorsement (joint content; not paid endorsement).
- Integration where the security tool uses AG's revocation engine as a component.

### Chain ecosystems → featured listing

- Ecosystem portal listing (Base, Arbitrum, Optimism portals).
- Ecosystem marketing push (joint announcement, cohort programme).

### Education platforms

- Curriculum module (e.g., "wallet approval safety" course using AG as the lab environment).
- Hackathon sponsorship with AG API as a prize track.

## Technical standards we maintain for integrations

- **OpenAPI spec** — public; canonical path in `projects/allowanceguard/ARCHITECTURE.md`. Every integration partner references this.
- **Rate-limit tiers** — per API tier; documented in `ARCHITECTURE.md`. Partners negotiate higher tiers if justified.
- **Webhook reliability** — signed, idempotent, versioned. See `webhook-review` skill in engineering.
- **SDK compatibility** — semver; breaking changes batched into major releases with 90-day deprecation notice.
- **Uptime story** — honest SLA, not marketing SLA. Current posture: best-effort 99.9% on scan endpoints; no SLA on dashboard. Sentinel tier may move toward paid SLA.

## Hard-no integration patterns

We do not integrate with:

- Wallets or services operating in OFAC-sanctioned jurisdictions.
- Projects whose primary business is market-making for tokens with evident fraud history.
- Partners who request that AG disable risk labels on specific contracts they have interest in (conflict of interest).
- Partners who require white-labelling that hides the AG brand in ways inconsistent with our open-source story.
- Partners who require exclusivity we are not prepared to offer. We are not exclusive to any chain or wallet.

## How this file is maintained

- On every `integration-proposal` run: verify status + technical constraints per partner entry.
- On every integration shipping / pausing / ending: update status + note in `partnerships-history.md`.
- On every change to AG's own API / SDK / reference data: update the "Technical standards" section above.
- On every integration termination: the reason is recorded in `partnerships-history.md`; no finger-pointing, facts only.
