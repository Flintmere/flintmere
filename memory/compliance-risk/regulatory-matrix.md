# regulatory-matrix.md

Regulations that apply to Flintmere, organised by jurisdiction × surface × status. This is the map **#23 Regulatory counsel + #9 Lawyer** use for every compliance review.

The matrix is a prompt for the question "have we considered this?" — not a compliance certification.

## Jurisdictions (scope)

See `jurisdictions.md` for the authoritative scope. Summary:

- **Primary:** England & Wales (UK).
- **Material:** EU (via GDPR + PECR-equivalent national laws), US (via CCPA/CPRA + state-level privacy).
- **Monitored:** Canada, Australia, Singapore.
- **Excluded:** OFAC-sanctioned jurisdictions.

## Regulations by category

### Data protection & privacy

| Regulation | Jurisdiction | Applies because | Status | Surface(s) |
|---|---|---|---|---|
| UK GDPR + DPA 2018 | UK | Primary operating jurisdiction; we process merchant emails, Shopify access tokens, IP logs, analytics | **Active compliance** | Privacy Policy, DPA, cookie consent, account settings, analytics |
| EU GDPR | EU | Material EU merchant base | **Active compliance** | Same surfaces; SCCs for cross-border transfer |
| PECR (UK) | UK | Cookies + direct marketing | **Active compliance** | Cookie banner, email consent, B2B outreach |
| ePrivacy Directive (EU) | EU | Equivalent to PECR across EU | **Active compliance** | Same surfaces |
| CCPA / CPRA | California | California merchants among scanner leads / app installs | **Monitor** — action when user count material | Privacy Policy mentions CCPA rights; opt-out mechanism |
| Other US state laws (VCDPA, CPA, CTDPA, UCPA) | US states | State-by-state privacy laws as passed | **Monitor** | Privacy Policy updates per jurisdiction |
| Swiss FADP | Switzerland | If Swiss users cross threshold | **Monitor** | — |
| Canada PIPEDA | Canada | Canadian merchants (notable given Shopify is Canadian) | **Monitor** | — |

### Platform + commerce

| Regulation / Standard | Jurisdiction | Applies because | Status | Surface(s) |
|---|---|---|---|---|
| Shopify Partner Program Agreement | Ontario, Canada | Our commercial relationship with Shopify | **Active compliance** | App Store listing, GDPR webhooks, merchant data handling, revenue share |
| Shopify Built-for-Shopify requirements | Ontario, Canada | Certification for trust + reduced review cycles | **Target state** — required before Built-for-Shopify badge application (month 6+ per SPEC) | Every app surface |
| UCP / ACP (Agentic Commerce Protocols) | Global | Standards Flintmere aligns merchant catalogs to | **Not a regulator** — standards bodies; referenced for accuracy in copy | Marketing, scanner results, email reports |

### Consumer protection

| Regulation | Jurisdiction | Applies because | Status | Surface(s) |
|---|---|---|---|---|
| Consumer Rights Act 2015 | UK | Subscription services to consumers (merchant operators may be sole traders / consumers) | **Active compliance** | Terms of Service, cancellation flow, refund policy |
| CRD / Distance Selling (EU) | EU | Same | **Active compliance** | Same + 14-day cooling-off period where applicable |
| Advertising Standards (ASA, UK) | UK | Marketing claims | **Active compliance** | Marketing surfaces — every claim traces to `claims-register.md` |
| FTC Section 5 (US) | US | Deceptive trade practices | **Active compliance** | Same |
| ICO guidance on online advertising | UK | Overlaps with ASA + PECR | **Active compliance** | Marketing + any future ads |
| UK Online Safety Act | UK | Unlikely to apply to a B2B SaaS | **Low risk — monitor** | — |

### AI-specific

| Regulation | Jurisdiction | Applies because | Status | Surface(s) |
|---|---|---|---|---|
| EU AI Act | EU | We use LLMs (Gemini, GPT-4o-mini) for content generation | **Monitor — low direct impact** — Flintmere's LLM use is not a "high-risk" AI system under the Act. Watch for scope creep. | LLM integration points; possible transparency disclosures |
| UK AI regulatory framework | UK | UK is regulator-through-regulators (no single AI Act); sectoral approach | **Monitor** | Same |
| US Executive Orders on AI | US | Federal guidance on AI safety | **Monitor** | — |
| Provider DPAs (Google, Azure) | Global | Our LLM providers' terms | **Active compliance** | LLM calls, data processing |

### Accessibility & equality

| Regulation | Jurisdiction | Applies because | Status | Surface(s) |
|---|---|---|---|---|
| Equality Act 2010 | UK | Accessibility of digital services | **Active compliance — Noor VETO** | Every UI surface |
| EAA (EU) | EU | European Accessibility Act, in force June 2025 | **Active compliance** | Every UI surface served to EU users |
| ADA (US) | US | Public accommodations digital accessibility | **Active compliance** | Same |
| WCAG 2.1 AA | all | De facto technical floor | **Active compliance — Noor VETO** | Every UI surface |

### Payment + tax

| Regulation / Standard | Jurisdiction | Applies because | Status | Surface(s) |
|---|---|---|---|---|
| PCI DSS | all | We touch payment data indirectly via Stripe + Shopify Managed Pricing | **Stripe / Shopify's scope** — we use hosted Checkout + Managed Pricing to stay out of PCI scope | Checkout flow, webhook handlers |
| UK VAT | UK | We sell subscriptions | **Active compliance** — VAT registration + HMRC filings via accountancy | Invoicing, pricing page |
| EU VAT (VAT MOSS / OSS) | EU | EU merchants on our subscription | **Active compliance** — OSS registration for digital services | Invoicing |
| US sales tax | US | State-by-state for digital services | **Monitor** — nexus rules depend on revenue per state; re-evaluate at scale | — |
| SOC 2 | customer-driven | Enterprise merchants may request | **Not pursued — revisit** when enterprise demand justifies the cost (~first 3 Enterprise deals) | Trust page, sales collateral |

## How this matrix is used

- `claim-review` consults when a claim has regulatory exposure.
- `security-claim-audit` checks security claims against the AI + data-protection lenses.
- `policy-alignment` checks ad copy against FCA / ASA / FTC.
- `regulatory-change-response` updates this matrix when new law lands.
- `legal-page-draft` cites the right regulation in every page section.

## When regulation changes

1. `regulatory-change-response` is run.
2. The new regulation gets a row here (with effective date).
3. Gap analysis identifies which surfaces need copy / feature / operational changes.
4. Remediation hands off to the owning skill(s).
5. This file updates with status.

## What this matrix is not

- Not legal advice. #9 + #23 + #24 are the councils; a retained human lawyer is the authority for any material interpretation.
- Not a compliance certificate. Compliance is a state at a point in time; this matrix is the map.
- Not exhaustive. New regulations appear; new product surfaces introduce new exposure. Re-read against every material product change.

## Standing watch list

Things that could change our posture significantly — monitor via legal news + regulator publications:

- **EU AI Act secondary legislation**: ESMA / commission guidance on what constitutes a high-risk AI system.
- **UK financial promotions regime**: not currently applicable to Flintmere, but monitor if Flintmere ever touches payment recommendation flows.
- **US state-level privacy laws**: more states passing comprehensive privacy laws each year.
- **Shopify Partner Agreement updates**: Shopify's terms change; affects revenue share, obligations.
- **Built-for-Shopify requirements changes**: Shopify tightens certification over time.
- **OFAC / HM Treasury sanctions lists**: merchant blocklist implications.
- **GDPR enforcement trends in Shopify-app space**: ICO / EU supervisory authority fines in similar businesses set precedent.

## Changelog

- 2026-04-19: Rewritten for Flintmere. Removed Web3-specific regulations (MiCA, FCA crypto promotions, SEC / DeFi, Travel Rule, AMLD). Added Shopify Partner Agreement, Built-for-Shopify requirements, UCP / ACP standards, EU AI Act, VAT MOSS / OSS.
