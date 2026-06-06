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
