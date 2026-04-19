# platform-rules.md

External platform policy constraints. These rules are not ours; they belong to the platforms we depend on. They change without notice, so every pre-ship check re-verifies against the current policy.

`policy-alignment` is the skill that uses this file. Other skills consult it.

## Platforms in scope

| Platform | Why we care | Policy risk |
|----------|-------------|-------------|
| **Google Ads** | Any paid acquisition via Google (Search, Display, YouTube) | Crypto / financial services restrictions; cryptocurrency wallet ads require certification |
| **Meta Ads** (Facebook / Instagram) | Any paid acquisition via Meta | Cryptocurrency ad policy; evolving allowlist of approved advertisers |
| **Stripe** | Our primary subscription payments | Restricted Businesses list; cryptocurrency-related services have conditions |
| **Coinbase Commerce / Business** | Crypto checkout | Terms of service; supported currencies; settlement mechanics |
| **Cloudflare** | CDN, Turnstile, DNS | AUP — certain content prohibited; rate-limit enforcement interaction |
| **Vercel** | Hosting | ToS + AUP — compute quotas; acceptable content |
| **Neon** | Database | Data residency; backup retention |
| **GitHub** | Code hosting + CI | Community guidelines; export control |
| **Apple / Google Play** | Future mobile | (Currently N/A — note if we go mobile) |

## Known constraint patterns

### Google Ads — cryptocurrency

- Cryptocurrency exchanges, wallets, trading services: **require certification** in most jurisdictions.
- Allowance Guard: not an exchange, not a wallet custodian, not a trading service. We are a **security tool for wallet approvals**. But the copy, the landing page, and the broader product category can trigger pre-approval review.
- Pre-launch action: review the landing page under Google's current crypto ads policy. Flag any copy that reads as "crypto services" instead of "security tooling".
- Authoritative source: <https://support.google.com/adspolicy/answer/9662160> (verify current URL before each campaign).

### Meta Ads — cryptocurrency

- Meta operates an advertiser allowlist for cryptocurrency products.
- Non-allowlist advertisers can still run ads about blockchain-adjacent educational content, but the line is strict.
- Pre-launch action: decide whether we go via allowlist (requires KYC on the company) or run only education-classified content.
- Authoritative source: <https://transparency.meta.com/policies/ad-standards/restricted-content/cryptocurrency> (verify current URL).

### Stripe — restricted businesses

- Stripe's Restricted Businesses list includes "cryptocurrency-related services" with conditions.
- Allowance Guard is on the supported side: we are not a custodial wallet, not an exchange, not a cryptocurrency merchant. We sell a subscription to a security tool.
- Pre-launch action (already done): confirmed Stripe account approved for our business model. If the model ever shifts toward custodial / trading / money-transmission, re-verify.
- Authoritative source: <https://stripe.com/restricted-businesses> (verify current URL).

### Cloudflare Turnstile

- Turnstile is integrated on subscribe / contact forms and certain docs flows (`src/components/TurnstileWidget.tsx`, `src/lib/turnstile.ts`).
- Policy: Turnstile requires reasonable efforts not to present challenges in a way that creates accessibility barriers.
- Pre-launch action: confirm keyboard + screen-reader path through Turnstile challenge. Noor's accessibility review applies.

### App stores (future)

- Not currently in scope. If AG goes mobile, review:
    - Apple: cryptocurrency app policy, in-app purchase rules, "financial services" categorisation.
    - Google Play: similar plus geo-restriction handling.
- Record the review outcome in this file before any mobile launch.

## How this file is maintained

- **Update on: **
    - A platform changes its policy (we find out via news, platform email, account warning).
    - An AG campaign is blocked or rejected.
    - A new platform enters our dependency graph.
- **Do not update on:**
    - Speculation about future policy.
    - Internet rumours.
    - "I think they changed the rule" without a link.

Every update cites a link + a date. Old policy versions are retained; do not overwrite them — append a new note.

## When a platform's policy blocks us

1. `policy-alignment` identifies the block.
2. Produce a finding: which surface, which rule, what changed.
3. Route to the owning skill:
    - Marketing copy → `writer` + `conversion`.
    - Legal pages → `legal-page-draft`.
    - Engineering behaviour (e.g., data residency change) → `build-feature`.
    - Payment provider change → `implement-checkout-flow`.
4. Track in an issue; note the resolution date.
5. Update this file with the lesson.

## Policy-driven copy patterns

Some platform rules are best satisfied at the copy layer. Examples:

- **Google Ads crypto gate:** lead with "security tool" not "crypto tool". Describe the value as reducing approval risk, not as managing crypto.
- **Meta restricted content:** educational framing > promotional framing for cryptocurrency-adjacent creatives.
- **Stripe AML cues:** never describe AG as "helping users avoid KYC" or "protecting privacy from regulators" (catastrophic misread).
- **General banking / finance tone:** avoid "your money", "your assets", "your funds" as first-person direct address. Use "your wallet", "your approvals", "your token permissions".

These patterns are not banned phrases from `memory/VOICE.md` — they are platform-specific patterns to apply on top. Marketing skills consult this file when drafting surfaces that could trigger ad review.
