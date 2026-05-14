import { fetchWithTimeout } from './fetch-with-timeout';
import type { SignalResult } from './types';

interface PlausibleAggregateResponse {
  results: { pageviews: { value: number } };
}

const DASHBOARD_URL = 'https://eu.plausible.io/audit.flintmere.com';
const STATS_BASE = 'https://eu.plausible.io/api/v1/stats/aggregate';

async function pageviewsForSite(
  siteId: string,
  date: string,
  token: string,
): Promise<number> {
  const url = `${STATS_BASE}?site_id=${encodeURIComponent(siteId)}&period=day&date=${date}&metrics=pageviews`;
  const res = await fetchWithTimeout(
    url,
    {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 60 },
    },
    1500,
  );
  if (!res.ok) throw new Error(`Plausible ${siteId}: HTTP ${res.status}`);
  const json = (await res.json()) as PlausibleAggregateResponse;
  return json.results.pageviews.value;
}

function yesterdayUtc(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function fetchPlausibleViews(): Promise<
  SignalResult<{ audit: number; marketing: number; date: string }>
> {
  const fetchedAt = new Date().toISOString();
  const token = process.env.PLAUSIBLE_API_KEY;
  if (!token) {
    return {
      status: 'unknown',
      metric: 'PLAUSIBLE_API_KEY not set',
      fetchedAt,
      sourceUrl: DASHBOARD_URL,
    };
  }
  const date = yesterdayUtc();
  try {
    const [audit, marketing] = await Promise.all([
      pageviewsForSite('audit.flintmere.com', date, token),
      pageviewsForSite('flintmere.com', date, token),
    ]);
    const zero = audit === 0 || marketing === 0;
    const total = audit + marketing;
    return {
      status: zero ? 'warn' : 'ok',
      metric: `${total} views (audit ${audit} · marketing ${marketing}) on ${date}`,
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
