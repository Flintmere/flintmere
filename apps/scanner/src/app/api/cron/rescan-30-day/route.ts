import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { runDay30Rescans } from '@/lib/rescan-30-day';
import { verifyCronSecret } from '@/lib/cron-auth';

// Coolify-scheduled cron endpoint for the Day-30 audit re-scan promise.
// Configured as a Scheduled Task on the scanner application:
//   curl -fsS -X POST -H "X-Cron-Secret: $CRON_SECRET" \
//        https://audit.flintmere.com/api/cron/rescan-30-day
// Frequency: 0 4 * * * (04:00 UTC daily — low-traffic window).
// Container: must be filled in Coolify's Scheduled Task UI with the
// scanner web container name (otherwise Coolify errors "More than one
// container exists").
//
// Mirror of /api/cron/concierge-sla — same auth shape (verifyCronSecret),
// same fail-closed posture, same force-dynamic. Public HTTPS through
// Traefik, not localhost.
//
// Idempotency: handled inside runDay30Rescans via the rescanCompletedAt
// + rescanEmailSentAt columns. Re-firing daily is safe — completed rows
// drop out of the query.

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 300;

export async function POST() {
  const hdrs = await headers();
  const authError = verifyCronSecret(hdrs.get('x-cron-secret'));
  if (authError) return authError;

  try {
    const result = await runDay30Rescans();
    return NextResponse.json(
      { event: 'rescan-30-day', ...result },
      { status: 200 },
    );
  } catch (err) {
    // Don't leak err.message to the response body — Prisma errors can
    // contain connection strings and SQL fragments. Log full context
    // server-side; return a generic code.
    console.error('[rescan-30-day-cron] failed', err);
    return NextResponse.json(
      { event: 'rescan-30-day-failed', code: 'internal-error' },
      { status: 500 },
    );
  }
}
