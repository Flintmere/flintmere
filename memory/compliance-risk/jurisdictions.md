# jurisdictions.md

Where Flintmere operates and which law governs which surface.

## Primary

**England & Wales (UK).** The operating entity, the contracting entity, the governing law for Terms of Service and DPA. UK GDPR + DPA 2018 + PECR apply by default.

## Material presence

Users (merchants + scanner leads) in these jurisdictions are material to traffic and regulatory exposure:

- **European Union.** EU GDPR + ePrivacy Directive (as implemented nationally). Cross-border transfer mechanisms (Standard Contractual Clauses) in place for UK → EU and EU → UK data flows. Merchants can exercise GDPR rights against the UK operating entity. Many Shopify Plus merchants sit here.
- **United States.** CCPA / CPRA for California merchants; other state-level privacy laws as applicable (VCDPA, CPA, CTDPA, UCPA); FTC Section 5 on deceptive practices for marketing claims. SEC scrutiny is **not in scope** for Flintmere — we are not a securities-adjacent product.
- **Canada, Australia, Singapore** — merchants present on Shopify but below material thresholds for bespoke legal treatment; monitored.

## Excluded

**OFAC-sanctioned jurisdictions** (US sanctions, HM Treasury sanctions). Users in scope of US or UK sanctions are not served. Includes (at time of writing) Cuba, Iran, North Korea, Syria, Crimea / specified regions of Ukraine, and other designated areas. List changes; source authoritatively from OFAC SDN list + HM Treasury consolidated list.

**Our operational position:** we do not knowingly onboard or serve merchants in sanctioned jurisdictions. Shopify itself screens at store-creation time; Stripe screens at payment time (for Agency + Enterprise direct invoicing); Flintmere inherits these protections rather than running an independent AML scheme.

## Per-surface governing law

| Surface | Contract / governing framework | Jurisdiction |
|---|---|---|
| Terms of Service | Contract under UK law | England & Wales — disputes in English courts |
| Privacy Policy | UK GDPR statement + EU GDPR treatment | UK (primary) + EU (material) |
| Data Processing Agreement | UK GDPR Art. 28 | UK primary; EU Standard Contractual Clauses where applicable |
| Cookie Policy | PECR + ePrivacy Directive | UK (primary) + EU |
| Shopify Partner Agreement | Shopify's own Partner Program Agreement (Shopify governs) | Ontario, Canada (Shopify's HQ jurisdiction) |
| Marketing claims | UK: ASA; EU: national consumer protection; US: FTC Section 5 | Per jurisdiction of the viewer |
| Refund / cancellation | Consumer Rights Act 2015 (UK) + CRD (EU) + applicable US state law | Per jurisdiction of merchant |
| Accessibility | Equality Act 2010 (UK), EAA (EU, in force June 2025), ADA (US) — WCAG 2.1 AA as the technical floor | Global |
| GTIN guidance | GS1 terms (reference only — we do not sign a GS1 contract as Flintmere) | Per merchant |

## Data residency

- **Operational data** (shops, scoring, fixes, leads) — Postgres on Coolify/DigitalOcean droplet. Region: **LON1 (London)** pinned by default; failover region **AMS3 (Amsterdam)** if droplet upsize requires migration.
- **LLM inference** — Google Vertex AI `europe-west1` (Belgium) + `europe-west4` (Netherlands) failover. Azure OpenAI `swedencentral` or `francecentral` for fallback.
- **Backups** — DO Spaces, region pinned to match primary droplet (LON1).
- **Logs + error tracking** — Sentry EU region; PostHog self-hosted on droplet.
- **Cross-border transfers** — UK → EU covered by UK's adequacy decision for EEA. UK → US (for Azure, Stripe, Resend, Sentry) via SCCs + supplementary measures or each vendor's own adequacy posture.

## Data minimisation — Flintmere specific

- We do not store merchant customer data except when forwarded to us via Shopify's GDPR webhooks (`customers/data_request`, `customers/redact`) — those are processed and logged, not retained beyond the 30-day legal window.
- We do not store Shopify end-buyer browsing or purchase data.
- We do store merchant operator email + Shopify store domain + encrypted access token. That's it on the personal-data side.
- Aggregated / anonymised product catalog data may be retained for research (e.g., "State of AI Readiness in Beauty" report); personal data is stripped before aggregation.

## User rights by jurisdiction

All merchant + lead rights flow through a single user-rights pipeline. We operate the strongest union of rights available, applied to every user regardless of jurisdiction.

- **Access** — any merchant or lead can request their data (CSV export of shop + scoring + fix history; for leads, just their scanner submission + email consent state).
- **Rectification** — any merchant can correct inaccurate data held about their shop.
- **Erasure** — any merchant can uninstall → 60s token scrub + 30-day full data purge. Any lead can unsubscribe → immediate cessation of processing + 30-day data deletion.
- **Portability** — CSV export of shop scoring + fix history.
- **Objection / restriction** — available for processing based on legitimate interest.
- **Opt-out of sale / share (CCPA/CPRA)** — we do not sell or share personal data in the CCPA sense, but the opt-out link is present on the Privacy Policy.
- **Opt-out of targeted ads** — applied across all users regardless of jurisdiction. Flintmere does not run targeted advertising against its users.

## Sanctions screening

- **Shopify-level** — Shopify screens stores at creation. We inherit this.
- **Stripe-level** — Stripe Radar + OFAC lists screen at checkout for Agency + Enterprise direct invoicing.
- **We do not** run an AML scheme. Flintmere is not a VASP / CASP / money transmitter / financial service. Sanctions screening is a commercial-terms measure, not a regulatory AML obligation.

## When jurisdictional scope changes

Triggers:

- Material merchant base emerges in a new jurisdiction (threshold: >5% of MRR or >100 merchants in a single new jurisdiction).
- A regulator issues guidance that changes our exposure.
- A regulation comes into force in a jurisdiction where we operate.
- We open a business entity in a new jurisdiction.
- A Shopify Partner Agreement update changes our merchant obligations.

Response:

1. `regulatory-change-response` runs on the new jurisdiction.
2. `regulatory-matrix.md` updates.
3. Legal pages update (via `legal-page-draft`) if required copy changes.
4. Merchant communication where material.

## Record of material events

<!-- Append as events occur. Examples of what gets recorded: a CCPA threshold crossed, an EU AEPD fine in our sector setting relevant precedent, a new UK ICO opinion on Shopify-app data handling, new Shopify Partner Agreement terms, etc. -->

No entries yet. Backfill as `regulatory-change-response` runs and material events surface.

## Changelog

- 2026-04-19: Rewritten for Flintmere. Removed SEC/DeFi-adjacent concerns (Flintmere is not crypto-adjacent). Added Shopify Partner Agreement jurisdiction, Flintmere data residency (Coolify LON1, Vertex AI EU), Flintmere-specific data minimisation notes.
