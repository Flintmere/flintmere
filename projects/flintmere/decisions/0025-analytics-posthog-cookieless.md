# ADR 0025 — Product analytics: PostHog Cloud EU, cookieless-max

- **Status**: Accepted
- **Date**: 2026-06-06
- **Decider**: Abu Aaliyah (operator) on council recommendation, per the
  operator-approved spec (2026-06-06)
- **Supersedes**: ADR 0013's runtime decision (Plausible Cloud, EU). ADR 0013
  remains the canonical record of *why cookieless matters* — its 8–2 council
  vote on the consent-banner question, the 30–50% measurement-suppression
  finding from #37, and the portable-event-name mandate all carry forward
  unchanged. This ADR changes the vendor, not the privacy posture.
- **Affects**:
  - `apps/scanner/src/lib/analytics-config.ts` (connection constants — single source of truth)
  - `apps/scanner/src/lib/analytics.ts`, `analytics-server.ts`, `flags.ts`
  - `apps/scanner/src/instrumentation-client.ts` (client init)
  - `apps/scanner/next.config.ts` (`/ingest` proxy), `src/middleware.ts` (CSP + matcher), `src/lib/host-routing.ts`
  - `apps/scanner/src/app/admin/health/_signals/posthog.ts` + `daily-brief/health-check.ts`
  - `apps/scanner/scripts/provision-posthog.ts` (dashboards-as-code)
  - `apps/scanner/src/app/cookies/page.tsx` + `privacy/page.tsx` (legal)
  - `memory/admin-ops/vendor-register.md`, `memory/data-intelligence/data-sources.md`
  - `projects/flintmere/STATUS.md` (infra state + changelog), `README.md` (stack line)

## Context

ADR 0013 picked Plausible Cloud (EU) for cookieless product analytics and
codified seven triggers (T1–T7) that would justify migrating to PostHog. **None
of T1–T7 fired.** The actual trigger was mundane: Plausible Cloud's 30-day trial
lapsed and tracking went dark. Plausible has no free tier, so continuing meant
paying ~£7/mo — and the live requirement is now a **£0/mo budget**.

That reframes the choice. ADR 0013's central case for Plausible over PostHog was
the *compounding-cost* argument: Plausible's costs stay flat while PostHog's
compound (vendor bill + consent-banner build + privacy-doc churn). But that
argument assumed PostHog meant **cookies + a consent banner**. It does not have
to. PostHog can be configured cookieless — zero cookies, zero localStorage
identifiers, no consent banner — which removes the consent-banner build, the
measurement-suppression hit, and the privacy-doc churn that drove the 2026-04-25
vote. With those neutralised, PostHog's permanent free tier (1M events/mo +
5k session replays/mo) clears the new £0 bar that Plausible cannot.

The ADR 0013 council rationale is preserved, not overturned: cookieless = 100%
measurement, zero conversion friction at the marketing → scanner handoff. We are
keeping that posture and changing the vendor that delivers it.

## Decision

**PostHog Cloud EU (Frankfurt — `eu.posthog.com` / `eu.i.posthog.com`),
configured cookieless-max.** Free tier only.

- **Client SDK**: `posthog-js`, initialised in `instrumentation-client.ts`
  alongside Sentry. `persistence: 'memory'` — zero cookies, zero localStorage
  identifiers, no consent banner required. `person_profiles: 'identified_only'`
  with no `identify()` call anywhere in the codebase → every event is anonymous.
- **Session replay ON** with `maskAllInputs: true` plus an explicit
  `[data-ph-mask]` selector for email / shop-domain fields. Keyboard input is
  masked in-browser before it leaves the device.
- **First-party `/ingest` proxy** via Next.js rewrites
  (`skipTrailingSlashRedirect: true`) — capture is same-origin and
  ad-blocker-resistant. CSP needs no PostHog host entries as a result.
- **Server-side capture** via `posthog-node` for `concierge_paid`, fired from
  the Stripe webhook after the booking persists. This is the one new event
  (ADR 0013 designed the rest; names are unchanged and portable by design).
- **Event taxonomy unchanged**: `scan_started`, `email_captured`,
  `audit_cta_from_scan`, `band_preselected`, `band_switched`,
  `audit_prefill_applied`, `concierge_clicked`, `audit_draft_generated`
  (client) + `concierge_paid` (server, new).
- **Public `phc_` project key hardcoded** in `analytics-config.ts` per
  anti-waste rule 6 (visible in DevTools to any visitor; postcard test passes).
  Stub `phc_REPLACE_ME` keeps the build green until the operator supplies the
  real key; init is skipped while the stub is present.

## Research finding that shaped the config

PostHog ships a *cookieless server-hash mode* (a daily server-side hash, the
closest analogue to Plausible's approach). We checked it against current PostHog
docs: **cookieless server-hash mode disables session replay** because replay
needs a stable per-visit identifier the hash mode deliberately withholds. Since
the operator's brief was "all the bells and whistles" within the cookieless +
£0 constraints, and session replay is one of those bells, we chose
`persistence: 'memory'` instead.

The cost of that choice, stated honestly: the distinct_id lives only for the
current page-load. The scanner is an App Router SPA, so funnels stitch **within
a single visit** but **not across visits or days**. Cross-session visitor
stitching and persistent feature-flag assignment are knowingly forgone. The
re-entry path is the hybrid consent banner (see Triggers) — a one-sprint
follow-up if the data ever justifies it.

## Self-host rejected (again)

ADR 0013 Amendment 1 captured the droplet ground truth: 2 vCPU, swap-thrashing
under existing load across three unrelated production projects. PostHog's
self-host stack (Postgres + ClickHouse + Kafka + Redis, 8+ containers) is
heavier still than the Plausible CE stack that was already judged infeasible.
Cloud EU is the only viable host. Frankfurt residency keeps the UK→EU adequacy
posture intact (no IDTA paperwork).

## Deliberately excluded (decided, documented, not forgotten)

Each row carries the re-entry trigger that would re-open it.

| Capability | Why out | Re-entry trigger |
|---|---|---|
| PostHog error tracking | Sentry is canonical (hard-won integration; double capture = noise + cost) | Sentry bill exceeds PostHog error-tracking cost, or Sentry is sunset |
| Group analytics | Paid add-on; `shop` is already an event property | Need shop-level rollup analytics AND budget approval |
| Data warehouse / pipelines | Paid add-ons | First external BI requirement |
| Cross-session identity / `identify()` | Blocked by the cookieless posture (memory persistence) | Operator approves the hybrid consent banner (one-sprint follow-up) |
| Shopify-app instrumentation | A third-party script inside the embedded admin iframe is a Built-for-Shopify review risk | Decide at BFS submission |
| Hybrid consent banner | ADR 0013's 8–2 council rationale against banners still stands | Any of: an enterprise vendor-eval demands cross-session identity; 3+ A/B tests/quarter need persistent assignment |

## Consequences

### Immediate (this PR)

- **Legal pages updated in lockstep**: `cookies/page.tsx` vendor swap (the
  "cookieless" claim stays literally true under memory persistence);
  `privacy/page.tsx` sub-processor row → PostHog Inc. (US entity, EU data
  residency — AWS Frankfurt) plus a new session-replay disclosure clause
  (what is recorded, input masking, retention, lawful basis: legitimate
  interest). Privacy clause 09 ("we do not use tracking, analytics, or
  advertising cookies") remains true and unedited.
- **Vendor register + data-sources** rewritten Plausible → PostHog.
- **STATUS.md** infra state + changelog updated.
- **Admin health signal** moves to the PostHog Query API (HogQL — yesterday's
  pageviews by `$host`), env `POSTHOG_PERSONAL_API_KEY` + `POSTHOG_PROJECT_ID`.
- **Dashboards-as-code**: `scripts/provision-posthog.ts` (idempotent,
  lookup-by-name) creates the canonical funnel / acquisition / taxonomy /
  web-vitals insights.
- **`concierge_paid` server event** closes the funnel to revenue —
  `scan_started → email_captured → concierge_clicked → concierge_paid`.

### Trade-offs we accept

- No cross-visit funnels or persistent flag assignment until/unless the hybrid
  banner lands (see Triggers).
- PostHog Inc. is a US entity with EU data residency — privacy copy must say
  "EU data residency", never "EU company". Enforced by claim-review.
- Free-tier ceilings: 1M events/mo + 5k replays/mo. Anonymous events are the
  cheap kind; usage alerts catch growth before it bills.

## Triggers to revisit (when ANY fires, re-evaluate)

| # | Trigger | Likely action |
|---|---|---|
| U1 | An add-on in the Excluded table is needed and its row's re-entry condition is met | Enable that add-on; budget review if paid |
| U2 | Cross-session identity or stable flag assignment becomes load-bearing (3+ A/B tests/quarter, or an enterprise identity ask) | Land the hybrid consent banner (one sprint); switch from memory to consented persistence |
| U3 | Free-tier usage alerts fire (approaching 1M events or 5k replays/mo) | Sample autocapture, tune replay sampling, or approve a paid tier |
| U4 | PostHog Cloud EU pricing or residency posture changes adversely | Re-evaluate vendor against the ADR 0013 + 0025 alternatives set |

## Alternatives considered

- **Stay on Plausible (pay ~£7/mo)** — rejected: violates the £0 budget
  requirement, and the move to a paid Plausible tier reopens the
  compounding-cost discussion without delivering replay, flags, or server-side
  capture.
- **Plausible Cloud free tier** — does not exist; this is the failure mode that
  triggered the migration.
- **PostHog self-host** — rejected on droplet ground truth (ADR 0013 Amendment 1);
  the stack is heavier than the Plausible CE stack already judged infeasible.
- **Umami self-host** — held in reserve in ADR 0013 as the lightweight cookieless
  fallback; rejected here because it lacks session replay, feature flags, and
  server-side capture, all of which the operator scoped IN.
- **PostHog with cookies + consent banner** — rejected: reintroduces exactly the
  consent-banner build and 30–50% measurement suppression that ADR 0013's
  council voted 8–2 to avoid. Cookieless-max preserves that vote.

## References

- ADR 0013 (Plausible Cloud, EU) — superseded runtime decision; canonical record
  of the cookieless rationale and the portable-event-name mandate.
- Spec: `projects/flintmere/plans/2026-06-06-posthog-migration-spec.md`
  (operator-approved 2026-06-06; Scope-IN / Scope-OUT tables).
- Plan: `projects/flintmere/plans/2026-06-06-posthog-migration-plan.md`
  (nine-task implementation, gated).
- `memory/admin-ops/vendor-register.md` (PostHog row — updated in this PR).
- `memory/data-intelligence/data-sources.md` (PostHog source — updated in this PR).
- Privacy Policy analytics + sub-processor clauses + Cookie Policy
  (updated in this PR — claim-review gate).
