# jurisdictions.md

Where Allowance Guard operates and which law governs which surface.

## Primary

**England & Wales (UK).** The operating entity, the contracting entity, the governing law for Terms of Service and DPA. UK GDPR + DPA 2018 + PECR apply by default.

## Material presence

Users in these jurisdictions are material to traffic and / or regulatory exposure:

- **European Union.** EU GDPR + ePrivacy Directive (as implemented nationally). Cross-border transfer mechanisms (Standard Contractual Clauses) in place for UK → EU and EU → UK data flows. Users can exercise GDPR rights against the UK operating entity.
- **United States.** CCPA / CPRA for California users; other state-level privacy laws as applicable; FTC Section 5 on deceptive practices; SEC scrutiny of crypto-adjacent products; OFAC sanctions compliance.
- **Switzerland, Singapore, Australia** — users present but below material thresholds for bespoke legal treatment; monitored.

## Excluded

**OFAC-sanctioned jurisdictions.** Users in scope of US sanctions are not served — includes (at the time of writing) Cuba, Iran, North Korea, Syria, the Crimea region of Ukraine, and other designated areas. List changes; source authoritatively from the OFAC SDN list + country sanctions programs.

**HM Treasury sanctions.** UK sanctions apply similarly.

**Our operational position:** we do not knowingly onboard or serve users in sanctioned jurisdictions. Detection is geo-signal-based (IP, payment location). Not foolproof; this is not an AML scheme, and AG does not operate as a VASP.

## Per-surface governing law

| Surface | Contract / governing framework | Jurisdiction |
|---------|-------------------------------|--------------|
| Terms of Service | Contract under UK law | England & Wales — disputes in English courts |
| Privacy Policy | UK GDPR statement + EU GDPR treatment | UK (primary) + EU (material) |
| Data Processing Agreement | UK GDPR Art. 28 | UK primary; EU Standard Contractual Clauses where applicable |
| Cookie Policy | PECR + ePrivacy Directive | UK (primary) + EU |
| Marketing claims | UK: ASA; EU: national consumer protection; US: FTC Section 5 | Per jurisdiction of the viewer |
| Refund / cancellation | Consumer Rights Act 2015 (UK) + CRD (EU) + applicable US state law | Per jurisdiction of purchaser |
| Accessibility | Equality Act 2010 (UK), EAA (EU), ADA (US) — WCAG 2.1 AA as the technical floor | Global |

## Data residency

- **Operational data** (subscription state, user email, auth) — Neon Postgres; region(s) documented in `projects/allowanceguard/ARCHITECTURE.md`. Verify in-repo.
- **Logs + analytics** — Vercel + any observability vendors; verify region configuration.
- **Cross-border transfers** — UK → EU covered by UK's adequacy decision for EEA. UK → US via SCCs + supplementary measures or equivalent mechanism.
- **User data minimisation** — we do not process wallet addresses alongside personal behaviour data as a deliberate privacy stance. See `memory/marketing/analytics` skill and `memory/product-engineering/security-posture.md`.

## User rights by jurisdiction

All user rights below flow through the single user-rights pipeline. We do not operate different pipelines per jurisdiction — we operate the strongest union of rights available, applied to every user.

- **Access:** every user can request their data.
- **Rectification:** every user can correct inaccuracies.
- **Erasure:** every user can delete their account + request data deletion.
- **Portability:** CSV export of subscription + scan history.
- **Objection / restriction:** available for processing based on legitimate interest.
- **Opt-out of targeted ads:** applied across all users regardless of jurisdiction.
- **Opt-out of sale / share (CCPA/CPRA):** we do not sell or share personal data in the CCPA sense — but the opt-out link is present.

## Sanctions screening

- Payment-level: Stripe handles sanctions screening at checkout (Stripe Radar + OFAC lists).
- Login-level: geographic signals used for high-risk jurisdictions; operational not absolute.
- Never: AG does not run an AML scheme (we are not a VASP / CASP / money transmitter). Sanctions screening is a commercial-terms measure, not a regulatory AML obligation.

## When jurisdictional scope changes

Triggers:
- Material user base emerges in a new jurisdiction.
- A regulator issues guidance that changes our exposure.
- A regulation comes into force in a jurisdiction where we operate.
- We open a business entity in a new jurisdiction.

Response:
1. `regulatory-change-response` runs on the new jurisdiction.
2. `regulatory-matrix.md` updates.
3. Legal pages update (via `legal-page-draft`) if required copy changes.
4. User communication where material.

## Record of material events

<!-- Append as events occur. Examples of what gets recorded here: a CCPA threshold crossed, an EU AEPD fine in our sector setting relevant precedent, a new UK ICO opinion, etc. -->

No entries yet under this department structure. Backfill as `regulatory-change-response` runs and material events surface.
