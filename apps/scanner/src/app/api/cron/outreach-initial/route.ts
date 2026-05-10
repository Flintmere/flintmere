/**
 * Coolify-scheduled cron endpoint for the initial-send batch.
 *
 *   curl -fsS -X POST -H "X-Cron-Secret: $CRON_SECRET" \
 *        https://audit.flintmere.com/api/cron/outreach-initial
 *
 * Frequency suggestion: 0 9 * * * (09:00 UTC daily). Drains today's
 * remaining daily-cap budget of `status='queued'` targets via the same
 * batch logic the laptop-side script uses (`lib/outreach/batch.ts`).
 *
 * PaceMs = 2000 (2s between sends) — polite to Resend, avoids Gmail
 * burst-flag heuristics. 30 sends × 2s ≈ 1 minute total; the 5-minute
 * maxDuration leaves comfortable headroom for the per-send Resend RTT.
 *
 * Daily-cap interaction:
 *   - lib/outreach/cap.ts.dailyCap() reads OUTREACH_SPRINT_START + the
 *     OUTREACH_DAILY_CAP_OVERRIDE env. Cron honors both natively.
 *   - Pause-everything kill switch: set OUTREACH_DAILY_CAP_OVERRIDE=0 in
 *     Coolify env. The cron fires but sends zero rows. No code change.
 *
 * Authentication: verifyCronSecret (shared with retention-sweep + the
 * other cron routes). 503 if CRON_SECRET unset, 403 if header missing
 * or mismatched.
 *
 * Idempotency: lib/outreach/send.ts enforces unique-on-(target_id, kind)
 * so even if the cron fires twice in the same window, no double-send.
 */

import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { runSendBatch } from '@/lib/outreach/batch'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

export async function POST() {
  const hdrs = await headers()
  const authError = verifyCronSecret(hdrs.get('x-cron-secret'))
  if (authError) return authError

  try {
    const result = await runSendBatch({ kind: 'initial', paceMs: 2000 })
    return NextResponse.json(
      { event: 'outreach-initial-cron', ...result },
      { status: 200 },
    )
  } catch (err) {
    console.error('[outreach-initial-cron] failed', err)
    return NextResponse.json(
      {
        event: 'outreach-initial-cron-failed',
        code: 'internal-error',
        message: err instanceof Error ? err.message : 'unknown',
      },
      { status: 500 },
    )
  }
}
