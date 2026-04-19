# vendor-register.md — Every paid vendor

Single source of truth for vendor relationships. `vendor-review` reads this; `finance-snapshot` reads this for spend lines; `legal-page-draft` reads this when listing sub-processors in DPA / Privacy Policy. Operator alone modifies. New vendors require #36 + #24 (if data processor) + #9 (if contract) sign-off.

## Schema

```
### <vendor name>
- Service: <what they provide>
- Plan: <plan name + tier>
- Monthly cost: <approx GBP / USD>
- Renewal: <monthly / annual / per-use>
- Renewal date: <next>
- Lock-in level: <low / medium / high — see definitions>
- Data processor: <yes / no — if yes, listed in DPA?>
- DPA in place: <yes / no / N-A>
- Sub-processors of vendor: <link to vendor's sub-processor list>
- Alternatives evaluated: <list>
- Last reviewed: <YYYY-MM-DD>
- Notes: <known issues, lock-in risks, contract notes>
```

### Lock-in level definitions

- **Low**: switching cost = days. Standard format data, multiple equivalents in market.
- **Medium**: switching cost = weeks. Data export possible but reformatting needed; some custom integration.
- **High**: switching cost = months. Proprietary data formats, deep integration, customer-facing identifiers tied to vendor.

---

## Hosting + infra

### Vercel
- Service: Next.js hosting + edge + analytics
- Plan: <Pro or Team — operator confirms>
- Monthly cost: ~$20–60 (Pro) baseline + usage
- Renewal: monthly
- Lock-in level: **medium** — Next.js portable; edge functions + analytics integration adds reformatting cost
- Data processor: yes (analytics + edge logs)
- DPA in place: yes (Vercel standard DPA)
- Sub-processors: AWS, Cloudflare (edge), others per Vercel sub-processor page
- Alternatives evaluated: Netlify, Cloudflare Pages, self-hosted Node
- Last reviewed: TBD
- Notes: cookie-less Analytics configuration verified; cache headers fixed in commit 3ea1e13

### Neon (Postgres)
- Service: serverless Postgres
- Plan: <operator confirms>
- Monthly cost: <operator confirms>
- Renewal: monthly
- Lock-in level: **low** — standard Postgres; pg_dump portable
- Data processor: yes (production data)
- DPA in place: yes
- Sub-processors: AWS
- Alternatives evaluated: Supabase, Railway, AWS RDS
- Last reviewed: TBD
- Notes: Drizzle ORM; migrations via `write-migration` skill

### Cloudflare
- Service: DNS + Turnstile (CAPTCHA) + WAF
- Plan: <operator confirms>
- Monthly cost: variable
- Renewal: per-use / monthly base
- Lock-in level: **low** for DNS; **medium** for Turnstile (alternatives need testing)
- Data processor: yes (Turnstile + WAF logs)
- DPA in place: yes (Cloudflare AUP + DPA)
- Sub-processors: Cloudflare's own infra
- Alternatives evaluated: hCaptcha (CAPTCHA), Route 53 (DNS)
- Last reviewed: TBD
- Notes: Turnstile added in docs redesign (commit 86d86ee)

## Payments

### Stripe
- Service: subscriptions, invoicing, customer portal
- Plan: standard
- Monthly cost: per-transaction (~2.9% + $0.30); no monthly base
- Renewal: per-transaction
- Lock-in level: **high** — customer IDs, subscription history, payment methods all live in Stripe
- Data processor: yes (payment data)
- DPA in place: yes (Stripe DPA)
- Sub-processors: per Stripe sub-processor list
- Alternatives evaluated: none (Stripe is incumbent)
- Last reviewed: TBD
- Notes: PCI compliance handled by Stripe; webhook handlers reviewed via `webhook-review`

### Coinbase Commerce — REMOVED
- Removed in commit fc632fc (lockfile regen after coinbase-commerce removal)
- No active integration; entry retained for audit trail
- Future crypto payments would route through `implement-checkout-flow` Payment Sub-council (#30, #31, #4)

## Email + comms

### <email service — operator confirms current>
- Service: transactional + marketing
- Plan: <>
- Monthly cost: <>
- Renewal: monthly
- Lock-in level: low
- Data processor: yes (recipient list)
- DPA in place: yes
- Sub-processors: <>
- Alternatives evaluated: Postmark, Resend, SES, Loops
- Last reviewed: TBD
- Notes: PECR / GDPR compliance for marketing email — only contacts who consented or B2B with proper grounds

## Source control + CI

### GitHub
- Service: git hosting + Actions CI + Issues + Discussions
- Plan: <operator confirms — Free / Pro / Team>
- Monthly cost: <>
- Renewal: monthly
- Lock-in level: **medium** — git itself is portable; Issues / Discussions / Actions configurations need migration
- Data processor: yes (contributor data, Issues content)
- DPA in place: GitHub DPA available
- Sub-processors: Microsoft Azure
- Alternatives evaluated: GitLab, Codeberg, self-hosted Forgejo
- Last reviewed: TBD
- Notes: Open-source program runs here; CONTRIBUTING / CLA owned by `open-source-program-run`

## Analytics + observability

### Vercel Analytics — see Vercel above

### <error monitoring — Sentry / similar; operator confirms current>
- Service: <>
- Plan: <>
- Monthly cost: <>
- Renewal: <>
- Lock-in level: low
- Data processor: yes (error event data)
- DPA in place: yes if used
- Notes: error events must be PII-scrubbed before send

## AI / dev tools

### Anthropic (Claude API + Claude Code)
- Service: Claude API + Claude Code CLI
- Plan: <operator confirms>
- Monthly cost: usage-based
- Renewal: per-use
- Lock-in level: **medium** — model APIs portable but Claude Code skills are Claude-specific
- Data processor: yes (Claude API processes prompt content)
- DPA in place: yes (Anthropic Commercial Terms + DPA)
- Sub-processors: per Anthropic sub-processor list
- Alternatives evaluated: OpenAI, others (developer tooling); the skill framework here is Claude-specific
- Last reviewed: 2026-04-17
- Notes: pilots 1–6 of managed-agent system are Claude Code-native

---

## Vendors evaluated and rejected (audit trail)

_None recorded yet. Add as `vendor-review` produces decline rationales._

## Renewal calendar

See `ops-calendar.md` for renewal date list. `vendor-review` runs ≥30 days before any annual renewal to leave time for negotiation or switch.

## Sub-processor disclosure

The DPA at `src/app/dpa/**` lists sub-processors. Adding a vendor that processes user data requires:
1. Vendor entry here.
2. `legal-page-draft` updates DPA.
3. `legal-page-draft` updates Privacy Policy if a new category of processing.
4. #24 sign-off.
5. User notification per DPA terms (typically 30 days for material changes).

## Maintenance

- Operator updates this register on every vendor change.
- `vendor-review` proposes updates; operator commits.
- Quarterly full sweep by `vendor-review`.
- Annual contract review by #9 + #36.
