/**
 * Orchestrator for a single outreach send.
 *
 * Inputs: target ID + kind ('initial' | 'followup').
 * Side effects (in order):
 *   1. Load the target. Skip if status disqualifies (already sent, bounced, etc).
 *   2. Check the unsubscribe table by recipient_email. If hit, flip status
 *      to 'unsubscribed' and short-circuit.
 *   3. Render via lib/outreach/template.ts.
 *   4. Sign the unsubscribe URL via lib/outreach/unsubscribe.ts.
 *   5. Call sendEmail() with team.flintmere.com From + Reply-To overrides
 *      AND the List-Unsubscribe + List-Unsubscribe-Post headers (RFC 8058).
 *   6. INSERT into scanner_outreach_sends; unique-violation on (target_id,
 *      kind) means a concurrent invocation already sent — return idempotent
 *      result, do NOT re-send.
 *   7. Update OutreachTarget status (sent → followed_up → … per state machine).
 *
 * Pre-send invariants enforced:
 *   - target.recipientEmail required
 *   - target.score / grade / productCount required (template depends on them)
 *   - target.firstName optional ("Hi there," fallback)
 */

import { sendEmail } from '../resend';
import { env } from '../env';
import { prisma } from '../db';
import { renderEmail, type SendKind, type TemplateInput } from './template';
import { buildUnsubscribeUrl } from './unsubscribe';
import { isUnsubscribed, recordUnsubscribe, OUTREACH_STATUS } from './db';
import type { OutreachTarget } from '../../generated/prisma';

export interface SendOutreachInput {
  targetId: string;
  kind: SendKind;
  /** Operator name for the body sign-off. Defaults to env OUTREACH_SENDER_NAME or 'Abu'. */
  senderName?: string;
  /** Skip the actual Resend call (still writes audit rows? no — pure preview). Used by scripts/send-outreach-batch.ts --dry-run. */
  dryRun?: boolean;
}

export type SendOutcome =
  | { ok: true; resendMessageId: string | null; idempotentReplay: boolean; status: string }
  | { ok: false; reason: string; status: string };

function readSenderName(input: SendOutreachInput): string {
  return input.senderName ?? process.env.OUTREACH_SENDER_NAME ?? 'Abu';
}

function readBaseUrl(): string {
  // env.NEXT_PUBLIC_APP_URL is the canonical site URL for prod, dev, preview.
  // Used to build absolute links in email bodies (rescan, audit, unsubscribe).
  return env.NEXT_PUBLIC_APP_URL;
}

function templateInputFromTarget(
  target: OutreachTarget,
  kind: SendKind,
  senderName: string,
  baseUrl: string,
): TemplateInput {
  if (!target.recipientEmail) {
    throw new Error(`Target ${target.id} has no recipient_email — cannot send`);
  }
  if (target.score == null || !target.grade || target.productCount == null) {
    throw new Error(
      `Target ${target.id} missing score/grade/product_count — enrich before send`,
    );
  }
  // rescanUrl: use the persisted column if set, else build from the canonical /scan path.
  const baseRescan =
    target.rescanUrl ?? `${baseUrl.replace(/\/+$/, '')}/scan?url=${encodeURIComponent(target.shopDomain)}`;
  const baseAudit = `${baseUrl.replace(/\/+$/, '')}/audit`;
  return {
    shopDomain: target.shopDomain,
    shopName: target.shopDomain,
    recipientFirstName: target.firstName,
    score: target.score,
    grade: target.grade,
    productCount: target.productCount,
    senderName,
    variant: (target.subjectVariant as 'A' | 'B') ?? 'A',
    rescanUrl: appendOutreachUtm(baseRescan, target, kind),
    auditUrl: appendOutreachUtm(baseAudit, target, kind),
    unsubscribeUrl: buildUnsubscribeUrl(target.id, baseUrl),
  };
}

/**
 * Append cohort attribution to an outbound link. Captured client-side by
 * Plausible on landing; the `t` param is the OutreachTarget id so we can
 * also attribute server-side from request headers when needed.
 *
 * Per `feedback_no_pii_in_url_params` the cuid `t` is not PII (no email,
 * no name) so it's safe to ride in the query string.
 */
function appendOutreachUtm(url: string, target: OutreachTarget, kind: SendKind): string {
  const u = new URL(url);
  u.searchParams.set('utm_source', 'outreach');
  u.searchParams.set('utm_medium', 'email');
  u.searchParams.set('utm_campaign', target.source);
  u.searchParams.set('utm_content', kind);
  u.searchParams.set('t', target.id);
  return u.toString();
}

export async function sendOutreach(input: SendOutreachInput): Promise<SendOutcome> {
  const target = await prisma.outreachTarget.findUnique({ where: { id: input.targetId } });
  if (!target) {
    return { ok: false, reason: 'target-not-found', status: 'error' };
  }
  if (!target.recipientEmail) {
    return { ok: false, reason: 'no-recipient-email', status: target.status };
  }

  // Status gates: don't double-send, don't send to disqualified statuses.
  const disqualified = new Set<string>([
    OUTREACH_STATUS.unsubscribed,
    OUTREACH_STATUS.bounced,
    OUTREACH_STATUS.dropped,
    OUTREACH_STATUS.replied,
  ]);
  if (disqualified.has(target.status)) {
    return { ok: false, reason: `status-${target.status}`, status: target.status };
  }
  if (input.kind === 'initial' && target.status !== OUTREACH_STATUS.queued) {
    return { ok: false, reason: `wrong-status-for-initial-${target.status}`, status: target.status };
  }
  if (input.kind === 'followup' && target.status !== OUTREACH_STATUS.sent) {
    return { ok: false, reason: `wrong-status-for-followup-${target.status}`, status: target.status };
  }

  // Defence in depth: re-check the unsubscribe table even though the
  // listener and CSV uploader keep status in sync. A race during a
  // batch run could otherwise send to a freshly-unsubscribed address.
  if (await isUnsubscribed(target.recipientEmail)) {
    await recordUnsubscribe(target.recipientEmail, 'manual');
    return { ok: false, reason: 'unsubscribed', status: OUTREACH_STATUS.unsubscribed };
  }

  const senderName = readSenderName(input);
  const baseUrl = readBaseUrl();
  const tplInput = templateInputFromTarget(target, input.kind, senderName, baseUrl);
  const rendered = renderEmail(input.kind, tplInput);

  if (input.dryRun) {
    return {
      ok: true,
      resendMessageId: null,
      idempotentReplay: false,
      status: target.status,
    };
  }

  // List-Unsubscribe header per RFC 8058 (one-click). Gmail and other
  // major mailbox providers parse this header and surface a native
  // "unsubscribe" affordance — the cleanest opt-out path. The mailto
  // is internal only (the `feedback_no_mailto_links_anywhere` memory
  // applies to public surfaces; this is a header-only spec compliance).
  // The mailto target lives on the SAME domain as the From — operator's
  // M365 tenant routes `unsubscribe@team.flintmere.com` to the shared
  // hello@team.flintmere.com mailbox via alias. Domain mismatch here
  // would downrank deliverability with strict mailbox providers.
  const headers = {
    'List-Unsubscribe': `<${tplInput.unsubscribeUrl}>, <mailto:unsubscribe@team.flintmere.com>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };

  const resendResult = await sendEmail({
    to: target.recipientEmail,
    from: env.RESEND_OUTREACH_FROM,
    replyTo: env.RESEND_OUTREACH_REPLY_TO,
    subject: rendered.subject,
    html: rendered.bodyHtml,
    text: rendered.bodyText,
    headers,
    tags: [
      { name: 'kind', value: 'outreach' },
      { name: 'send_kind', value: input.kind },
      { name: 'subject_variant', value: tplInput.variant ?? 'A' },
    ],
  });

  // Idempotent INSERT — unique on (target_id, kind). Race winner inserts;
  // race loser hits unique-violation and we treat as replay.
  try {
    await prisma.outreachSend.create({
      data: {
        targetId: target.id,
        kind: input.kind,
        subjectVariant: tplInput.variant ?? 'A',
        subject: rendered.subject,
        bodyHtml: rendered.bodyHtml,
        bodyText: rendered.bodyText,
        resendMessageId: resendResult.id,
        deliveryStatus: resendResult.sent ? 'sent' : 'failed',
        errorMessage: resendResult.sent ? null : resendResult.reason ?? 'unknown',
      },
    });
  } catch (err: unknown) {
    if (isUniqueViolation(err)) {
      return {
        ok: true,
        resendMessageId: resendResult.id,
        idempotentReplay: true,
        status: target.status,
      };
    }
    throw err;
  }

  // Advance the target's status. Initial → sent. Followup → followed_up.
  // Failures still write the OutreachSend row (audit trail) but the target
  // status only advances on Resend acceptance. Operator can re-queue.
  if (resendResult.sent) {
    const nextStatus =
      input.kind === 'initial' ? OUTREACH_STATUS.sent : OUTREACH_STATUS.followedUp;
    const sentAt = new Date();
    await prisma.outreachTarget.update({
      where: { id: target.id },
      data: {
        status: nextStatus,
        ...(input.kind === 'initial' ? { sentAt } : { followedUpAt: sentAt }),
      },
    });
  }

  return {
    ok: resendResult.sent,
    resendMessageId: resendResult.id,
    idempotentReplay: false,
    status: resendResult.sent
      ? input.kind === 'initial'
        ? OUTREACH_STATUS.sent
        : OUTREACH_STATUS.followedUp
      : target.status,
    ...(resendResult.sent ? {} : { reason: resendResult.reason ?? 'send-failed' }),
  } as SendOutcome;
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: unknown }).code === 'P2002'
  );
}
