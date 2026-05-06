/**
 * Day-30 re-scan email — composed after `runDay30Rescans()` has run a
 * fresh scan against a delivered audit's shop and persisted the result
 * onto the ConciergeAudit row. Compares the baseline (captured at
 * delivery time per Slice A) against the fresh scan and tells the
 * merchant whether the fixes moved the score.
 *
 * Subject:
 *   "Day-30 re-scan: shopUrl — score moved from {baselineGrade} to
 *   {currentGrade}"  when the grade changed
 *   "Day-30 re-scan: shopUrl — score held at {grade}"
 *   when the grade is the same
 *
 * Body: short and scannable. Score change → top pillar movements (max 3)
 * → CTA back to /score/[shop] for the fresh dashboard. Same neutral-bold
 * register as the delivery email; named-director sign-off because this
 * is post-purchase 1:1 communication.
 */

import {
  FOUNDER_SIGNATURE_NAME,
  FOUNDER_SIGNATURE_REPLY_INVITE,
  FOUNDER_SIGNATURE_TEAM_LINE,
} from './copy';
import { sendEmail, type SendEmailResult } from './resend';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface PersistedScoreShape {
  score?: number;
  grade?: string;
  pillars?: Array<{ pillar: string; score: number; maxScore: number }>;
}

export interface Day30RescanEmailInput {
  to: string;
  shopUrl: string;
  rescanScanId: string;
  baseline: PersistedScoreShape;
  current: PersistedScoreShape;
  scannerOrigin: string;
}

interface PillarMovement {
  pillar: string;
  baseline: number;
  current: number;
  delta: number;
}

function topPillarMovements(
  baseline: PersistedScoreShape,
  current: PersistedScoreShape,
  limit = 3,
): PillarMovement[] {
  const baselinePillars = baseline.pillars ?? [];
  const currentPillars = current.pillars ?? [];
  const baselineByName = new Map(baselinePillars.map((p) => [p.pillar, p]));
  const movements: PillarMovement[] = [];
  for (const cur of currentPillars) {
    const base = baselineByName.get(cur.pillar);
    if (!base) continue;
    const delta = cur.score - base.score;
    if (delta === 0) continue;
    movements.push({
      pillar: cur.pillar,
      baseline: base.score,
      current: cur.score,
      delta,
    });
  }
  movements.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return movements.slice(0, limit);
}

function pillarLabel(pillar: string): string {
  // Mirror copy.ts pillarLabelCustomerFacing without importing it
  // (avoids a circular if copy.ts grows email helpers later).
  switch (pillar) {
    case 'identifiers':
      return 'Product IDs';
    case 'attributes':
      return 'Structured Attributes';
    case 'titles':
      return 'Title & Description Quality';
    case 'mapping':
      return 'Google Category Match';
    case 'consistency':
      return 'Data Consistency';
    case 'checkout-eligibility':
      return 'Agent Checkout Readiness';
    case 'crawlability':
      return 'AI Agent Access';
    default:
      return pillar;
  }
}

export function composeDay30RescanSubject(args: {
  shopUrl: string;
  baselineGrade: string | undefined;
  currentGrade: string | undefined;
}): string {
  const { shopUrl, baselineGrade, currentGrade } = args;
  if (!baselineGrade || !currentGrade) {
    return `Day-30 re-scan: ${shopUrl}`;
  }
  if (baselineGrade === currentGrade) {
    return `Day-30 re-scan: ${shopUrl} — score held at ${currentGrade}`;
  }
  return `Day-30 re-scan: ${shopUrl} — score moved from ${baselineGrade} to ${currentGrade}`;
}

export async function sendDay30RescanEmail(
  input: Day30RescanEmailInput,
): Promise<SendEmailResult> {
  const { to, shopUrl, rescanScanId, baseline, current, scannerOrigin } = input;
  const baselineScore = baseline.score;
  const baselineGrade = baseline.grade;
  const currentScore = current.score;
  const currentGrade = current.grade;
  const movements = topPillarMovements(baseline, current);

  const safeShop = esc(shopUrl);
  const subject = composeDay30RescanSubject({
    shopUrl,
    baselineGrade,
    currentGrade,
  });

  const scoreChangeText =
    typeof baselineScore === 'number' && typeof currentScore === 'number'
      ? currentScore === baselineScore
        ? `Score: ${currentScore} (no change)`
        : currentScore > baselineScore
          ? `Score: ${baselineScore} → ${currentScore} (+${currentScore - baselineScore})`
          : `Score: ${baselineScore} → ${currentScore} (${currentScore - baselineScore})`
      : `Re-scan complete`;

  const movementsHtml = movements.length
    ? `<ul style="margin:16px 0;padding-left:20px;font-size:15px;line-height:1.6;color:#141518;">${movements
        .map((m) => {
          const sign = m.delta > 0 ? '+' : '';
          const label = esc(pillarLabel(m.pillar));
          return `<li>${label}: ${m.baseline} → ${m.current} (${sign}${m.delta})</li>`;
        })
        .join('')}</ul>`
    : '';

  const movementsText = movements.length
    ? '\n\n' +
      movements
        .map((m) => {
          const sign = m.delta > 0 ? '+' : '';
          return `- ${pillarLabel(m.pillar)}: ${m.baseline} → ${m.current} (${sign}${m.delta})`;
        })
        .join('\n')
    : '';

  const dashboardUrl = `${scannerOrigin}/score/${encodeURIComponent(rescanScanId)}`;

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#F7F7F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0A0A0B;">
    <div style="max-width:560px;margin:0 auto;padding:32px 24px;background:#FFFFFF;border:1px solid #0A0A0B;">
      <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8B8D95;">Day-30 re-scan</div>
      <h1 style="margin:8px 0 16px 0;font-size:22px;font-weight:500;line-height:1.3;">${esc(scoreChangeText)}</h1>
      <p style="margin:0 0 8px 0;font-size:15px;line-height:1.6;color:#141518;">We re-ran the scanner on ${safeShop} 30 days after delivering your audit. Here's what shifted.</p>
      ${movementsHtml}
      <p style="margin:24px 0 0 0;font-size:15px;line-height:1.6;color:#141518;">The fresh dashboard with every product-level finding lives at:</p>
      <p style="margin:8px 0 0 0;"><a href="${dashboardUrl}" style="color:#0A0A0B;text-decoration:underline;font-family:ui-monospace,Menlo,monospace;font-size:13px;">${esc(dashboardUrl)}</a></p>
      <p style="margin:32px 0 0 0;font-size:14px;line-height:1.6;color:#5A5C64;">${esc(FOUNDER_SIGNATURE_REPLY_INVITE)}</p>
      <p style="margin:16px 0 0 0;font-size:15px;line-height:1.4;color:#0A0A0B;">${esc(FOUNDER_SIGNATURE_NAME)}<br/><span style="color:#8B8D95;font-size:13px;">${esc(FOUNDER_SIGNATURE_TEAM_LINE)}</span></p>
    </div>
  </body>
</html>`;

  const text = `${scoreChangeText}\n\nWe re-ran the scanner on ${shopUrl} 30 days after delivering your audit. Here's what shifted.${movementsText}\n\nThe fresh dashboard with every product-level finding:\n${dashboardUrl}\n\n${FOUNDER_SIGNATURE_REPLY_INVITE}\n\n${FOUNDER_SIGNATURE_NAME}\n${FOUNDER_SIGNATURE_TEAM_LINE}`;

  return sendEmail({
    to,
    subject,
    html,
    text,
    tags: [{ name: 'kind', value: 'day-30-rescan' }],
  });
}
