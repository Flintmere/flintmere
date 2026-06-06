/**
 * Monday metrics rollup via the PostHog Query API (EU, project 195011 —
 * ADR 0025). Uses the same env vars the /admin/health signal uses:
 * POSTHOG_PERSONAL_API_KEY (secret) + POSTHOG_PROJECT_ID.
 *
 * The ~20-line fetch is duplicated rather than reused from
 * apps/scanner/src/app/admin/health/_signals/posthog.ts: that helper is
 * page-coupled (returns a HealthCard `SignalResult`, leans on Next's
 * `next: { revalidate }` fetch extension) and a lib file should not pull
 * server-component-only plumbing. Duplication is the cheaper coupling.
 *
 * Scan-funnel event is `scan_started` — the canonical scan event in the
 * ADR 0013 / ADR 0025 taxonomy. There is no separate `scan_completed`
 * event; `scan_started` fires when the merchant submits a domain.
 */

import type { PosthogRollup } from './types';

export async function fetchPosthogRollup(
  fetchFn: typeof fetch = fetch,
  env: NodeJS.ProcessEnv = process.env,
): Promise<PosthogRollup> {
  const key = env.POSTHOG_PERSONAL_API_KEY;
  const project = env.POSTHOG_PROJECT_ID;
  if (!key || !project) return { visitors7d: 0, scans7d: 0, available: false };
  try {
    const query = async (hogql: string): Promise<number> => {
      const res = await fetchFn(`https://eu.posthog.com/api/projects/${project}/query/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: { kind: 'HogQLQuery', query: hogql } }),
      });
      if (!res.ok) throw new Error(`posthog query ${res.status}: ${await res.text()}`);
      const json = (await res.json()) as { results?: unknown[][] };
      return Number(json.results?.[0]?.[0] ?? 0);
    };
    const [visitors7d, scans7d] = await Promise.all([
      query("select count(distinct person_id) from events where timestamp > now() - interval 7 day and event = '$pageview'"),
      query("select count() from events where timestamp > now() - interval 7 day and event = 'scan_started'"),
    ]);
    return { visitors7d, scans7d, available: true };
  } catch {
    return { visitors7d: 0, scans7d: 0, available: false };
  }
}
