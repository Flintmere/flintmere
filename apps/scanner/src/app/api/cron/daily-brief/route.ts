/**
 * Coolify-scheduled cron endpoint for the operator's daily brief.
 *
 *   curl -fsS -X POST -H "X-Cron-Secret: $CRON_SECRET" \
 *        https://audit.flintmere.com/api/cron/daily-brief
 *
 * Frequency: 0 6 * * * (06:00 UTC = 07:00 BST every day). Lands in the
 * operator inbox before the 9-to-5 day-job starts on weekdays and ahead
 * of weekend Flintmere blocks per the cadence runbook.
 *
 * Pipeline:
 *   1. verifyCronSecret — HMAC-compared header check; 403 on mismatch.
 *   2. collectBriefState — social queue + outreach approvals + outreach
 *      counters (+ Monday PostHog rollup), all partial-failure tolerant.
 *   3. composeBrief — Gemini 2.5 Flash on Vertex; falls back to a
 *      deterministic template on Vertex failure so the channel never
 *      goes silent.
 *   4. sendDailyBrief — Resend send in letterhead canon.
 *
 * Response shape on success:
 *   { event: 'daily-brief-cron', sent: bool, messageId, subject,
 *     warnings: string[], outreach: {…} }
 *
 * The route does not return the body content — operator reads the email,
 * not the cron response. Response is for log-line debugging only.
 */

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/cron-auth';
import { collectBriefState } from '@/lib/daily-brief/state';
import { composeBrief } from '@/lib/daily-brief/compose';
import { sendDailyBrief } from '@/lib/daily-brief/email';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;

export async function POST() {
  const hdrs = await headers();
  const authError = verifyCronSecret(hdrs.get('x-cron-secret'));
  if (authError) return authError;

  try {
    const state = await collectBriefState();
    const brief = await composeBrief(state);
    const result = await sendDailyBrief({ brief, state });

    return NextResponse.json(
      {
        event: 'daily-brief-cron',
        date: state.date,
        weekday: state.weekday,
        sent: result.sent,
        messageId: result.id,
        reason: result.reason,
        subject: brief.subject,
        warnings: state.warnings,
        outreach: state.outreach,
        social: {
          postedLast24h: state.social.postedLast24h.length,
          queuedNext7d: state.social.queuedNext7d.length,
          failed: state.social.failed.length,
          xCredentialsMissing: state.social.xCredentialsMissing,
        },
        approvalsPending: state.approvals.pending.length,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('[daily-brief-cron] failed', err);
    return NextResponse.json(
      {
        event: 'daily-brief-cron-failed',
        code: 'internal-error',
        message: err instanceof Error ? err.message : 'unknown',
      },
      { status: 500 },
    );
  }
}
