# PostHog Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace dead Plausible integration with PostHog Cloud EU (cookieless-max, free tier, full feature surface) per the spec at `projects/flintmere/plans/2026-06-06-posthog-migration-spec.md`.

**Architecture:** posthog-js initialised in `instrumentation-client.ts` with `persistence: 'memory'` (research resolved: cookieless server-hash mode disables session replay, so memory persistence is the cookieless-max config). Capture proxied through Next.js rewrites at `/ingest`. Server-side `concierge_paid` via posthog-node. Health signal via the Query API (HogQL). Legal + ADR + docs updated in lockstep.

**Tech Stack:** Next.js 15 App Router, pnpm workspace (`pnpm -F scanner …`), vitest (`environment: 'node'`, alias `@/` → `./src/`), posthog-js, posthog-node v5, Stripe webhooks, Tailwind v4.

**Worktree:** ALL work happens in `/Users/abuaa/Projects/Flintmere-posthog` on branch `feat/posthog-analytics`. Commands run from `/Users/abuaa/Projects/Flintmere-posthog/apps/scanner` unless stated. Commit after every task with the trailer `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

**Resolved research decisions (do not re-litigate):**
- Persistence: `'memory'` — NOT `cookieless_mode` (replay would be disabled). Zero cookies, zero localStorage. Distinct_id lives per page-load; funnels stitch within a visit (App Router SPA), not across visits. Documented in ADR 0025.
- Proxy: `/ingest` rewrites per posthog.com/docs/advanced/proxy/nextjs; requires `skipTrailingSlashRedirect: true`.
- `defaults: '2026-01-30'` config snapshot (enables history-change pageviews + pageleave).
- Server events: random distinctId + `$process_person_profile: false`.
- Key placeholder `phc_REPLACE_ME` until operator supplies the real key — build must stay green with the stub (init is skipped when the stub is detected).

---

### Task 1: Dependencies + analytics core (config, client helper, init)

**Files:**
- Create: `apps/scanner/src/lib/analytics-config.ts`
- Create: `apps/scanner/src/lib/analytics.ts`
- Create: `apps/scanner/src/lib/analytics.test.ts`
- Modify: `apps/scanner/src/instrumentation-client.ts`
- Delete: `apps/scanner/src/lib/plausible.ts` (in Task 2, after call sites move)

- [ ] **Step 1: Install deps**

```bash
cd /Users/abuaa/Projects/Flintmere-posthog && pnpm -F scanner add posthog-js posthog-node
```
Expected: lockfile updated, both packages in `apps/scanner/package.json` dependencies.

- [ ] **Step 2: Write `analytics-config.ts`** (constants only — no SDK imports, safe for server + client)

```typescript
// PostHog connection constants — single source of truth (ADR 0025).
// The phc_ project key is public-by-design (anti-waste rule 6: visible in
// DevTools to any visitor; postcard test passes) — hardcode, no env var.
// OPERATOR: replace phc_REPLACE_ME with the real key from PostHog
// project settings (EU Cloud → Flintmere web → Project API key).
export const POSTHOG_KEY = 'phc_REPLACE_ME';
export const POSTHOG_PROXY_PATH = '/ingest';
export const POSTHOG_UI_HOST = 'https://eu.posthog.com';
export const POSTHOG_SERVER_HOST = 'https://eu.i.posthog.com';

export function posthogKeyIsStub(): boolean {
  return POSTHOG_KEY.includes('REPLACE_ME');
}
```

- [ ] **Step 3: Write failing test `analytics.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { track } from './analytics';

describe('track', () => {
  it('is a safe no-op without a browser window (SSR)', () => {
    // vitest environment is 'node' — window is undefined here.
    expect(() => track('scan_started', { domain: 'x.com' })).not.toThrow();
  });

  it('accepts events without props', () => {
    expect(() => track('email_captured')).not.toThrow();
  });
});
```

Run: `pnpm -F scanner test -- src/lib/analytics.test.ts` → FAIL (module not found).

- [ ] **Step 4: Write `analytics.ts`**

```typescript
// PostHog analytics helper — replaces the Plausible helper (ADR 0025,
// superseding ADR 0013). Cookieless-max: persistence 'memory' → zero
// cookies, zero localStorage identifiers, no consent banner.
//
// Event taxonomy (names unchanged from ADR 0013 — portable by design):
//   scan_started, email_captured, audit_cta_from_scan, band_preselected,
//   band_switched, audit_prefill_applied, concierge_clicked,
//   audit_draft_generated (client) + concierge_paid (server,
//   apps/scanner/src/lib/analytics-server.ts).
//
// Safe no-op if PostHog isn't initialised (SSR, stub key, ad-blockers).
// Never throws — analytics must never break the user flow.
import posthog from 'posthog-js';

export function track(
  event: string,
  props?: Record<string, string | number | boolean>,
): void {
  if (typeof window === 'undefined') return;
  if (!posthog.__loaded) return;
  try {
    posthog.capture(event, props);
  } catch {
    // Swallow — analytics must never break the user flow.
  }
}
```

Run: `pnpm -F scanner test -- src/lib/analytics.test.ts` → PASS.

- [ ] **Step 5: Add PostHog init to `instrumentation-client.ts`**

Keep the existing Sentry block untouched (including the idle-deferred init). Add ABOVE the Sentry section (PostHog inits immediately — deferring would drop early `scan_started` events; the SDK lazy-loads the replay recorder itself):

```typescript
import posthog from 'posthog-js';
import {
  POSTHOG_KEY,
  POSTHOG_PROXY_PATH,
  POSTHOG_UI_HOST,
  posthogKeyIsStub,
} from '@/lib/analytics-config';

// PostHog Cloud EU via first-party /ingest proxy (next.config.ts rewrites).
// Cookieless-max per ADR 0025: memory persistence (zero client storage),
// anonymous events only (no identify() anywhere in this codebase).
if (typeof window !== 'undefined' && !posthogKeyIsStub()) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_PROXY_PATH,
    ui_host: POSTHOG_UI_HOST,
    defaults: '2026-01-30', // history-change pageviews + pageleave
    persistence: 'memory', // cookieless: replay works, identity per page-load
    person_profiles: 'identified_only', // never identified → anonymous pricing
    capture_performance: { web_vitals: true },
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '[data-ph-mask]',
    },
  });
}
```

Also DELETE the stale comment at line ~29 saying Plausible covers Core Web Vitals; replace with `// Web vitals: PostHog capture_performance (ADR 0025).`

- [ ] **Step 6: Verify + commit**

```bash
pnpm -F scanner typecheck && pnpm -F scanner test
git add -A && git commit -m "feat(analytics): posthog-js core — config, track helper, cookieless init"
```

---

### Task 2: Call-site migration + layout + proxy + CSP + host routing

**Files:**
- Modify: `apps/scanner/src/components/ScanForm.tsx:4`, `src/components/EmailGate.tsx:8`, `src/app/audit/BandTriptych.tsx:37`, `src/app/audit/CheckoutCard.tsx:40`, `src/app/admin/audit-draft/_components/DraftForm.tsx:5`
- Modify: `apps/scanner/src/app/layout.tsx:149-162`
- Modify: `apps/scanner/next.config.ts`
- Modify: `apps/scanner/src/middleware.ts` (CSP block ~243-267, comment ~216-225, matcher ~299-303)
- Modify: `apps/scanner/src/lib/host-routing.ts`
- Delete: `apps/scanner/src/lib/plausible.ts`

- [ ] **Step 1: Swap imports.** Run `grep -rn "lib/plausible" src/` — for every hit, change `from '@/lib/plausible'` → `from '@/lib/analytics'` (preserve quote/semicolon style per file). Then `git rm src/lib/plausible.ts`.

- [ ] **Step 2: Remove the Plausible `<Script>` block** in `layout.tsx` (lines 149–162: comment + both Script tags). Keep the `next/script` import — it is still used (JSON-LD). Nothing replaces the block; posthog-js is bundled, not script-injected.

- [ ] **Step 3: Add proxy rewrites to `next.config.ts`.** Inside the config object (sibling of `headers()`), add:

```typescript
  // PostHog Cloud EU first-party proxy (ADR 0025) — ad-blocker-resistant
  // capture. PostHog's API uses trailing slashes; skipTrailingSlashRedirect
  // below stops Next.js 308'ing them. Pattern per
  // posthog.com/docs/advanced/proxy/nextjs.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://eu-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/array/:path*',
        destination: 'https://eu-assets.i.posthog.com/array/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://eu.i.posthog.com/:path*',
      },
    ];
  },
```

- [ ] **Step 4: CSP.** In `middleware.ts` `buildCsp()`: remove `https://plausible.io` from `script-src` AND `connect-src` (all capture is same-origin via `/ingest`; replay workers already covered by existing `worker-src 'self' blob:`). Update the explanatory comment block (~lines 216–225): replace the plausible.io bullet with `*  - (PostHog loads same-origin via the /ingest proxy — no host entry needed)` and drop "the Plausible init shim" wording.

- [ ] **Step 5: Host routing must not 301 `/ingest/*`.** In `src/lib/host-routing.ts`, find where `/api/` paths are treated as all-hosts (per the header comment "all hosts — APIs (/api/*), Next.js assets…") and add `/ingest` to the same allowlist logic + the doc comment. Also update the stale TODO at ~line 25: `evaluate via Plausible` → `evaluate via PostHog`. In `middleware.ts` add `ingest` to the matcher exclusion:

```typescript
    '/((?!_next/static|_next/image|ingest|favicon.ico|icon.svg|apple-icon|opengraph-image|api/healthz).*)',
```

Also update the `middleware.ts:27` comment "evaluate via Plausible" → "evaluate via PostHog".

- [ ] **Step 6: Host-routing test.** Check for an existing `src/lib/host-routing.test.ts`; if present, add a case asserting `/ingest/...` paths are all-hosts (never cross-host-redirected), following the file's existing assertion helpers. If no test file exists, create one with just that case using the module's exported functions.

- [ ] **Step 7: Verify + commit**

```bash
pnpm -F scanner typecheck && pnpm -F scanner test && pnpm -F scanner build
git add -A && git commit -m "feat(analytics): migrate call sites to PostHog, /ingest proxy, CSP + host-routing"
```
Expected: build green with stub key (init guarded). Grep check: `grep -rn "plausible" src/ --include='*.ts*' | grep -vi 'adr\|changelog'` → only comment references slated for Task 8.

---

### Task 3: Server-side `concierge_paid` (Stripe webhook)

**Files:**
- Create: `apps/scanner/src/lib/analytics-server.ts`
- Create: `apps/scanner/src/lib/analytics-server.test.ts`
- Modify: the concierge finalisation path — locate with `grep -rn "finaliseConciergeBooking" src/` (definition file), called from `src/app/api/webhooks/stripe/route.ts` (both `payment_intent.succeeded` and legacy `checkout.session.completed` paths funnel through it — instrument the SHARED function once, after the booking is persisted, so both paths emit exactly one event guarded by the route's existing idempotency).

- [ ] **Step 1: Failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { captureServerEvent } from './analytics-server';

describe('captureServerEvent', () => {
  it('resolves without throwing when the key is a stub', async () => {
    await expect(
      captureServerEvent('concierge_paid', { shop: 'x.myshopify.com' }),
    ).resolves.toBeUndefined();
  });
});
```

Run: `pnpm -F scanner test -- src/lib/analytics-server.test.ts` → FAIL.

- [ ] **Step 2: Implement `analytics-server.ts`**

```typescript
// Server-side PostHog capture (ADR 0025). One-shot client per call —
// volume is one event per payment; flushAt:1 + shutdown() guarantees
// delivery before the serverless handler exits.
// Events are anonymous ($process_person_profile: false) — server events
// describe revenue, not people.
import { randomUUID } from 'node:crypto';
import { PostHog } from 'posthog-node';
import { POSTHOG_KEY, POSTHOG_SERVER_HOST, posthogKeyIsStub } from './analytics-config';

export async function captureServerEvent(
  event: string,
  properties: Record<string, string | number | boolean>,
): Promise<void> {
  if (posthogKeyIsStub()) return;
  try {
    const client = new PostHog(POSTHOG_KEY, {
      host: POSTHOG_SERVER_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
    client.capture({
      distinctId: `server:${randomUUID()}`,
      event,
      properties: { ...properties, $process_person_profile: false },
    });
    await client.shutdown();
  } catch {
    // Swallow — analytics must never break a payment path.
  }
}
```

Run test → PASS.

- [ ] **Step 3: Fire the event.** In the `finaliseConciergeBooking` implementation, AFTER the booking is successfully persisted (and inside the success path only), add:

```typescript
await captureServerEvent('concierge_paid', {
  shop: shopUrl,
  band: bandSlug,
});
```

Include `amount` if a payment amount is already in scope at that point (use the existing variable; do not re-fetch from Stripe just for this). Match the file's import style.

- [ ] **Step 4: Verify + commit**

```bash
pnpm -F scanner typecheck && pnpm -F scanner test
git add -A && git commit -m "feat(analytics): server-side concierge_paid via posthog-node"
```

---

### Task 4: Health signal + daily brief + env

**Files:**
- Create: `apps/scanner/src/app/admin/health/_signals/posthog.ts`
- Create: `apps/scanner/src/app/admin/health/_signals/posthog.test.ts`
- Delete: `apps/scanner/src/app/admin/health/_signals/plausible.ts`
- Modify: `apps/scanner/src/app/admin/health/page.tsx:6` (import), `:34-42` (Promise.all), `:114` (HealthCard)
- Modify: `apps/scanner/src/lib/daily-brief/health-check.ts` (tab 3 + header comment)
- Modify: `apps/scanner/src/lib/daily-brief/daily-brief.test.ts:224-240`
- Modify: `apps/scanner/.env.example` (~lines 100-135)

- [ ] **Step 1: Failing signal test** (note: vitest `include` is `src/**/*.test.ts` so this path is picked up)

```typescript
import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchPosthogViews } from './posthog';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('fetchPosthogViews', () => {
  it('returns unknown when env is missing', async () => {
    vi.stubEnv('POSTHOG_PERSONAL_API_KEY', '');
    vi.stubEnv('POSTHOG_PROJECT_ID', '');
    const r = await fetchPosthogViews();
    expect(r.status).toBe('unknown');
  });

  it('aggregates pageviews by host', async () => {
    vi.stubEnv('POSTHOG_PERSONAL_API_KEY', 'phx_test');
    vi.stubEnv('POSTHOG_PROJECT_ID', '12345');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            results: [
              ['audit.flintmere.com', 7],
              ['flintmere.com', 3],
            ],
          }),
          { status: 200 },
        ),
      ),
    );
    const r = await fetchPosthogViews();
    expect(r.status).toBe('ok');
    expect(r.data).toMatchObject({ audit: 7, marketing: 3 });
  });
});
```

Run → FAIL.

- [ ] **Step 2: Implement `posthog.ts`** (mirror `plausible.ts`'s shape: `SignalResult`, `fetchWithTimeout`, warn-on-zero):

```typescript
import { fetchWithTimeout } from './fetch-with-timeout';
import type { SignalResult } from './types';

const DASHBOARD_URL = 'https://eu.posthog.com';
const HOGQL =
  "SELECT properties.$host AS host, count() AS pageviews " +
  "FROM events WHERE event = '$pageview' " +
  'AND timestamp >= toStartOfDay(now() - toIntervalDay(1)) ' +
  'AND timestamp < toStartOfDay(now()) GROUP BY host';

interface QueryResponse {
  results: [string, number][];
}

function yesterdayUtc(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function fetchPosthogViews(): Promise<
  SignalResult<{ audit: number; marketing: number; date: string }>
> {
  const fetchedAt = new Date().toISOString();
  const token = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  if (!token || !projectId) {
    return {
      status: 'unknown',
      metric: 'POSTHOG_PERSONAL_API_KEY / POSTHOG_PROJECT_ID not set',
      fetchedAt,
      sourceUrl: DASHBOARD_URL,
    };
  }
  const date = yesterdayUtc();
  try {
    const res = await fetchWithTimeout(
      `https://eu.posthog.com/api/projects/${projectId}/query/`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: { kind: 'HogQLQuery', query: HOGQL } }),
        next: { revalidate: 60 },
      },
      3000,
    );
    if (!res.ok) throw new Error(`PostHog query: HTTP ${res.status}`);
    const json = (await res.json()) as QueryResponse;
    const byHost = new Map(json.results);
    const audit = byHost.get('audit.flintmere.com') ?? 0;
    const marketing = byHost.get('flintmere.com') ?? 0;
    const zero = audit === 0 || marketing === 0;
    return {
      status: zero ? 'warn' : 'ok',
      metric: `${audit + marketing} views (audit ${audit} · marketing ${marketing}) on ${date}`,
      fetchedAt,
      sourceUrl: DASHBOARD_URL,
      data: { audit, marketing, date },
    };
  } catch (e) {
    return {
      status: 'unknown',
      metric: 'fetch failed',
      fetchedAt,
      sourceUrl: DASHBOARD_URL,
      errorMessage: e instanceof Error ? e.message : String(e),
    };
  }
}
```

Run test → PASS. Then `git rm src/app/admin/health/_signals/plausible.ts`.

- [ ] **Step 3: Rewire `admin/health/page.tsx`** — import `fetchPosthogViews` from `./_signals/posthog`, rename the destructured variable, `<HealthCard title="PostHog" signal={posthog} />`.

- [ ] **Step 4: Daily brief.** In `health-check.ts`: tab 3 becomes `3. **PostHog** — https://eu.posthog.com — yesterday's pageviews + any replay worth watching (single project covers both \`flintmere.com\` and \`audit.flintmere.com\` — same Next.js app behind two domains). Note anything zero or unusually high.` Update the header comment (the "PostHog lands and replaces Plausible" sentence is now stale — rewrite to reference future tool changes generically). In `daily-brief.test.ts` update assertions: `'Plausible'` → `'PostHog'`, `'plausible.io'` → `'eu.posthog.com'`.

- [ ] **Step 5: `.env.example`.** Replace the Plausible Stats API block AND the stale `POSTHOG_KEY`/`POSTHOG_HOST` placeholders with:

```bash
# ---- PostHog Query API (operator daily health page) ----
# Personal API key (scopes: query:read, insight:write, dashboard:write —
# the write scopes are for scripts/provision-posthog.ts) from
# eu.posthog.com → settings → personal API keys. Numeric project ID from
# the project's URL/settings. Used by /admin/health for yesterday's
# pageviews and by the dashboard provisioning script. Mark Runtime-only.
# The public phc_ project key is hardcoded in
# apps/scanner/src/lib/analytics-config.ts (public-by-design, ADR 0025).
# POSTHOG_PERSONAL_API_KEY=""
# POSTHOG_PROJECT_ID=""
```

- [ ] **Step 6: Verify + commit**

```bash
pnpm -F scanner typecheck && pnpm -F scanner test
git add -A && git commit -m "feat(admin): PostHog health signal + daily-brief + env docs"
```

---

### Task 5: Feature-flags wrapper

**Files:**
- Create: `apps/scanner/src/lib/flags.ts`
- Create: `apps/scanner/src/lib/flags.test.ts`

- [ ] **Step 1: Failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { isFlagEnabled, getFlagPayload } from './flags';

describe('flags', () => {
  it('returns false / undefined safely outside the browser', () => {
    expect(isFlagEnabled('any_flag')).toBe(false);
    expect(getFlagPayload('any_flag')).toBeUndefined();
  });
});
```

Run → FAIL.

- [ ] **Step 2: Implement `flags.ts`**

```typescript
// PostHog feature-flag helpers (ADR 0025).
//
// Cookieless caveat: with persistence 'memory' the distinct_id is
// per-page-load, so flag bucketing can change across reloads. Fine for
// ops kill-switches and copy experiments measured within a visit; NOT
// suitable for long-running A/B tests needing stable assignment — that
// requires the hybrid-consent follow-up (spec §Scope-OUT).
//
// Safe no-ops when PostHog isn't initialised. Never throws.
import posthog from 'posthog-js';

export function isFlagEnabled(key: string): boolean {
  if (typeof window === 'undefined') return false;
  if (!posthog.__loaded) return false;
  try {
    return posthog.isFeatureEnabled(key) === true;
  } catch {
    return false;
  }
}

export function getFlagPayload(key: string): unknown {
  if (typeof window === 'undefined') return undefined;
  if (!posthog.__loaded) return undefined;
  try {
    return posthog.getFeatureFlagPayload(key);
  } catch {
    return undefined;
  }
}
```

Run → PASS.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(analytics): feature-flag wrapper with cookieless caveats"
```

---

### Task 6: Dashboards-as-code provisioning script

**Files:**
- Create: `apps/scanner/scripts/provision-posthog.ts`

- [ ] **Step 1: Write the script.** Conventions per `scripts/batch-scan.ts` (header comment with usage, env-driven, run via `tsx`). Idempotent: list existing insights/dashboards by name, create only what's missing. Uses `POSTHOG_PERSONAL_API_KEY` + `POSTHOG_PROJECT_ID`; exits 0 with a clear message if unset.

```typescript
/**
 * provision-posthog
 * -----------------
 * Idempotently creates the canonical Flintmere insights + dashboard in
 * PostHog Cloud EU (ADR 0025). Lookup-by-name; re-running never
 * duplicates. Requires a personal API key with insight:write +
 * dashboard:write scopes.
 *
 * Usage:
 *   POSTHOG_PERSONAL_API_KEY=... POSTHOG_PROJECT_ID=... \
 *     pnpm --filter scanner exec tsx scripts/provision-posthog.ts
 */
const HOST = 'https://eu.posthog.com';
const KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const PROJECT = process.env.POSTHOG_PROJECT_ID;

if (!KEY || !PROJECT) {
  console.log(
    'POSTHOG_PERSONAL_API_KEY / POSTHOG_PROJECT_ID not set — skipping (no-op).',
  );
  process.exit(0);
}

const api = async (path: string, init?: RequestInit) => {
  const res = await fetch(`${HOST}/api/projects/${PROJECT}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(
      `${init?.method ?? 'GET'} ${path}: HTTP ${res.status} ${await res.text()}`,
    );
  }
  return res.json();
};

const events = (names: string[]) =>
  names.map((name) => ({ kind: 'EventsNode', event: name, name }));

const INSIGHTS: { name: string; query: Record<string, unknown> }[] = [
  {
    name: 'Flintmere — scan → revenue funnel',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'FunnelsQuery',
        series: events([
          'scan_started',
          'email_captured',
          'concierge_clicked',
          'concierge_paid',
        ]),
      },
    },
  },
  {
    name: 'Flintmere — acquisition (pageviews by host)',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'TrendsQuery',
        series: events(['$pageview']),
        breakdownFilter: { breakdown: '$host', breakdown_type: 'event' },
      },
    },
  },
  {
    name: 'Flintmere — event taxonomy volume',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'TrendsQuery',
        series: events([
          'scan_started',
          'email_captured',
          'audit_cta_from_scan',
          'band_preselected',
          'band_switched',
          'audit_prefill_applied',
          'concierge_clicked',
          'concierge_paid',
        ]),
      },
    },
  },
  {
    name: 'Flintmere — web vitals (LCP p90)',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'TrendsQuery',
        series: [
          {
            kind: 'EventsNode',
            event: '$web_vitals',
            name: '$web_vitals',
            math: 'p90',
            math_property: '$web_vitals_LCP_value',
          },
        ],
      },
    },
  },
];

async function main() {
  const dashName = 'Flintmere — operator';
  const dashboards = await api('/dashboards/?limit=300');
  let dash = dashboards.results?.find(
    (d: { name: string }) => d.name === dashName,
  );
  if (!dash) {
    dash = await api('/dashboards/', {
      method: 'POST',
      body: JSON.stringify({
        name: dashName,
        description: 'Provisioned by scripts/provision-posthog.ts (ADR 0025)',
      }),
    });
    console.log(`created dashboard: ${dashName}`);
  } else {
    console.log(`dashboard exists: ${dashName}`);
  }

  const existing = await api('/insights/?limit=300');
  for (const spec of INSIGHTS) {
    const found = existing.results?.find(
      (i: { name: string }) => i.name === spec.name,
    );
    if (found) {
      console.log(`insight exists: ${spec.name}`);
      continue;
    }
    await api('/insights/', {
      method: 'POST',
      body: JSON.stringify({
        name: spec.name,
        query: spec.query,
        dashboards: [dash.id],
        saved: true,
      }),
    });
    console.log(`created insight: ${spec.name}`);
  }
  console.log('done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

NOTE: the insight `query` payload shape was checked against posthog.com/docs/api/insights at plan time but the `FunnelsQuery` literal is flagged UNVERIFIED — if the API rejects it, create one funnel manually in the UI, `GET /insights/`, and mirror its `query` shape. The script is operator-run and non-blocking for the PR.

- [ ] **Step 2: Typecheck-only verification + commit** (script is outside vitest's `src/**` glob; it cannot run for real without keys):

```bash
pnpm -F scanner typecheck
git add -A && git commit -m "feat(analytics): idempotent PostHog dashboard provisioning script"
```

---

### Task 7: Legal pages (claim-review gate)

**Files:**
- Modify: `apps/scanner/src/app/cookies/page.tsx:44-47`
- Modify: `apps/scanner/src/app/privacy/page.tsx:236-240` + a new replay paragraph in the same analytics clause

- [ ] **Step 1: Cookies page.** Replace the Plausible paragraph with:

```tsx
<p className="mt-4">
  For product analytics we use <strong>PostHog (EU-hosted, configured
  cookieless)</strong>. Our PostHog configuration stores no cookies and
  no browser-storage identifiers — analytics state lives in page memory
  only. No cross-site tracking is performed. Per ADR 0025.
</p>
```

- [ ] **Step 2: Privacy page — sub-processor row.** Replace the Plausible `<li>` with:

```tsx
<li>
  <strong>PostHog</strong> (PostHog, Inc., US — data hosted in the EU,
  AWS Frankfurt) — product analytics and session replay, configured
  cookieless. No advertising profile, no cross-site tracking. Processing
  is covered by PostHog&apos;s Data Processing Agreement. Per ADR 0025.
</li>
```

- [ ] **Step 3: Privacy page — session-replay disclosure.** Add to the same analytics clause, as a following paragraph matching the page's structure:

```tsx
<p className="mt-4">
  We use session replay on our public sites to understand usability
  problems and debug reported issues. Recordings capture page
  interactions (clicks, scrolling, navigation); all keyboard input is
  masked before it leaves your browser and is never visible to us.
  Recordings carry no persistent identifier and are retained on
  PostHog&apos;s EU infrastructure for a limited period before automatic
  deletion. Lawful basis: legitimate interest (service improvement).
</p>
```

- [ ] **Step 4: Check clause 09** (`privacy/page.tsx:309-314`): "We do not use tracking, analytics, or advertising cookies" — REMAINS TRUE under memory persistence. No edit expected; confirm wording is still consistent with the new analytics paragraphs.

- [ ] **Step 5: Verify + commit**

```bash
pnpm -F scanner typecheck && pnpm -F scanner build
git add -A && git commit -m "docs(legal): cookies + privacy pages — PostHog cookieless + replay disclosure"
```

---

### Task 8: ADR 0025 + docs sweep (canon-audit gate)

**Files:**
- Create: `projects/flintmere/decisions/0025-analytics-posthog-cookieless.md`
- Modify: `projects/flintmere/decisions/README.md` (index), `projects/flintmere/STATUS.md` (changelog), `README.md:58`, `memory/admin-ops/vendor-register.md:142-158`, `memory/data-intelligence/data-sources.md:23-36` (+ its changelog), `apps/scanner/src/app/api/admin/audit-draft/generate/route.ts:119`, `apps/scanner/src/lib/audit-draft/markdown-export.ts:250`

- [ ] **Step 1: Write ADR 0025.** Required content (use ADR 0013's structure as the house format):
  - **Title**: Product analytics: PostHog Cloud EU, cookieless-max. **Status**: Accepted 2026-06-06. **Supersedes**: ADR 0013's runtime decision (0013 remains the canonical record of why cookieless matters).
  - **Trigger (honest)**: none of 0013's T1–T7 fired. Plausible Cloud's 30-day trial lapsed (Plausible has no free tier) and tracking went dark; the requirement became £0/mo. PostHog Cloud EU free tier: 1M events/mo + 5k replays/mo, permanent.
  - **Decision**: PostHog Cloud EU (Frankfurt), posthog-js with `persistence: 'memory'` — zero cookies/localStorage, no consent banner, 100% measurement (preserves 0013's council rationale). Session replay ON with full input masking. Anonymous events only (`person_profiles: 'identified_only'`, no `identify()`). First-party `/ingest` proxy.
  - **Research finding that shaped config**: PostHog's cookieless server-hash mode disables session replay without consent → memory persistence chosen. Cost: identity is per-page-load; funnels stitch within a visit, not across visits/days.
  - **Self-host rejected**: 0013 Amendment 1 droplet ground truth; PostHog's stack is heavier still.
  - **Deliberately excluded** (replicate the spec's §Scope-OUT table verbatim: error tracking/Sentry-canonical, group analytics, warehouse/pipelines, cross-session identity, Shopify-app instrumentation, hybrid banner — each with its re-entry trigger).
  - **Consequences**: legal-page updates (this PR), vendor-register + data-sources updates, health signal on Query API, dashboards-as-code script, `concierge_paid` server event closes the funnel to revenue.
- [ ] **Step 2: Index + changelog.** Add 0025 to `decisions/README.md`. Add a STATUS.md changelog entry dated 2026-06-06 in house style: "Analytics migrated Plausible → PostHog Cloud EU (ADR 0025) — cookieless-max, session replay on (masked), funnel closed to revenue via server-side `concierge_paid`. Plausible had been dark since its trial lapsed."
- [ ] **Step 3: Vendor register.** Replace the Plausible block (lines 142–158) with a PostHog block in the identical field format: Service: product analytics + session replay (cookieless config); Plan: Cloud EU free tier (1M events, 5k replays/mo); Monthly cost: £0; Renewal: n/a (free tier, usage alerts set); Lock-in: low (open-source core, portable event names); Data processor: yes; DPA in place: PostHog DPA (US entity, EU data residency — AWS Frankfurt); Sub-processors: AWS EU; Alternatives evaluated: see ADRs 0013 + 0025; Last reviewed: 2026-06-06; Notes: replaces Plausible after trial lapse; paid add-ons gated by ADR 0025 re-entry triggers.
- [ ] **Step 4: Data sources.** Rewrite the Plausible section for PostHog Cloud EU: access pattern → Query API (HogQL) + `scripts/provision-posthog.ts`; lawful basis: legitimate interest (cookieless, no banner per ADR 0025); PII: replay recordings are pseudonymous + input-masked (note retention); single project, both hosts split via `$host`. Add a changelog line.
- [ ] **Step 5: Comment sweep.** `generate/route.ts:119` "Plausible `audit_draft_generated` event" → "PostHog `audit_draft_generated` event"; `markdown-export.ts:250` "Used by the Plausible event" → "Used by the PostHog event"; `README.md:58` "Plausible Cloud EU (ADR 0013)" → "PostHog Cloud EU (ADR 0025)". EXEMPT (leave untouched): root `CLAUDE.md` (historical examples + changelog), ADR 0013 itself, dated plans/runbooks/handovers under `projects/flintmere/plans/` + `context/`, append-only memory history files.
- [ ] **Step 6: Final grep + commit**

```bash
grep -rni "plausible" apps/ packages/ --include='*.ts' --include='*.tsx' | grep -v "food-plausible\|suppression-estimate"
```
Expected: zero hits. Then:

```bash
git add -A && git commit -m "docs(analytics): ADR 0025 + vendor/data-source/docs sweep for PostHog"
```

---

### Task 9: Full verification

- [ ] `pnpm -F scanner lint && pnpm -F scanner typecheck && pnpm -F scanner test && pnpm -F scanner build` — all green.
- [ ] Re-run the Task 8 grep sweep — zero live references.
- [ ] Confirm no file touched on this branch exceeds 600 lines: `git diff --name-only origin/main | xargs wc -l | sort -n`.
- [ ] Commit any stragglers; branch is PR-ready.

---

## Post-merge operator checklist (NOT agent work)

1. PostHog → sign up → **EU Cloud** → org "Flintmere", project "Flintmere web". Copy the `phc_` key → replace `phc_REPLACE_ME` in `apps/scanner/src/lib/analytics-config.ts` (one-line follow-up commit). Create a personal API key (scopes: `query:read`, `insight:write`, `dashboard:write`).
2. Coolify: add `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_ID` (Runtime).
3. PostHog project settings: Session replay ON (canvas + network capture toggles), masking default "mask all inputs"; set usage/billing alerts.
4. Run `POSTHOG_PERSONAL_API_KEY=... POSTHOG_PROJECT_ID=... pnpm --filter scanner exec tsx scripts/provision-posthog.ts`.
5. After deploy: visit audit.flintmere.com; confirm in PostHog: live events, a replay with masked inputs, `/ingest` 200s; devtools → Application shows ZERO cookies + ZERO tracking localStorage; next morning `/admin/health` PostHog card green.
