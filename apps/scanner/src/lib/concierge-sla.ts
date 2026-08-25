/**
 * Concierge SLA scan — the load-bearing function shared by:
 *   - the Coolify scheduled-task HTTP route (/api/cron/concierge-sla)
 *   - the standalone CLI script (scripts/concierge-sla-monitor.ts)
 *
 * Queries `ConciergeAudit` for any row that has been paid for but not
 * yet delivered, where the purchase is at least N working days old
 * (default 2). Emails the operator inbox a one-line-per-late-audit
 * summary so an SLA breach never goes silent.
 *
 * Idempotency: none. Fires every time the scan runs. Daily noise on a
 * late audit is the design — silence-until-action is the wrong default
 * for an SLA gate. Once the operator runs `audit:deliver`, the row
 * drops out of the query and alerts stop.
 */

import { bandBySlug, type AuditBandSlug } from './audit-pricing';
import { prisma } from './db';
import { sendEmail } from './resend';
import { getStripe } from './stripe';

export const DEFAULT_SLA_WORKING_DAYS = 2;

export interface SlaScanResult {
  undeliveredCount: number;
  lateCount: number;
  slaWorkingDays: number;
  alertSent: boolean;
  alertId?: string;
  alertReason?: string;
  to?: string;
}

export interface SlaScanOptions {
  /** Override the default 2-working-day threshold. */
  slaWorkingDays?: number;
  /** Override the operator inbox; falls back to env. */
  opsEmail?: string;
}

export function workingDaysBetween(start: Date, end: Date): number {
  if (end.getTime() <= start.getTime()) return 0;
  const msPerDay = 1000 * 60 * 60 * 24;
  const calendarDays = Math.floor(
    (end.getTime() - start.getTime()) / msPerDay,
  );
  let working = 0;
  const cursor = new Date(start);
  for (let i = 0; i < calendarDays; i++) {
    cursor.setDate(cursor.getDate() + 1);
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) working++;
  }
  return working;
}

async function resolveBandSlug(
  intentId: string,
): Promise<AuditBandSlug | null> {
  const stripe = getStripe();
  if (!stripe) return null;
  try {
    const intent = await stripe.paymentIntents.retrieve(intentId);
    const raw = intent.metadata?.audit_band;
    if (raw === 'band-1' || raw === 'band-2' || raw === 'band-3') return raw;
  } catch {
    return null;
  }
  return null;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function runSlaScan(
  options: SlaScanOptions = {},
): Promise<SlaScanResult> {
  const slaDays = options.slaWorkingDays ?? DEFAULT_SLA_WORKING_DAYS;
  const opsEmail =
    options.opsEmail ||
    process.env.CONCIERGE_OPS_EMAIL ||
    process.env.RESEND_REPLY_TO ||
    'hello@flintmere.com';
  const now = new Date();

  const undelivered = await prisma.conciergeAudit.findMany({
    where: { status: 'paid', deliveredAt: null },
    orderBy: { createdAt: 'asc' },
  });

  const late = undelivered.filter(
    (row) => workingDaysBetween(row.createdAt, now) >= slaDays,
  );

  if (late.length === 0) {
    return {
      undeliveredCount: undelivered.length,
      lateCount: 0,
      slaWorkingDays: slaDays,
      alertSent: false,
    };
  }

  const lines = await Promise.all(
    late.map(async (row) => {
      const slug = await resolveBandSlug(row.stripePaymentIntentId);
      const bandLabel = slug ? bandBySlug(slug)?.label ?? '—' : '—';
      const days = workingDaysBetween(row.createdAt, now);
      return `· ${row.shopUrl} (${row.email}) — ${bandLabel} — ${days} working day${days === 1 ? '' : 's'} late — pi=${row.stripePaymentIntentId}`;
    }),
  );

  const subject = `[Flintmere] ${late.length} catalog letter${late.length === 1 ? '' : 's'} past SLA`;
  const text = `${late.length} catalog letter${late.length === 1 ? '' : 's'} past the ${slaDays}-working-day SLA threshold:\n\n${lines.join('\n')}\n\nClear with: pnpm --filter scanner audit:deliver --intent <pi> --letter <pdf> --csv <csv>`;

  const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#F7F7F4;padding:24px;color:#0A0A0B;">
  <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #0A0A0B;padding:24px;">
    <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8B8D95;">Concierge SLA monitor</div>
    <h2 style="margin:8px 0 16px 0;font-size:18px;font-weight:500;">${late.length} catalog letter${late.length === 1 ? '' : 's'} past ${slaDays}-working-day SLA</h2>
    <pre style="white-space:pre-wrap;background:#F7F7F4;border:1px solid #E1E1DD;padding:12px;font-size:12px;line-height:1.6;font-family:ui-monospace,Menlo,monospace;margin:0;">${lines.map(esc).join('\n')}</pre>
    <p style="margin:16px 0 0 0;color:#5A5C64;font-size:13px;line-height:1.55;">Clear with <code>pnpm --filter scanner audit:deliver</code>. Daily reminder until <code>deliveredAt</code> stamps.</p>
  </div>
</body></html>`;

  const result = await sendEmail({
    to: opsEmail,
    subject,
    html,
    text,
    tags: [{ name: 'kind', value: 'concierge-sla-alert' }],
  });

  return {
    undeliveredCount: undelivered.length,
    lateCount: late.length,
    slaWorkingDays: slaDays,
    alertSent: result.sent,
    alertId: result.id,
    alertReason: result.reason,
    to: opsEmail,
  };
}
