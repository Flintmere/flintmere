import { fetchWithTimeout } from './fetch-with-timeout';
import type { SignalResult } from './types';

interface SentryIssue {
  id: string;
  shortId: string;
  title: string;
  level: string;
  count: string;
  firstSeen: string;
  permalink: string;
}

const ORG_SLUG = process.env.SENTRY_ORG ?? 'flintmere';
const PROJECT_SLUG = process.env.SENTRY_PROJECT ?? 'flintmere-scanner';
const DASHBOARD_URL = `https://sentry.io/organizations/${ORG_SLUG}/issues/?project=${PROJECT_SLUG}`;
const API_URL = `https://sentry.io/api/0/projects/${ORG_SLUG}/${PROJECT_SLUG}/issues/?query=is%3Aunresolved+age%3A-24h&statsPeriod=24h&limit=10`;

export async function fetchSentryNewIssues(): Promise<
  SignalResult<{ count: number; topTitle?: string }>
> {
  const fetchedAt = new Date().toISOString();
  const token = process.env.SENTRY_AUTH_TOKEN;
  if (!token) {
    return {
      status: 'unknown',
      metric: 'SENTRY_AUTH_TOKEN not set',
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
    const issues = (await res.json()) as SentryIssue[];
    const count = issues.length;
    const status: SignalResult['status'] =
      count === 0 ? 'ok' : count > 5 ? 'error' : 'warn';
    return {
      status,
      metric:
        count === 0
          ? 'no new issues in 24h'
          : `${count} new issue${count === 1 ? '' : 's'} · ${issues[0]?.title ?? ''}`.trim(),
      fetchedAt,
      sourceUrl: DASHBOARD_URL,
      data: { count, topTitle: issues[0]?.title },
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
