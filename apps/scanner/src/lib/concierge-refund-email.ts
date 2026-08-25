/**
 * Operator alerts for catalog-letter refunds + disputes. Fired from the
 * Stripe webhook handler when `charge.refunded` or `charge.dispute.created`
 * lands on a charge whose linked PaymentIntent matches a row in
 * `scanner_concierge_audits`.
 *
 * Two refund severities — paid-then-refunded (normal customer remorse,
 * routine ops attention) versus delivered-then-refunded (someone refunded
 * a catalog letter we already shipped, immediate investigation). Disputes always
 * urgent — chargebacks have a 7–21 day response window with Stripe.
 *
 * Ops-only. No customer-facing copy here; the customer's bank handles
 * their refund notification automatically. Adding our own customer email
 * on top of that risks duplicate-receipt confusion + collapses two
 * accounting events (Stripe refund, our acknowledgement) into one
 * misread thread.
 */

import { bandBySlug, type AuditBandSlug } from './audit-pricing';
import { sendEmail, type SendEmailResult } from './resend';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtAmount(pence: number, currency: string): string {
  const symbol = currency.toLowerCase() === 'gbp' ? '£' : `${currency.toUpperCase()} `;
  return `${symbol}${(pence / 100).toFixed(2)}`;
}

export interface ConciergeRefundAlertInput {
  to: string;
  shopUrl: string;
  customerEmail: string;
  paymentIntentId: string;
  bandSlug: AuditBandSlug;
  amountRefundedPence: number;
  amountPence: number;
  currency: string;
  /** True when the refund covers the full charge; false on partial. */
  fullyRefunded: boolean;
  /** When true the catalog letter had already been delivered — needs investigation, not just acknowledgement. */
  wasDelivered: boolean;
}

export async function sendConciergeRefundOpsEmail(
  input: ConciergeRefundAlertInput,
): Promise<SendEmailResult> {
  const {
    to,
    shopUrl,
    customerEmail,
    paymentIntentId,
    bandSlug,
    amountRefundedPence,
    amountPence,
    currency,
    fullyRefunded,
    wasDelivered,
  } = input;

  const band = bandBySlug(bandSlug);
  const bandLabel = band?.label ?? bandSlug;
  const refundedAmount = fmtAmount(amountRefundedPence, currency);
  const chargeAmount = fmtAmount(amountPence, currency);

  const severity = wasDelivered
    ? 'DELIVERED catalog letter refunded — investigate'
    : fullyRefunded
      ? 'Catalog letter refunded'
      : 'Partial refund applied';

  const subject = `[Flintmere] ${severity}: ${shopUrl}`;

  const investigateBlock = wasDelivered
    ? `\n\nThis catalog letter was already marked DELIVERED before the refund landed. The deliverable + 30-day re-scan promise has already been spent. Reach out to the merchant to confirm the refund context (dissatisfaction? duplicate booking? other?) and decide whether to revoke the re-scan + de-list the artefacts.`
    : '';

  const text = `${severity}.

Shop:        ${shopUrl}
Customer:    ${customerEmail}
Band:        ${bandLabel}
Charge:      ${chargeAmount}
Refunded:    ${refundedAmount}${fullyRefunded ? ' (full)' : ' (partial)'}
PaymentIntent: ${paymentIntentId}

The scanner_concierge_audits row has been updated:
  - status: ${wasDelivered ? 'delivered (kept — refund-after-delivery is accounting, not status flip)' : 'refunded'}${investigateBlock}`;

  const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#F7F7F4;padding:24px;color:#0A0A0B;">
  <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #0A0A0B;padding:24px;">
    <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${wasDelivered ? '#A02020' : '#8B8D95'};">${esc(severity)}</div>
    <h2 style="margin:8px 0 16px 0;font-size:18px;font-weight:500;">${esc(shopUrl)} · ${esc(bandLabel)}</h2>
    <table style="border-collapse:collapse;font-size:13px;line-height:1.6;color:#141518;">
      <tr><td style="padding-right:16px;color:#5A5C64;">Customer</td><td><code>${esc(customerEmail)}</code></td></tr>
      <tr><td style="padding-right:16px;color:#5A5C64;">Charge</td><td>${esc(chargeAmount)}</td></tr>
      <tr><td style="padding-right:16px;color:#5A5C64;">Refunded</td><td>${esc(refundedAmount)}${fullyRefunded ? ' (full)' : ' (partial)'}</td></tr>
      <tr><td style="padding-right:16px;color:#5A5C64;">PaymentIntent</td><td><code>${esc(paymentIntentId)}</code></td></tr>
    </table>
    ${
      wasDelivered
        ? `<p style="margin:24px 0 0 0;padding:12px;background:#FFF5F5;border-left:3px solid #A02020;font-size:13px;line-height:1.6;color:#141518;">This catalog letter was already marked <strong>DELIVERED</strong> before the refund. The deliverable + 30-day re-scan promise has already been spent. Reach out to the merchant to confirm context and decide whether to revoke the re-scan.</p>`
        : ''
    }
  </div>
</body></html>`;

  return sendEmail({
    to,
    subject,
    html,
    text,
    tags: [
      { name: 'kind', value: 'concierge-refund-alert' },
      { name: 'severity', value: wasDelivered ? 'high' : 'normal' },
    ],
  });
}

export interface ConciergeDisputeAlertInput {
  to: string;
  shopUrl: string;
  customerEmail: string;
  paymentIntentId: string;
  bandSlug: AuditBandSlug;
  amountPence: number;
  currency: string;
  reason: string;
  evidenceDueBy: Date | null;
}

export async function sendConciergeDisputeOpsEmail(
  input: ConciergeDisputeAlertInput,
): Promise<SendEmailResult> {
  const {
    to,
    shopUrl,
    customerEmail,
    paymentIntentId,
    bandSlug,
    amountPence,
    currency,
    reason,
    evidenceDueBy,
  } = input;

  const band = bandBySlug(bandSlug);
  const bandLabel = band?.label ?? bandSlug;
  const chargeAmount = fmtAmount(amountPence, currency);
  const dueBy = evidenceDueBy
    ? evidenceDueBy.toISOString().slice(0, 10)
    : 'see Stripe Dashboard';

  const subject = `[Flintmere] DISPUTE opened: ${shopUrl} — evidence due ${dueBy}`;

  const text = `DISPUTE OPENED.

Shop:        ${shopUrl}
Customer:    ${customerEmail}
Band:        ${bandLabel}
Charge:      ${chargeAmount}
Reason:      ${reason}
Evidence due: ${dueBy}
PaymentIntent: ${paymentIntentId}

Stripe gives 7–21 days to submit evidence. Open the dispute in Stripe Dashboard, attach the catalog-letter deliverable + signed-off ConciergeAudit row + delivery email proof, and accept-or-contest before the deadline.

The scanner_concierge_audits row has been updated to status: 'disputed'.`;

  const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#F7F7F4;padding:24px;color:#0A0A0B;">
  <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #0A0A0B;padding:24px;">
    <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#A02020;">DISPUTE opened</div>
    <h2 style="margin:8px 0 16px 0;font-size:18px;font-weight:500;">${esc(shopUrl)} · ${esc(bandLabel)}</h2>
    <table style="border-collapse:collapse;font-size:13px;line-height:1.6;color:#141518;">
      <tr><td style="padding-right:16px;color:#5A5C64;">Customer</td><td><code>${esc(customerEmail)}</code></td></tr>
      <tr><td style="padding-right:16px;color:#5A5C64;">Charge</td><td>${esc(chargeAmount)}</td></tr>
      <tr><td style="padding-right:16px;color:#5A5C64;">Reason</td><td>${esc(reason)}</td></tr>
      <tr><td style="padding-right:16px;color:#5A5C64;">Evidence due</td><td><strong>${esc(dueBy)}</strong></td></tr>
      <tr><td style="padding-right:16px;color:#5A5C64;">PaymentIntent</td><td><code>${esc(paymentIntentId)}</code></td></tr>
    </table>
    <p style="margin:24px 0 0 0;padding:12px;background:#FFF5F5;border-left:3px solid #A02020;font-size:13px;line-height:1.6;color:#141518;">Stripe gives 7–21 days to submit evidence. Open the dispute in Dashboard, attach the catalog-letter deliverable + signed-off row + delivery email proof, and accept-or-contest before the deadline.</p>
  </div>
</body></html>`;

  return sendEmail({
    to,
    subject,
    html,
    text,
    tags: [
      { name: 'kind', value: 'concierge-dispute-alert' },
      { name: 'severity', value: 'high' },
    ],
  });
}
