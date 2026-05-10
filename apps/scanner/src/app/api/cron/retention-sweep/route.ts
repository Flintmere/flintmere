import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { runRetentionSweep } from '@/lib/retention-sweep'

// Coolify-scheduled cron endpoint for the privacy-policy retention
// sweeps. Configured as a Scheduled Task on the scanner application:
//
//   curl -fsS -X POST -H "X-Cron-Secret: $CRON_SECRET" \
//        https://audit.flintmere.com/api/cron/retention-sweep
//
// Frequency: 0 3 * * * (03:00 UTC daily — low-traffic window, before
// the rescan-30-day cron at 04:00).
//
// Container: must be filled in Coolify's Scheduled Task UI with the
// scanner web container name.
//
// Sweeps performed (see lib/retention-sweep.ts):
//   1. Leads past 30-day unsubscribe-retention.
//   2. Leads attached to scans past 90-day retention (FK prep).
//   3. Scans past 90-day retention (privacy /privacy §04).
//   4. Stripe webhook idempotency rows past 30-day retention.
//
// Authentication: verifyCronSecret (constant-time, no length leak —
// shared with the other two cron routes).
//
// Idempotency: each deleteMany is keyed on a strict cutoff, so re-firing
// is a no-op once the previous run cleared the eligible window.

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

export async function POST() {
  const hdrs = await headers()
  const authError = verifyCronSecret(hdrs.get('x-cron-secret'))
  if (authError) return authError

  try {
    const result = await runRetentionSweep()
    return NextResponse.json(
      { event: 'retention-sweep', ...result },
      { status: 200 },
    )
  } catch (err) {
    console.error('[retention-sweep-cron] failed', err)
    return NextResponse.json(
      { event: 'retention-sweep-failed', code: 'internal-error' },
      { status: 500 },
    )
  }
}
