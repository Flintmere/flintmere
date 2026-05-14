import type { SignalResult } from './types';

const DASHBOARD_URL = 'https://resend.com/emails';

// Phase 1: Resend's REST API does not expose a "bounces / complaints
// since yesterday" query — `/emails` only supports cursor pagination
// (limit/before/after by ID), not status + date filtering. A live
// signal needs webhook ingestion (email.bounced, email.complained,
// email.suppressed) into a local `resend_events` table, then a SQL
// query at request time. That's a Phase 2 build with its own
// migration, ingestion route, and Svix signature verification.
//
// Phase 1 stand-in: render an `unknown` card with the dashboard link
// + an explicit "manual check" caption so the operator still has a
// one-click route from this page. The status is `unknown` (not
// `warn`) so it doesn't trigger an alarm on a normal day.
export async function fetchResendBounces(): Promise<SignalResult<null>> {
  return {
    status: 'unknown',
    metric: 'manual — webhook ingestion is phase 2',
    fetchedAt: new Date().toISOString(),
    sourceUrl: DASHBOARD_URL,
  };
}
