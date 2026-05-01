/**
 * Concierge booking emails — customer confirmation + ops notification.
 * Fired from the Stripe webhook handler after payment_intent.succeeded.
 *
 * Per ADR 0022 the deliverable depth scales with band — Band 1 worst-10,
 * Band 2 worst-25, Band 3 representative-sample worst-25. The email body
 * branches on `bandSlug` so the customer sees the deliverable they paid
 * for, not a band-1 default.
 *
 * Copy rules (Copy Council #20 #21 #22 #37):
 *   - Body copy uses "we" / "the team" per BUSINESS.md:19 customer-facing
 *     framing rule. The 1:1 email signature retains the named director
 *     (procurement-disclosure exception in the same rule).
 *   - Delivery window matches the report email promise (three working days).
 *   - Plain-language: no jargon, no "deliverables", no "remediation plan".
 *   - Bracket signature preserved on [ in ] moment.
 */

import { bandBySlug, bandPriceLine, type AuditBandSlug } from './audit-pricing';
import {
  JOHN_SIGNATURE_NAME,
  JOHN_SIGNATURE_REPLY_INVITE,
  JOHN_SIGNATURE_TITLE,
  REPLY_SLA,
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

/**
 * Branches the audit-step wording on band scope. Used inside both the
 * HTML and plaintext customer email so the two stay in lockstep.
 */
function deliverableLineForBand(slug: AuditBandSlug): string {
  const band = bandBySlug(slug);
  const worstN = band?.deliverable.fullyDraftedFixCount ?? 10;
  const isSample = band?.deliverable.auditScope === 'representative-sample';
  if (isSample) {
    return `you get a written audit letter, a per-product fix CSV (with the worst ${worstN} products drafted for you), a 30-day fix sequence, and the right GS1 UK barcode path. The audit reads a representative sample across your catalog patterns plus the structural data model. No video, no call — just the data.`;
  }
  return `you get a written audit letter, a per-product fix CSV (with the worst ${worstN} products drafted for you), a 30-day fix sequence, and the right GS1 UK barcode path. No video, no call — just the data.`;
}

export interface ConciergeCustomerInput {
  to: string;
  shopUrl: string;
  calendlyUrl: string | null;
  bandSlug: AuditBandSlug;
}

export async function sendConciergeCustomerEmail(
  input: ConciergeCustomerInput,
): Promise<SendEmailResult> {
  const { to, shopUrl, calendlyUrl, bandSlug } = input;
  const safeShop = esc(shopUrl);
  const band = bandBySlug(bandSlug);
  const priceLine = bandPriceLine(bandSlug);
  const bandLabel = band?.label ?? 'Band 1';
  const deliverableLine = deliverableLineForBand(bandSlug);
  const safeDeliverableHtml = esc(deliverableLine);

  const optionalCallBlockHtml = calendlyUrl
    ? `<div style="margin-top:24px;padding:18px;border:1px solid #D5D2C8;">
         <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8B8D95;margin-bottom:6px;">Optional</div>
         <p style="margin:0 0 12px 0;font-size:14px;line-height:1.55;color:#141518;">If it&rsquo;s easier, book a 15-minute call to walk me through the store. Most people skip this — the URL is all I need.</p>
         <a href="${esc(calendlyUrl)}" style="display:inline-block;color:#0A0A0B;font-family:ui-monospace,Menlo,monospace;font-size:12px;letter-spacing:0.04em;text-transform:uppercase;text-decoration:underline;">Book the 15-minute call →</a>
       </div>`
    : '';
  const optionalCallBlockText = calendlyUrl
    ? `\nOptional: if it's easier, book a 15-minute call to walk me through the store. Most people skip this — the URL is all I need. ${calendlyUrl}\n`
    : '';

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#F7F7F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0A0A0B;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F7F4;padding:40px 16px;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #0A0A0B;">
          <tr>
            <td style="padding:28px 32px 8px 32px;border-bottom:1px solid #0A0A0B;">
              <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8B8D95;">Flintmere concierge audit · ${esc(bandLabel)} · ${esc(shopUrl)}</div>
              <div style="margin-top:12px;font-size:26px;font-weight:500;letter-spacing:-0.02em;color:#0A0A0B;">
                You&rsquo;re <span style="font-family:ui-monospace,Menlo,monospace;font-weight:700;">[&nbsp;in&nbsp;]</span>. Payment confirmed.
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;">
              <p style="margin:0;font-size:16px;line-height:1.55;color:#141518;">Thanks for trusting me with this. Your ${esc(priceLine)} ${esc(bandLabel)} booking is confirmed.</p>
              <p style="margin:16px 0 0 0;font-size:16px;line-height:1.55;color:#141518;">Here&rsquo;s what happens next, in order:</p>
              <ol style="margin:12px 0 0 0;padding-left:20px;font-size:15px;line-height:1.6;color:#141518;">
                <li><strong>Today:</strong> I start reading <strong>${safeShop}</strong>. Every product, the structured data, how AI agents see your site.</li>
                <li><strong>Within three working days:</strong> ${safeDeliverableHtml}</li>
                <li><strong>Day 30:</strong> the scanner re-runs and emails you a progress report, so you know whether the fixes moved the score.</li>
                <li><strong>Any time:</strong> reply with questions. I read every one.</li>
              </ol>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px 32px;">
              <p style="margin:0;font-size:14px;line-height:1.55;color:#5A5C64;">If the shop URL above is wrong, just reply to this email and I&rsquo;ll fix it before I start. Stripe has sent a separate receipt for your records.</p>
              ${optionalCallBlockHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 24px 32px;border-top:1px solid #D5D2C8;">
              <p style="margin:0;font-size:15px;color:#141518;line-height:1.55;">— ${esc(JOHN_SIGNATURE_NAME)}, ${esc(JOHN_SIGNATURE_TITLE)}</p>
              <p style="margin:6px 0 0 0;font-size:13px;color:#8B8D95;line-height:1.55;">${esc(JOHN_SIGNATURE_REPLY_INVITE)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background:#0A0A0B;color:#A8AAB2;font-size:12px;line-height:1.55;">
              Flintmere is a trading name of Eazy Access Ltd · <a href="https://flintmere.com" style="color:#A8AAB2;text-decoration:underline;">flintmere.com</a>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = `Flintmere concierge audit — you're in. Payment confirmed.

Thanks for trusting me with this. Your ${priceLine} ${bandLabel} booking is confirmed.

Here's what happens next, in order:

1. Today: I start reading ${shopUrl}. Every product, the structured
   data, how AI agents see your site.

2. Within three working days: ${deliverableLine}

3. Day 30: the scanner re-runs and emails you a progress report, so
   you know whether the fixes moved the score.

4. Any time: reply with questions. I read every one.

If the shop URL above is wrong, just reply to this email and I'll fix it
before I start. Stripe has sent a separate receipt for your records.
${optionalCallBlockText}
— ${JOHN_SIGNATURE_NAME}, ${JOHN_SIGNATURE_TITLE}
${JOHN_SIGNATURE_REPLY_INVITE}

—
Flintmere is a trading name of Eazy Access Ltd · flintmere.com`;

  return sendEmail({
    to,
    subject: `You're in — Flintmere concierge audit (${bandLabel}) for ${shopUrl}`,
    html,
    text,
    tags: [
      { name: 'kind', value: 'concierge-customer' },
      { name: 'band', value: bandSlug },
    ],
  });
}

export interface ConciergeOpsInput {
  to: string;
  customerEmail: string;
  shopUrl: string;
  paymentIntentId: string;
  bandSlug: AuditBandSlug;
}

export async function sendConciergeOpsEmail(
  input: ConciergeOpsInput,
): Promise<SendEmailResult> {
  const { to, customerEmail, shopUrl, paymentIntentId, bandSlug } = input;
  const stripeUrl = `https://dashboard.stripe.com/payments/${paymentIntentId}`;
  const band = bandBySlug(bandSlug);
  const bandLabel = band?.label ?? 'Band 1';
  const skuRange = band?.skuRangeLabel ?? '—';
  const priceLine = bandPriceLine(bandSlug);
  const worstN = band?.deliverable.fullyDraftedFixCount ?? 10;
  const isSample = band?.deliverable.auditScope === 'representative-sample';
  const scopeLabel = isSample ? 'Representative-sample' : 'Full per-product';
  const deliverableLine = `${scopeLabel} audit + 1,500-word letter + per-product CSV (worst ${worstN} fully drafted) + 30-day plan + GS1 UK path. 30-day re-scan included.`;

  const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#F7F7F4;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #0A0A0B;padding:24px;">
    <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8B8D95;">New concierge booking · ${esc(bandLabel)}</div>
    <h2 style="margin:8px 0 16px 0;font-size:20px;font-weight:500;">${esc(shopUrl)}</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;line-height:1.6;">
      <tr><td style="color:#5A5C64;width:140px;">Band</td><td style="font-family:ui-monospace,Menlo,monospace;">${esc(bandLabel)} · ${esc(skuRange)} · ${esc(priceLine)}</td></tr>
      <tr><td style="color:#5A5C64;">Customer email</td><td style="font-family:ui-monospace,Menlo,monospace;">${esc(customerEmail)}</td></tr>
      <tr><td style="color:#5A5C64;">Shop URL</td><td style="font-family:ui-monospace,Menlo,monospace;">${esc(shopUrl)}</td></tr>
      <tr><td style="color:#5A5C64;">Payment intent</td><td style="font-family:ui-monospace,Menlo,monospace;"><a href="${esc(stripeUrl)}" style="color:#0A0A0B;">${esc(paymentIntentId)}</a></td></tr>
      <tr><td style="color:#5A5C64;">Booked at</td><td>${new Date().toISOString()}</td></tr>
    </table>
    <p style="margin:20px 0 0 0;font-size:13px;color:#5A5C64;line-height:1.55;">${esc(REPLY_SLA)} Delivery promise: ${esc(deliverableLine)} Within three working days.</p>
  </div>
</body></html>`;

  const text = `New concierge booking — ${bandLabel}

Band:            ${bandLabel} · ${skuRange} · ${priceLine}
Customer email:  ${customerEmail}
Shop URL:        ${shopUrl}
Payment intent:  ${paymentIntentId}
Stripe:          ${stripeUrl}
Booked at:       ${new Date().toISOString()}

${REPLY_SLA}
Delivery promise: ${deliverableLine} Within three working days.`;

  return sendEmail({
    to,
    subject: `New concierge booking — ${bandLabel} — ${shopUrl}`,
    html,
    text,
    tags: [
      { name: 'kind', value: 'concierge-ops' },
      { name: 'band', value: bandSlug },
    ],
  });
}
