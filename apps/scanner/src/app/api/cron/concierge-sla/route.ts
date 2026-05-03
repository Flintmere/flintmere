import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { runSlaScan } from '@/lib/concierge-sla';

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
// Authentication: shared secret in the X-Cron-Secret header. Set
// CRON_SECRET in scanner Coolify env to a random 32+ char string.
// Without it set, the route hard-403s — fail closed.
//
// Force-dynamic: this route depends on runtime DB state, must not be
// prerendered. The `headers()` call alone signals dynamic, but we set
// the export to make it explicit.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    const result = await runSlaScan();
    return NextResponse.json(
      { event: 'concierge-sla-scan', ...result },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { event: 'concierge-sla-scan-failed', error: message },
      { status: 500 },
    );
  }
}
