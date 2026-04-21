/**
 * Concierge booking emails — customer confirmation + ops notification.
 * Fired from the Stripe webhook handler after checkout.session.completed.
 */

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
  const kickoffBlockHtml = calendlyUrl
    ? `<a href="${esc(calendlyUrl)}" style="display:inline-block;background:#F8BF24;color:#0A0A0B;padding:14px 24px;border:1px solid #F8BF24;font-family:ui-monospace,Menlo,monospace;font-size:13px;font-weight:500;letter-spacing:0.04em;text-transform:uppercase;text-decoration:none;">Book your kickoff call →</a>`
    : `<p style="margin:0;font-size:14px;color:#5A5C64;">We&rsquo;ll email you to schedule the 15-minute kickoff call.</p>`;
  const kickoffBlockText = calendlyUrl
    ? `Book your 15-minute kickoff call: ${calendlyUrl}`
    : `We'll email you to schedule the 15-minute kickoff call.`;

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#F7F7F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0A0A0B;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F7F4;padding:40px 16px;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #0A0A0B;">
          <tr>
            <td style="padding:28px 32px 8px 32px;border-bottom:1px solid #0A0A0B;">
              <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8B8D95;">Flintmere concierge audit</div>
              <div style="margin-top:12px;font-size:26px;font-weight:500;letter-spacing:-0.02em;color:#0A0A0B;">
                You&rsquo;re <span style="font-family:ui-monospace,Menlo,monospace;font-weight:700;">[&nbsp;in&nbsp;]</span>. Payment confirmed.
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;">
              <p style="margin:0;font-size:16px;line-height:1.55;color:#141518;">Thanks — your £97 booking is confirmed. A Flintmere operator will email you within 2 hours to scope the audit for <strong>${safeShop}</strong>.</p>
              <p style="margin:16px 0 0 0;font-size:16px;line-height:1.55;color:#141518;">Your full audit + 30-day remediation plan lands in your inbox inside 48 hours of the kickoff call.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px 32px;">
              <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8B8D95;margin-bottom:12px;">Next step</div>
              ${kickoffBlockHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #D5D2C8;">
              <p style="margin:0;font-size:13px;color:#5A5C64;line-height:1.55;">Reply to this email if the shop URL above is wrong or if you want to brief us before the call. Stripe has sent a separate receipt for your records.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#0A0A0B;color:#A8AAB2;font-size:12px;line-height:1.55;">
              Flintmere Ltd · London · <a href="https://flintmere.com" style="color:#A8AAB2;text-decoration:underline;">flintmere.com</a>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = `Flintmere concierge audit — payment confirmed

Thanks — your £97 booking is confirmed. A Flintmere operator will email you within 2 hours to scope the audit for ${shopUrl}.

Your full audit + 30-day remediation plan lands in your inbox inside 48 hours of the kickoff call.

${kickoffBlockText}

Reply to this email if the shop URL above is wrong or if you want to brief us before the call. Stripe has sent a separate receipt for your records.

—
Flintmere Ltd · London · flintmere.com`;

  return sendEmail({
    to,
    subject: 'Flintmere concierge audit — you\'re booked',
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
    <p style="margin:20px 0 0 0;font-size:13px;color:#5A5C64;line-height:1.55;">Reach out within 2 hours per the confirmation email promise. Customer already has the Cal.com kickoff link.</p>
  </div>
</body></html>`;

  const text = `New concierge booking

Customer email:  ${customerEmail}
Shop URL:        ${shopUrl}
Payment intent:  ${paymentIntentId}
Stripe:          ${stripeUrl}
Booked at:       ${new Date().toISOString()}

Reach out within 2 hours per the confirmation email promise.
Customer already has the Cal.com kickoff link.`;

  return sendEmail({
    to,
    subject: `New concierge booking — ${shopUrl}`,
    html,
    text,
    tags: [{ name: 'kind', value: 'concierge-ops' }],
  });
}
