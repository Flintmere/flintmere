# incident-disclosure.md

Playbook for regulatory + user disclosure after a security or privacy incident. Engineering's `debug-prod-incident` handles the technical investigation; this file handles the **legal + user communication** workflow once an incident is confirmed.

Owned by #24 Data protection (VETO on user-facing language), with #23 Regulatory (filing) and #9 Lawyer (advice).

## Scope: when this playbook fires

- A personal data breach under UK GDPR / EU GDPR: "a breach of security leading to the accidental or unlawful destruction, loss, alteration, unauthorised disclosure of, or access to, personal data."
- A security incident affecting user trust even if not legally a "breach" (e.g., credential stuffing against our login, mass scanner abuse that exposes patterns).
- A downstream incident at a processor (Stripe, Neon, Vercel, Cloudflare) that affects our users.

Not in scope: pure availability outages with no data implication (those are engineering-only).

## Decision tree — disclose?

### 1. Is personal data involved?

- **Yes** — continue. This is likely a GDPR-triggering event.
- **No** — engineering-only + internal post-mortem. Log it here for completeness; no regulatory filing.

### 2. Is it likely to result in a risk to individuals' rights and freedoms?

- **Yes** — supervisory authority notification required.
- **No** — document the rationale; retain records; consider user communication for trust reasons.

### 3. Is it likely to result in a **high risk** to individuals?

- **Yes** — direct user notification required.
- **No** — supervisory authority notification only, unless we choose to notify users for trust.

## Timelines (UK GDPR / EU GDPR)

- **72 hours** from becoming aware of the breach: notify the ICO (UK) / relevant supervisory authority (EU).
- **Without undue delay** for high-risk breaches: notify affected users.
- **Immediately upon discovery:** internal escalation, containment, evidence preservation.

Missing the 72-hour window requires a documented reason for the delay. "We were still investigating" is acceptable; "we didn't know we had to" is not.

## Notification content (ICO / supervisory authority)

Required by UK GDPR Art. 33(3):

1. Nature of the breach — categories + approximate number of data subjects + records.
2. Name + contact of the data protection contact (we have one listed in the Privacy Policy).
3. Likely consequences.
4. Measures taken / proposed to address the breach + mitigate adverse effects.

Template filings live in this file's appendix (fill when the first event occurs; do not fabricate an event to seed the template).

## Notification content (users)

Required by UK GDPR Art. 34 when high-risk:

1. Plain-language description of the breach.
2. Likely consequences.
3. Measures taken or proposed.
4. Contact point for further information.
5. What the user can do to protect themselves.

**#24 owns the user-facing language.** It must be plain, not-promissory, not-minimising, not-panicky. "Your account data was accessed by an unauthorised party between X and Y" — not "we experienced a security event".

## What we never do in disclosure

- Attribute blame externally without evidence ("a sophisticated state actor").
- Minimise ("no significant impact is expected") unless that is demonstrably true.
- Claim total resolution before it is true.
- Promise to prevent any recurrence — we can promise to investigate and strengthen.
- Disclose user identities to each other.

## Processor-caused incidents

When a processor (Stripe, Neon, Vercel, Cloudflare) has an incident that affects our users:

1. Confirm with the processor — get their incident report.
2. Assess whether it triggers our notification obligations (usually yes if personal data is involved).
3. We remain the data controller; the processor is the processor. **Our** notification duty survives — we cannot delegate it.
4. Coordinate messaging with the processor; do not contradict their public timeline without evidence.

## Incident timeline template

```
## YYYY-MM-DD — <short incident name>

- **Detected:** <ISO timestamp + source of detection>
- **Contained:** <ISO timestamp + action taken>
- **Investigation completed:** <ISO timestamp>
- **Classification:** personal data breach (GDPR) | security incident (non-breach) | processor-caused
- **Scope:** <categories of personal data + approximate records + users>
- **Likely consequences:** <to individuals>
- **Supervisory authority notification:** filed <ISO timestamp> / not required because <reason>
- **User notification:** sent <ISO timestamp> to <audience> / not required because <reason>
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
- **#10 DevOps / SRE** — owns the containment + any infrastructure remediation.
- **#1 Editor-in-chief / technical writer** — supports #24 on the user-facing language. Plain-language discipline.

## What happens before an incident

- Contact details for supervisory authority (ICO) kept current.
- Data protection contact listed in Privacy Policy + SECURITY.md (create if missing).
- Processor contacts + their incident playbooks known in advance.
- Legal + PR + user-comms template in this file, ready to adapt.
- This playbook tested via tabletop exercise — scheduled by admin-ops when that department ships.

## What happens after an incident

- Post-mortem + retro with #34 + #4 + #24 + #23 + #9.
- `incident-history.md` (engineering) gets the technical entry.
- This file gets the disclosure-timeline entry.
- `claims-register.md` updated if any public security claim is now misleading in light of the incident.
- `regulatory-matrix.md` updated if the incident changes our regulatory posture.
- Rules promoted: anything worth banking as a standing rule moves to `MEMORY.md` of this department or to engineering's `security-posture.md`.

## Hard reminders

- We are the data controller. The buck stops here.
- We disclose; we do not spin.
- Apology does not equal liability, but must be authorised by #9 + #24 before public.
- Never announce a fix before it is in place.
- Every disclosure record is retained for a minimum of 3 years.

## Log (append as events occur)

<!-- No events logged yet under this department structure. Entries here are disclosure records, not technical post-mortems. The technical record lives at `memory/product-engineering/incident-history.md`. -->
