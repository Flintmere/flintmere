# regulatory-matrix.md

Regulations that apply to Allowance Guard, organised by jurisdiction × surface × status. This is the map #23 Regulatory counsel + #9 Lawyer use for every compliance review.

Not every column below applies to every surface. The matrix is a prompt for the question "have we considered this?" — not a compliance certification.

## Jurisdictions (scope)

See `jurisdictions.md` for the authoritative scope. Summary:

- **Primary:** England & Wales (UK).
- **Material:** EU (via GDPR + PECR-equivalent national laws), US (via CCPA/CPRA, state-level privacy, potential SEC scrutiny of DeFi-adjacent products).
- **Monitored:** Switzerland, Singapore, Australia (future expansion markets).
- **Excluded:** OFAC-sanctioned jurisdictions (users in scope of US sanctions are not served).

## Regulations by category

### Data protection & privacy

| Regulation | Jurisdiction | Applies because | Status | Surface(s) |
|-----------|--------------|-----------------|--------|-----------|
| UK GDPR + DPA 2018 | UK | Primary operating jurisdiction; we process user email, wallet addresses (arguably personal data in context), IP logs, analytics | **Active compliance** | Privacy policy, DPA, cookie consent, account settings, analytics |
| EU GDPR | EU | We have EU users | **Active compliance** | Same surfaces; cross-border transfer mechanism required (Standard Contractual Clauses / adequacy) |
| PECR (UK) | UK | Cookies + direct marketing | **Active compliance** | Cookie banner, email consent, B2B outreach |
| ePrivacy Directive (EU) | EU | Same as PECR | **Active compliance** | Same surfaces |
| CCPA / CPRA | California | We have California users | **Monitor** — action if we cross user thresholds | Privacy policy mentions CCPA rights; opt-out mechanism |
| Other US state laws (VCDPA, CPA, CTDPA, UCPA) | US states | State-by-state privacy laws as passed | **Monitor** | Privacy policy updates per jurisdiction |
| Swiss FADP | CH | If Swiss users exceed threshold | **Monitor** | — |

### Crypto / digital assets

| Regulation | Jurisdiction | Applies because | Status | Surface(s) |
|-----------|--------------|-----------------|--------|-----------|
| MiCA (EU) | EU | Regulates crypto-asset service providers | **Under review** — we are not a CASP by design (non-custodial security tool), but copy must not suggest otherwise | Marketing copy, legal pages, product description |
| FCA financial promotions (UK) | UK | UK financial promotions regime; crypto promotions restricted | **Monitor** — our copy is security-tooling framed, not investment / trading | Marketing surfaces, ads |
| SEC (US) | US | DeFi-adjacent products scrutinised | **Monitor** — we do not offer any security (legal sense); no tokens; no investment products | Copy review for any investment-adjacent language |
| CFTC (US) | US | Futures / derivatives; unlikely to apply | **Low risk** | — |
| Travel Rule / AMLD (EU, UK) | EU/UK | AML rules for crypto-asset service providers | **Does not apply** — we are not a VASP / CASP / money transmitter | Document the non-applicability in regulatory-matrix annotations |

### Consumer protection

| Regulation | Jurisdiction | Applies because | Status | Surface(s) |
|-----------|--------------|-----------------|--------|-----------|
| Consumer Rights Act 2015 | UK | Subscription services to consumers | **Active compliance** | Terms of service, cancellation flow, refund policy |
| CRD / Distance Selling (EU) | EU | Same | **Active compliance** | Same + 14-day cooling-off period copy |
| Advertising Standards (ASA, UK) | UK | Marketing claims | **Active compliance** | Marketing surfaces — all claims trace to source |
| FTC Section 5 (US) | US | Deceptive trade practices | **Active compliance** | Same |
| ICO guidance on online advertising | UK | Overlaps with ASA + PECR | **Active compliance** | Marketing + ads |

### Accessibility & equality

| Regulation | Jurisdiction | Applies because | Status | Surface(s) |
|-----------|--------------|-----------------|--------|-----------|
| Equality Act 2010 (UK) | UK | Accessibility of digital services | **Active compliance — Noor VETO** | Every UI surface |
| EAA (EU) | EU | European Accessibility Act, in force from June 2025 | **Active compliance** | Every UI surface served to EU users |
| ADA (US) | US | Public accommodations digital accessibility | **Active compliance** | Same |
| WCAG 2.1 AA | all | De facto technical floor | **Active compliance — Noor VETO** | Every UI surface |

### Platform-adjacent

| Regulation / Standard | Jurisdiction | Applies because | Status | Surface(s) |
|-----------------------|--------------|-----------------|--------|-----------|
| PCI DSS | all | We touch payment data (indirectly via Stripe) | **Stripe's scope** — we remain out-of-scope by using Stripe-hosted Checkout; any deviation re-introduces PCI scope | Checkout flow, webhook handler |
| SOC 2 | customer-driven | Enterprise customers may request | **Not pursued** — revisit if enterprise demand justifies the cost | Trust page, sales collateral |

## How this matrix is used

- `claim-review` consults it when a claim has regulatory exposure.
- `security-claim-audit` checks security claims against MiCA / FCA / SEC lenses.
- `policy-alignment` checks ad copy against FCA / ASA / FTC.
- `regulatory-change-response` updates this matrix when new law lands.
- `legal-page-draft` cites the right regulation in every page section.

## When regulation changes

1. `regulatory-change-response` is run.
2. The new regulation gets a row here (with effective date).
3. Gap analysis identifies which surfaces need copy / feature / operational changes.
4. Remediation hands off to the owning skill(s).
5. This file updates with status: **Active compliance**, **In progress**, or **Not applicable — see rationale**.

## What this matrix is not

- Not legal advice. #9 + #23 + #24 are the councils; a retained human lawyer is the authority for any material interpretation.
- Not a compliance certificate. Compliance is a state at a point in time; this matrix is the map that helps us get there.
- Not exhaustive. New regulations appear; new product surfaces introduce new regulatory exposure. Re-read this file against every material product change.

## Standing watch list

Things that could change our posture significantly — monitor via legal news + regulator publications:

- **MiCA secondary legislation** (EU): ESMA guidance on what counts as a CASP could sharpen edges.
- **UK financial promotions regime for crypto**: ongoing FCA guidance.
- **US state-level privacy laws**: more states passing comprehensive privacy laws each year.
- **SEC enforcement in DeFi adjacent space**: case law shapes risk.
- **EU AI Act**: unlikely to apply (we're not an AI system in the Act's sense), but watch for scope creep.
- **OFAC / HM Treasury sanctions lists**: user blocklist implications.
