# claims-register.md

Append-only log of Allowance Guard's public claims + their source of truth. Every claim that appears in marketing, UI, docs, legal pages, outreach, or API responses should be traceable here.

If a claim isn't in this register, it either needs adding or it shouldn't be shipping.

## Entry format

```
## <short claim name>

- **Claim text (verbatim):** "<the sentence as it appears in public>"
- **Surfaces:** <where the claim lives — file paths, URLs, marketing copy>
- **Source of truth:** <BUSINESS.md:NN / ARCHITECTURE.md:NN / ADR path / external citation>
- **Classification:** factual | security | regulatory | commercial | performance
- **Last verified:** YYYY-MM-DD by <skill or person>
- **Risk if wrong:** <one line — what happens if the claim is inaccurate>
- **Status:** active | retired (replaced by <> on YYYY-MM-DD)
```

## Rules

- Append-only. Never edit a past entry to change a claim's history; add a follow-up entry marking the old one retired.
- Every claim shipped via any skill (`writer`, `conversion`, `legal-page-draft`, etc.) gets a register entry before or at ship time.
- `claim-review` and `security-claim-audit` operate against this register — any public claim not here is a P0 finding.
- Re-verify quarterly. `compliance-risk` runs a claim sweep; stale "last verified" dates flag for re-check.

## Claim classifications

- **factual** — product facts (chain count, tier prices, feature availability). Source: BUSINESS.md / ARCHITECTURE.md.
- **security** — what AG does / does not protect against. Source: ARCHITECTURE.md + `memory/product-engineering/security-posture.md`. Highest scrutiny — #4 + #9.
- **regulatory** — GDPR, PECR, UK / EU regulatory posture. Source: legal page + regulatory citation. #24 VETO.
- **commercial** — tier, pricing, non-custodial, open-source status, funding model. #11 gatekeeper.
- **performance** — scan speed, chain count, uptime. Source: metrics + BUSINESS.md.

## Banned claim patterns (enforce across every entry)

- "Protects your wallet from hackers" → reject. Use "reduces exposure to malicious approvals".
- "GDPR compliant" → reject. Use "designed to comply with UK GDPR; see our Privacy Policy".
- "Bank-level security" → reject. Meaningless marketing phrase with regulatory exposure.
- "Guaranteed" (anything) → reject.
- "Free Forever" (as a blanket) → reject. Use "Core tool: free and open source. Always."
- "100% safe" / "100% secure" / "100% anything" → reject.
- Any claim that could be read as a securities offering → reject + #23 review.

## Known claims (current)

<!-- Backfill as the register is built out. Initial entries to land via the first `compliance-audit` sweep. The skeleton below seeds the pattern. -->

### Chain count — 27

- **Claim text:** "27 chains supported" (and variants).
- **Surfaces:** `BUSINESS.md:22`, homepage hero, pricing copy, blog posts, API reference.
- **Source of truth:** `projects/allowanceguard/BUSINESS.md:22` (authoritative chain count). Verify before citing.
- **Classification:** factual
- **Last verified:** <to be set by first claim-review pass>
- **Risk if wrong:** every marketing surface + SEO out of sync; customer trust erosion.
- **Status:** active

### Non-custodial

- **Claim text:** "Non-custodial. Users sign every transaction in their own wallet."
- **Surfaces:** homepage, FAQ, docs, every marketing surface that mentions revocation.
- **Source of truth:** `projects/allowanceguard/ARCHITECTURE.md` (auth + wallet section), product design.
- **Classification:** security + commercial
- **Last verified:** <>
- **Risk if wrong:** catastrophic trust loss; potential misleading-practices exposure under #23.
- **Status:** active

### Free scanner at /#scan

- **Claim text:** "Free scanner at /#scan, no account required."
- **Surfaces:** homepage, pricing page, marketing site.
- **Source of truth:** `projects/allowanceguard/BUSINESS.md:49-54` + product behaviour at `src/app/page.tsx` scanner integration.
- **Classification:** commercial
- **Last verified:** <>
- **Risk if wrong:** banned-phrase gatekeeper flags inconsistency with "always free core tool".
- **Status:** active

### Pricing — Pro $9.99/mo or $79/yr

- **Claim text (and variants for Sentinel / API tiers):** see `BUSINESS.md:49-54` for the full ladder.
- **Surfaces:** pricing page, homepage CTA, upgrade flows, Stripe product configuration.
- **Source of truth:** `BUSINESS.md:49-54` + Stripe Dashboard price IDs.
- **Classification:** commercial
- **Last verified:** <>
- **Risk if wrong:** mismatched copy between marketing and checkout = customer distrust; potential advertising standards issue (#23).
- **Status:** active

## When a claim changes

1. `claim-review` (or the originating skill) flags the proposed change.
2. Legal Council convenes. #24 VETO applies if the change touches privacy / consent language.
3. Every surface in the "Surfaces" line updates in lockstep (hand off to `writer` / `web-implementation` / `legal-page-draft` / engineering).
4. The old entry is marked `retired (replaced by <new entry> on YYYY-MM-DD)`.
5. A new entry is appended for the updated claim.

No orphan claims. No partial updates.
