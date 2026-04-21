/**
 * Concierge booking emails — customer confirmation + ops notification.
 * Fired from the Stripe webhook handler after payment_intent.succeeded.
 *
 * Copy rules (Copy Council #20 #21 #22 #37):
 *   - No operator / team language. John reviews personally.
 *   - Delivery window matches the report email promise (three working days).
 *   - Plain-language: no jargon, no "deliverables", no "remediation plan".
 *   - Bracket signature preserved on [ in ] moment.
 */

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

export interface ConciergeCustomerInput {
  to: string;
  shopUrl: string;
  calendlyUrl: string | null;
}

export async function sendConciergeCustomerEmail(
  input: ConciergeCustomerInput,
): Promise<SendEmailResult> {
  const { to, shopUrl, calendlyUrl } = input;
  const safeShop = esc(shopUrl);

  const optionalCallBlockHtml = calendlyUrl
    ? `<div style="margin-top:24px;padding:18px;border:1px solid #D5D2C8;">
         <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8B8D95;margin-bottom:6px;">Optional</div>
         <p style="margin:0 0 12px 0;font-size:14px;line-height:1.55;color:#141518;">Want to walk me through your store first? Book a 15-minute call — or skip it, I can work from the URL alone.</p>
         <a href="${esc(calendlyUrl)}" style="display:inline-block;color:#0A0A0B;font-family:ui-monospace,Menlo,monospace;font-size:12px;letter-spacing:0.04em;text-transform:uppercase;text-decoration:underline;">Book the 15-minute call →</a>
       </div>`
    : '';
  const optionalCallBlockText = calendlyUrl
    ? `\nOptional: Want to walk me through your store first? Book a 15-minute call — or skip it, I can work from the URL alone. ${calendlyUrl}\n`
    : '';

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#F7F7F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0A0A0B;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F7F4;padding:40px 16px;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #0A0A0B;">
          <tr>
            <td style="padding:28px 32px 8px 32px;border-bottom:1px solid #0A0A0B;">
              <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8B8D95;">Flintmere concierge audit · ${esc(shopUrl)}</div>
              <div style="margin-top:12px;font-size:26px;font-weight:500;letter-spacing:-0.02em;color:#0A0A0B;">
                You&rsquo;re <span style="font-family:ui-monospace,Menlo,monospace;font-weight:700;">[&nbsp;in&nbsp;]</span>. Payment confirmed.
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;">
              <p style="margin:0;font-size:16px;line-height:1.55;color:#141518;">Thanks for trusting me with this. Your £97 booking is confirmed.</p>
              <p style="margin:16px 0 0 0;font-size:16px;line-height:1.55;color:#141518;">Here&rsquo;s what happens next, in order:</p>
              <ol style="margin:12px 0 0 0;padding-left:20px;font-size:15px;line-height:1.6;color:#141518;">
                <li><strong>Today:</strong> I start the review of <strong>${safeShop}</strong>. I read every product, check the structured data, test how AI agents see your site.</li>
                <li><strong>Within three working days:</strong> you get a 15-minute video walkthrough and a prioritised list of exactly what to fix first, in plain English — no jargon, no 80-page PDF.</li>
                <li><strong>After that:</strong> reply with questions. I read every one.</li>
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

Thanks for trusting me with this. Your £97 booking is confirmed.

Here's what happens next, in order:

1. Today: I start the review of ${shopUrl}. I read every product, check
   the structured data, test how AI agents see your site.

2. Within three working days: you get a 15-minute video walkthrough and
   a prioritised list of exactly what to fix first, in plain English —
   no jargon, no 80-page PDF.

3. After that: reply with questions. I read every one.

If the shop URL above is wrong, just reply to this email and I'll fix it
before I start. Stripe has sent a separate receipt for your records.
${optionalCallBlockText}
— ${JOHN_SIGNATURE_NAME}, ${JOHN_SIGNATURE_TITLE}
${JOHN_SIGNATURE_REPLY_INVITE}

—
Flintmere is a trading name of Eazy Access Ltd · flintmere.com`;

  return sendEmail({
    to,
    subject: `You're in — Flintmere concierge audit for ${shopUrl}`,
    html,
    text,
    tags: [{ name: 'kind', value: 'concierge-customer' }],
  });
}

export interface ConciergeOpsInput {
  to: string;
  customerEmail: string;
  shopUrl: string;
  paymentIntentId: string;
}

export async function sendConciergeOpsEmail(
  input: ConciergeOpsInput,
): Promise<SendEmailResult> {
  const { to, customerEmail, shopUrl, paymentIntentId } = input;
  const stripeUrl = `https://dashboard.stripe.com/payments/${paymentIntentId}`;

  const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#F7F7F4;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #0A0A0B;padding:24px;">
    <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8B8D95;">New concierge booking</div>
    <h2 style="margin:8px 0 16px 0;font-size:20px;font-weight:500;">${esc(shopUrl)}</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;line-height:1.6;">
      <tr><td style="color:#5A5C64;width:140px;">Customer email</td><td style="font-family:ui-monospace,Menlo,monospace;">${esc(customerEmail)}</td></tr>
      <tr><td style="color:#5A5C64;">Shop URL</td><td style="font-family:ui-monospace,Menlo,monospace;">${esc(shopUrl)}</td></tr>
      <tr><td style="color:#5A5C64;">Payment intent</td><td style="font-family:ui-monospace,Menlo,monospace;"><a href="${esc(stripeUrl)}" style="color:#0A0A0B;">${esc(paymentIntentId)}</a></td></tr>
      <tr><td style="color:#5A5C64;">Booked at</td><td>${new Date().toISOString()}</td></tr>
    </table>
    <p style="margin:20px 0 0 0;font-size:13px;color:#5A5C64;line-height:1.55;">${esc(REPLY_SLA)} Delivery promise to the customer: video walkthrough + prioritised fix list within three working days.</p>
  </div>
</body></html>`;

  const text = `New concierge booking

Customer email:  ${customerEmail}
Shop URL:        ${shopUrl}
Payment intent:  ${paymentIntentId}
Stripe:          ${stripeUrl}
Booked at:       ${new Date().toISOString()}

${REPLY_SLA}
Delivery promise to the customer: video walkthrough + prioritised fix list within three working days.`;

  return sendEmail({
    to,
    subject: `New concierge booking — ${shopUrl}`,
    html,
    text,
    tags: [{ name: 'kind', value: 'concierge-ops' }],
  });
}
