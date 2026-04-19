# ops-calendar.md — Recurring deadlines

Single calendar of recurring deadlines that must not slip. `internal-coordination-brief` reads this every Monday; `vendor-review` reads it for renewal windows; `finance-snapshot` reads it for the watchlist.

The operator owns this file. Skills propose additions; the operator commits.

## Schema

```
### <event name>
- Type: <vendor renewal | grant deadline | regulatory filing | tax filing | audit | review cadence | calendar standing>
- Cadence: <annual | quarterly | monthly | weekly | one-off>
- Next occurrence: <YYYY-MM-DD>
- Lead time required: <days before — start preparation by>
- Owner: <operator + council #>
- Owning skill (if applicable): <vendor-review | grant-application | legal-page-draft | …>
- Source of truth: <vendor register, grant page, regulator publication>
- Notes: <>
```

---

## Vendor renewals

(Populated from `vendor-register.md`. The operator updates this section on every vendor onboarding / renewal.)

### Vercel renewal
- Type: vendor renewal
- Cadence: monthly
- Next occurrence: rolling
- Lead time: N/A (auto-renew); annual review at month 11
- Owner: operator + #36
- Owning skill: `vendor-review` (annual)
- Source of truth: `vendor-register.md`
- Notes: low lead time risk; quarterly cost trend in `finance-snapshot`

### Stripe — usage-based
- Type: vendor renewal
- Cadence: per-transaction
- Next occurrence: N/A
- Owner: operator
- Notes: no renewal date; review on `vendor-review` cadence

### GitHub plan
- Type: vendor renewal
- Cadence: <monthly | annual — operator confirms>
- Next occurrence: <>
- Owner: operator + #2 + #36
- Owning skill: `vendor-review`
- Notes: open-source program may justify a tier change

### <email service>
- Type: vendor renewal
- Cadence: monthly
- Next occurrence: rolling
- Owner: operator + #36
- Notes: PECR / GDPR consent records reviewed as part of vendor review

### Anthropic (Claude API + Claude Code)
- Type: vendor renewal
- Cadence: per-use; account review
- Next occurrence: N/A
- Owner: operator + #36
- Notes: usage trend in `finance-snapshot`

(More vendors as `vendor-register.md` grows.)

---

## Grant deadlines

(Populated by `grant-application` skill on a per-programme basis. Cross-referenced with `memory/growth/grants-history.md` and `memory/growth/ecosystems.md`.)

### <Programme name> — <round>
- Type: grant deadline
- Cadence: <annual / quarterly / rolling>
- Next occurrence: <YYYY-MM-DD>
- Lead time: 14–28 days for a serious application
- Owner: operator + #12 + #36
- Owning skill: `grant-application`
- Source of truth: programme page (cited in `memory/growth/ecosystems.md`)
- Notes: <>

(Operator + `grant-application` skill populate as rounds are identified.)

---

## Regulatory + legal

### UK GDPR — DSAR response
- Type: regulatory filing (per-request)
- Cadence: per-request
- Next occurrence: when received
- Lead time: 1 month from receipt
- Owner: operator + #24 + #19
- Owning skill: `support-triage` (categorises) → operator handles
- Source of truth: ICO guidance (UK GDPR Article 12)
- Notes: time-sensitive flag in support-triage

### Annual privacy policy review
- Type: review cadence
- Cadence: annual
- Next occurrence: <set when last reviewed>
- Lead time: 30 days for review + redraft
- Owner: #24 + #19 + operator
- Owning skill: `legal-page-draft` (Level 1)
- Source of truth: `src/app/privacy/**` last-reviewed date
- Notes: also triggered ad-hoc by `regulatory-change-response`

### Cookie consent review
- Type: review cadence
- Cadence: annual + on analytics vendor change
- Next occurrence: <>
- Owner: #24 + #36
- Notes: cross-check with `vendor-register.md` analytics entries

### Tax filings
- Type: tax filing
- Cadence: <per jurisdiction>
- Next occurrence: <>
- Lead time: 60 days
- Owner: operator + #9
- Notes: scope = where AG is established; cross-jurisdiction implications via #23

### Sub-processor list update
- Type: regulatory filing (DPA-driven)
- Cadence: ad-hoc on vendor change
- Next occurrence: per change
- Lead time: 30 days notification typical
- Owner: #24 + #36
- Owning skill: `legal-page-draft` (Level 1)

---

## Internal review cadences

### Quarterly KPI review
- Type: review cadence
- Cadence: quarterly
- Owner: #35 + operator
- Owning skill: `weekly-metrics-brief` (rolled up by operator) + `cohort-retention`

### Quarterly vendor review
- Type: review cadence
- Cadence: quarterly
- Owner: #36 + operator
- Owning skill: `vendor-review`
- Notes: aligns with finance-snapshot cadence

### Quarterly docs coherence audit
- Type: review cadence
- Cadence: quarterly
- Owner: #1 + #36
- Owning skill: `docs-coherence-audit`
- Notes: also triggered by major release

### Quarterly design system audit
- Type: review cadence
- Cadence: quarterly
- Owner: design council + #36
- Owning skill: `design-system-audit`

### Quarterly security claim audit
- Type: review cadence
- Cadence: quarterly + before fundraising / major announcement
- Owner: #4 + compliance council + #36
- Owning skill: `security-claim-audit`

### Annual vendor contract review
- Type: review cadence
- Cadence: annual
- Owner: #9 + #36
- Notes: scopes contract terms, not just plan + price

### Weekly metrics brief
- Type: calendar standing
- Cadence: weekly (Mondays)
- Owner: #35 + operator
- Owning skill: `weekly-metrics-brief`

### Weekly internal coordination brief
- Type: calendar standing
- Cadence: weekly (Mondays)
- Owner: #36 + operator
- Owning skill: `internal-coordination-brief`

### Weekly OSS triage
- Type: calendar standing
- Cadence: weekly
- Owner: #2 + operator
- Owning skill: `open-source-program-run`

---

## Standing flags

- Any deadline within 7 days → P0 in coordination brief.
- Any deadline within 30 days → P1.
- Any deadline missed → file in `memory/CORRECTIONS.md` with cause + prevention.

## Anti-patterns

- Letting renewal dates slip past lead-time without a `vendor-review`.
- Filing a grant within 7 days of deadline (insufficient time for `claim-review`).
- Ignoring regulatory cadence because "nothing's changed" — annual reviews are mandatory regardless of change.
- Burying deadlines in skill-specific files instead of here.

## Maintenance

- Operator updates dates as events pass.
- Skills propose additions via their workflow (e.g., `grant-application` proposes a deadline entry on first invocation for a programme).
- Quarterly sweep by #36 to retire one-off events that have passed.
