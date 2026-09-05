import { LEGACY_SCANNER_HOST, MARKETING_HOST, SCANNER_HOST } from '@/lib/host-routing';
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
  SignalResult<{ scanner: number; marketing: number; date: string }>
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
    // Scanner traffic is split across both hosts through the ADR 0028
    // Shipment 2 cutover: the legacy host still receives real requests and
    // 301s them, so its pageviews are scanner pageviews. Summing keeps this
    // signal honest — bucketing on the canonical host alone would have read
    // as a traffic collapse on cutover day, and on the legacy host alone it
    // reads as one every day after. Drop the legacy bucket when its count
    // reaches zero and stays there, not on a fixed date.
    const legacy = byHost.get(LEGACY_SCANNER_HOST) ?? 0;
    const scanner = (byHost.get(SCANNER_HOST) ?? 0) + legacy;
    const marketing = byHost.get(MARKETING_HOST) ?? 0;
    const zero = scanner === 0 || marketing === 0;
    const legacyNote = legacy > 0 ? ` · legacy ${legacy}` : '';
    return {
      status: zero ? 'warn' : 'ok',
      metric: `${scanner + marketing} views (scanner ${scanner}${legacyNote} · marketing ${marketing}) on ${date}`,
      fetchedAt,
      sourceUrl: DASHBOARD_URL,
      data: { scanner, marketing, date },
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
