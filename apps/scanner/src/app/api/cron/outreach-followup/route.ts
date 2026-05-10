/**
 * Coolify-scheduled cron endpoint for the followup-send batch (+5d nudge).
 *
 *   curl -fsS -X POST -H "X-Cron-Secret: $CRON_SECRET" \
 *        https://audit.flintmere.com/api/cron/outreach-followup
 *
 * Frequency suggestion: 30 9 * * * (09:30 UTC daily — 30 min after the
 * initial-send cron so the two batches don't fight for the same daily
 * cap-budget within one minute).
 *
 * Eligibility: status='sent' AND sent_at <= now() - 5 days. Naturally
 * accumulates as initial sends age; this cron is safe to run from Day 1
 * (no rows are eligible yet) — first eligibility arrives Day 6.
 *
 * Same kill-switch + idempotency posture as outreach-initial.
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
    const result = await runSendBatch({ kind: 'followup', paceMs: 2000 })
    return NextResponse.json(
      { event: 'outreach-followup-cron', ...result },
      { status: 200 },
    )
  } catch (err) {
    console.error('[outreach-followup-cron] failed', err)
    return NextResponse.json(
      {
        event: 'outreach-followup-cron-failed',
        code: 'internal-error',
        message: err instanceof Error ? err.message : 'unknown',
      },
      { status: 500 },
    )
  }
}
