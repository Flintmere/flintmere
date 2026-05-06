import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { runDay30Rescans } from '@/lib/rescan-30-day';

// Coolify-scheduled cron endpoint for the Day-30 audit re-scan promise.
// Configured as a Scheduled Task on the scanner application:
//   curl -fsS -X POST -H "X-Cron-Secret: $CRON_SECRET" \
//        https://audit.flintmere.com/api/cron/rescan-30-day
// Frequency: 0 4 * * * (04:00 UTC daily — low-traffic window).
// Container: must be filled in Coolify's Scheduled Task UI with the
// scanner web container name (otherwise Coolify errors "More than one
// container exists").
//
// Mirror of /api/cron/concierge-sla — same auth shape, same fail-closed
// posture, same force-dynamic. Public HTTPS through Traefik, not localhost.
//
// Idempotency: handled inside runDay30Rescans via the rescanCompletedAt
// + rescanEmailSentAt columns. Re-firing daily is safe — completed rows
// drop out of the query.

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 300;

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function POST() {
  const expected = process.env.CRON_SECRET;
  if (!expected || expected.length < 32) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured (must be ≥32 chars)' },
      { status: 503 },
    );
  }

  const hdrs = await headers();
  const supplied = hdrs.get('x-cron-secret') ?? '';

  if (!timingSafeEqual(supplied, expected)) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 403 });
  }

  try {
    const result = await runDay30Rescans();
    return NextResponse.json(
      { event: 'rescan-30-day', ...result },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { event: 'rescan-30-day-failed', error: message },
      { status: 500 },
    );
  }
}
