import { fetchWithTimeout } from './fetch-with-timeout';
import type { SignalResult } from './types';

interface BetterStackMonitor {
  attributes: {
    status: string;
    pronounceable_name?: string;
    url?: string;
    last_checked_at?: string;
  };
}

interface BetterStackResponse {
  data: BetterStackMonitor[];
}

const DASHBOARD_URL = 'https://uptime.betterstack.com';
const API_URL = 'https://uptime.betterstack.com/api/v2/monitors';

export async function fetchBetterStack(): Promise<
  SignalResult<{ down: string[]; total: number }>
> {
  const fetchedAt = new Date().toISOString();
  const token = process.env.BETTERSTACK_API_KEY;
  if (!token) {
    return {
      status: 'unknown',
      metric: 'BETTERSTACK_API_KEY not set',
      fetchedAt,
      sourceUrl: DASHBOARD_URL,
    };
  }
  try {
    const res = await fetchWithTimeout(
      API_URL,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 60 },
      },
      1500,
    );
    if (!res.ok) {
      return {
        status: 'unknown',
        metric: `HTTP ${res.status}`,
        fetchedAt,
        sourceUrl: DASHBOARD_URL,
        errorMessage: await res.text().catch(() => ''),
      };
    }
    const json = (await res.json()) as BetterStackResponse;
    const monitors = json.data ?? [];
    const down = monitors
      .filter((m) => m.attributes.status === 'down')
      .map(
        (m) =>
          m.attributes.pronounceable_name ?? m.attributes.url ?? 'unnamed',
      );
    return {
      status: down.length === 0 ? 'ok' : 'error',
      metric:
        down.length === 0
          ? `${monitors.length} monitors, all up`
          : `${down.length} down — ${down.join(', ')}`,
      fetchedAt,
      sourceUrl: DASHBOARD_URL,
      data: { down, total: monitors.length },
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
