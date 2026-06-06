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
