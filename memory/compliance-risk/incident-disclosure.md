# incident-disclosure.md

Playbook for regulatory + user disclosure after a security or privacy incident. Engineering's `debug-prod-incident` handles the technical investigation; this file handles the **legal + user communication** workflow once an incident is confirmed.

Owned by **#24 Data protection (veto)** on user-facing language, with **#23 Regulatory** (filing) and **#9 Lawyer** (advice).

## Scope — when this playbook fires

- A personal data breach under UK GDPR / EU GDPR: "a breach of security leading to accidental or unlawful destruction, loss, alteration, unauthorised disclosure of, or access to, personal data."
- A security incident affecting user trust even if not legally a "breach" (credential stuffing against Flintmere auth, Shopify access-token exposure, mass scanner abuse that exposes catalog patterns, agency-seat misuse across client stores).
- A downstream incident at a processor (Google Cloud / Vertex AI, Azure OpenAI, Shopify, Stripe, Coolify, DigitalOcean, Resend, Sentry) that affects our merchants.
- A Shopify merchant catalog data leak via any channel.

Not in scope: pure availability outages with no data implication (engineering-only, tracked in `incident-history.md`).

## Decision tree — disclose?

### 1. Is personal data involved?

- **Yes** → continue. Likely a GDPR-triggering event.
- **No** → engineering-only + internal post-mortem. Log here for completeness; no regulatory filing.

Note: for Flintmere, "personal data" includes merchant operator email addresses, scanner lead emails, Shopify account identifiers linked to merchant-facing accounts. **Shopify catalog data itself is merchant commercial data, not personal data, but if it contains customer-level info (unlikely on product catalogs but possible in customer-data-request webhooks), that IS personal data.**

### 2. Is it likely to result in a risk to individuals' rights and freedoms?

- **Yes** → supervisory authority notification required.
- **No** → document the rationale; retain records; consider user communication for trust reasons.

### 3. Is it likely to result in a **high risk** to individuals?

- **Yes** → direct user notification required.
- **No** → supervisory authority notification only, unless we choose to notify users for trust.

### 4. Additionally — Shopify partner obligations

Shopify's Partner Program Agreement requires notification of security incidents affecting merchant data. This runs **in parallel** to GDPR notification and has its own timeline (typically "without undue delay"). Notify via the Partner Dashboard security-incident form.

## Timelines (UK GDPR / EU GDPR)

- **72 hours** from becoming aware of the breach → notify the ICO (UK) / relevant supervisory authority (EU).
- **Without undue delay** for high-risk breaches → notify affected users / merchants.
- **Immediately upon discovery** → internal escalation, containment, evidence preservation.
- **Without undue delay** → notify Shopify Partner team if merchant data is implicated.

Missing the 72-hour window requires a documented reason for the delay. "We were still investigating" is acceptable; "we didn't know we had to" is not.

## Notification content (ICO / supervisory authority)

Required by UK GDPR Art. 33(3):

1. Nature of the breach — categories + approximate number of data subjects + records.
2. Name + contact of the data protection contact (listed in Privacy Policy and `SECURITY.md`).
3. Likely consequences.
4. Measures taken or proposed to address the breach + mitigate adverse effects.

Template filings live in this file's appendix (fill when the first event occurs; do not fabricate an event to seed the template).

## Notification content (merchants + users)

Required by UK GDPR Art. 34 when high-risk:

1. Plain-language description of the breach.
2. Likely consequences.
3. Measures taken or proposed.
4. Contact point for further information.
5. What the recipient can do to protect themselves (rotate Shopify app credentials, revoke and re-install the app, change passwords, etc.).

**#24 owns the user-facing language.** Plain, not promissory, not minimising, not panicky. "Your encrypted Shopify access token was read by an unauthorised party between X and Y" — not "we experienced a security event."

### Flintmere-specific merchant disclosure

Merchant operators are our primary audience for disclosure in most incidents (they own the Shopify store). Send via:

- **Transactional email** (Resend, templated) — mandatory for GDPR Art. 34 high-risk.
- **In-app banner** on `app.flintmere.com` until acknowledged by the operator.
- **Status page** entry at `status.flintmere.com` (to be stood up before public launch).

For incidents affecting scanner leads who never installed the app: transactional email to the address on file; if undeliverable, website notice.

## What we never do in disclosure

- Attribute blame externally without evidence ("a sophisticated state actor").
- Minimise ("no significant impact is expected") unless that is demonstrably true.
- Claim total resolution before it is true.
- Promise to prevent any recurrence — we can promise to investigate and strengthen.
- Disclose merchant identities to each other.
- Apologise in a way that implies liability without #9 + #24 sign-off.

## Processor-caused incidents

When a processor has an incident that affects our merchants:

1. Confirm with the processor — get their incident report.
2. Assess whether it triggers our notification obligations (usually yes if personal data is involved).
3. We remain the data controller; the processor is the processor. **Our notification duty survives** — we cannot delegate it to the processor.
4. Coordinate messaging with the processor; do not contradict their public timeline without evidence.

Known processors and their incident channels:

- **Shopify** — Partner Dashboard + Status page
- **Google Cloud / Vertex AI** — Cloud Status page + account team
- **Azure OpenAI** — Service Health + support ticket
- **Stripe** — Status page + account manager
- **Coolify / DigitalOcean** — Cloud Status + support ticket
- **Resend, Sentry, Cloudflare** — their status pages

## Incident timeline template

```
## YYYY-MM-DD — <short incident name>

- **Detected:** <ISO timestamp + source of detection>
- **Contained:** <ISO timestamp + action taken>
- **Investigation completed:** <ISO timestamp>
- **Classification:** personal data breach (GDPR) | security incident (non-breach) | processor-caused | Shopify Partner-reportable
- **Scope:** <categories of personal data + approximate records + users + merchants affected>
- **Likely consequences:** <to individuals + to merchants>
- **Supervisory authority notification:** filed <ISO timestamp> / not required because <reason>
- **User/merchant notification:** sent <ISO timestamp> to <audience> / not required because <reason>
- **Shopify Partner notification:** filed <ISO timestamp> / N/A
- **Root cause (link to incident-history.md entry):** <path>
- **Remedial actions:** <link to follow-up tickets / commits>
- **Lessons to bank (candidates for standing rules):** <>
```

## Roles during an incident

- **#24 Data protection lawyer** — owns the notification decision + user-facing language. VETO on any communication.
- **#23 Regulatory counsel** — owns the filing + any engagement with the ICO.
- **#9 Lawyer / compliance** — general advice; contract implications; insurance notification.
- **#4 Security engineer** — owns the technical facts; leads investigation alongside #34.
- **#34 Full-stack debugging engineer** — owns the timeline + root cause.
- **#10 DevOps / SRE** — owns the containment + infrastructure remediation.
- **#1 Editor-in-chief / technical writer** — supports #24 on the user-facing language.

## What happens before an incident

- Contact details for ICO kept current.
- Data protection contact listed in Privacy Policy + `SECURITY.md`.
- Processor contacts + their incident playbooks known in advance (see list above).
- Legal + PR + merchant-comms templates in this file, ready to adapt.
- Tabletop exercise scheduled annually — admin-ops owns the cadence.

## What happens after an incident

- Post-mortem with #34 + #4 + #24 + #23 + #9.
- `memory/product-engineering/incident-history.md` gets the technical entry.
- This file gets the disclosure-timeline entry.
- `claims-register.md` updated if any public security claim is now misleading.
- `regulatory-matrix.md` updated if the incident changes our posture.
- Rules promoted: anything worth banking as a standing rule moves to department `MEMORY.md` or `security-posture.md`.

## Hard reminders

- We are the data controller. The buck stops here.
- We disclose; we do not spin.
- Apology does not equal liability, but must be authorised by #9 + #24 before public.
- Never announce a fix before it is in place.
- Every disclosure record retained minimum 3 years.

## Log (append as events occur)

<!-- No events logged yet. Entries here are disclosure records, not technical post-mortems. The technical record lives at `memory/product-engineering/incident-history.md`. -->

## Changelog

- 2026-04-19: Rewritten for Flintmere. Added Shopify Partner notification obligation, Flintmere-specific processor list (Shopify, Google Cloud, Azure, Coolify replacing Neon/Vercel), Flintmere merchant disclosure channels.
