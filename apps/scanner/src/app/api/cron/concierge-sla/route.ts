import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { runSlaScan } from '@/lib/concierge-sla';
import { verifyCronSecret } from '@/lib/cron-auth';

// Coolify-scheduled cron endpoint for the Concierge SLA monitor.
// Configured as a Scheduled Task on the scanner application:
//   curl -fsS -X POST -H "X-Cron-Secret: $CRON_SECRET" \
//        https://audit.flintmere.com/api/cron/concierge-sla
// Frequency: 0 9 * * 1-5 (09:00 UTC, Mon–Fri).
// Container: must be filled in Coolify's Scheduled Task UI with the
// scanner web container name when the app has multiple containers
// (otherwise Coolify errors "More than one container exists").
//
// We hit the public HTTPS URL rather than localhost:3000 because the
// scheduled task executes inside whichever container Coolify picks,
// not necessarily the scanner web container. Public URL routes
// through Traefik regardless. The CRON_SECRET is the gate either way.
//
// Authentication: shared secret in the X-Cron-Secret header via
// verifyCronSecret (constant-time, no length leak — see cron-auth.ts).
// Without CRON_SECRET set, the route fails closed.
//
// Force-dynamic: this route depends on runtime DB state, must not be
// prerendered. The `headers()` call alone signals dynamic, but we set
// the export to make it explicit.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST() {
  const hdrs = await headers();
  const authError = verifyCronSecret(hdrs.get('x-cron-secret'));
  if (authError) return authError;

  try {
    const result = await runSlaScan();
    return NextResponse.json(
      { event: 'concierge-sla-scan', ...result },
      { status: 200 },
    );
  } catch (err) {
    // Don't leak err.message to the response body — Prisma errors can
    // contain connection strings and SQL fragments. Log full context
    // server-side; return a generic code.
    console.error('[concierge-sla-cron] failed', err);
    return NextResponse.json(
      { event: 'concierge-sla-scan-failed', code: 'internal-error' },
      { status: 500 },
    );
  }
}
