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
import { conciergeEmailDeliverableLine } from './concierge-deliverable';
import {
  FOUNDER_SIGNATURE_IMAGE_URL,
  FOUNDER_SIGNATURE_NAME,
  FOUNDER_SIGNATURE_REPLY_INVITE,
  FOUNDER_SIGNATURE_TEAM_LINE,
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
 * Branches the deliverable-step wording on band scope. Used inside both
 * the HTML and plaintext customer email so the two stay in lockstep.
 *
 * Renders from `concierge-deliverable.ts` — single source of truth for
 * what the operator delivers. Drift between the email line and the
 * /catalog-letter deliverables list was the failure mode caught
 * 2026-05-09; this indirection enforces parity.
 */
function deliverableLineForBand(slug: AuditBandSlug): string {
  return conciergeEmailDeliverableLine(slug);
}

export interface ConciergeInvoiceLink {
  /** Customer-facing URL to view the hosted invoice. */
  hostedUrl: string;
  /** Direct PDF download URL. */
  pdfUrl: string;
  /** Stripe-assigned invoice number (e.g. "FLINT-0042"). */
  number: string;
}

export interface ConciergeCustomerInput {
  to: string;
  shopUrl: string;
  calendlyUrl: string | null;
  bandSlug: AuditBandSlug;
  /** Optional. When present, renders an "Invoice (PDF)" block above the
   * signature. When null/omitted, the email still ships — Stripe's auto
   * receipt covers the customer's records, and the operator can manually
   * issue an invoice from the Stripe Dashboard if asked. */
  invoice?: ConciergeInvoiceLink | null;
}

export async function sendConciergeCustomerEmail(
  input: ConciergeCustomerInput,
): Promise<SendEmailResult> {
  const { to, shopUrl, calendlyUrl, bandSlug, invoice } = input;
  const safeShop = esc(shopUrl);
  const band = bandBySlug(bandSlug);
  const priceLine = bandPriceLine(bandSlug);
  const bandLabel = band?.label ?? 'Band 1';
  const deliverableLine = deliverableLineForBand(bandSlug);
  const safeDeliverableHtml = esc(deliverableLine);

  const callFootnoteHtml = calendlyUrl
    ? `<p style="margin:18px 0 0 0;font-size:12px;line-height:1.55;color:#5A5C64;">Prefer voice? <a href="${esc(calendlyUrl)}" style="color:#0A0A0B;text-decoration:underline;">Book a quick call</a>.</p>`
    : '';
  const callFootnoteText = calendlyUrl
    ? `\nPrefer voice? Book a quick call: ${calendlyUrl}\n`
    : '';

  const invoiceBlockHtml = invoice
    ? `<tr>
            <td style="padding:0 32px 24px 32px;">
              <div style="padding:18px;border:1px solid #D5D2C8;background:#FAFAF8;">
                <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8B8D95;margin-bottom:8px;">Invoice · ${esc(invoice.number)}</div>
                <p style="margin:0 0 12px 0;font-size:14px;line-height:1.55;color:#141518;">A formal invoice is attached to your booking — full Eazy Access Ltd company details, line-item description, and statement-descriptor reference for your accounts team.</p>
                <p style="margin:0;font-size:14px;line-height:1.55;">
                  <a href="${esc(invoice.pdfUrl)}" style="color:#0A0A0B;text-decoration:underline;font-weight:500;">Download invoice (PDF) →</a>
                  &nbsp;·&nbsp;
                  <a href="${esc(invoice.hostedUrl)}" style="color:#5A5C64;text-decoration:underline;">View online</a>
                </p>
              </div>
            </td>
          </tr>`
    : '';
  const invoiceBlockText = invoice
    ? `\nInvoice ${invoice.number} (PDF): ${invoice.pdfUrl}\nView online: ${invoice.hostedUrl}\n`
    : '';

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#F7F7F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0A0A0B;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F7F4;padding:40px 16px;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #0A0A0B;">
          <tr>
            <td style="padding:32px 32px 12px 32px;border-bottom:1px solid #0A0A0B;">
              <div style="font-family:ui-monospace,Menlo,monospace;font-size:14px;letter-spacing:-0.01em;color:#0A0A0B;font-weight:500;">Flintmere&nbsp;]</div>
              <div style="margin-top:6px;margin-bottom:18px;width:48px;height:2px;background:#F8BF24;font-size:0;line-height:0;">&nbsp;</div>
              <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8B8D95;">Catalog Letter · ${esc(bandLabel)} · ${esc(shopUrl)}</div>
              <div style="margin-top:12px;font-size:26px;font-weight:500;letter-spacing:-0.02em;color:#0A0A0B;">
                You&rsquo;re <span style="font-family:ui-monospace,Menlo,monospace;font-weight:700;">[&nbsp;in&nbsp;]</span>. Payment confirmed.
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;">
              <p style="margin:0;font-size:16px;line-height:1.55;color:#141518;">Thanks for trusting us with this. Your ${esc(priceLine)} ${esc(bandLabel)} booking is confirmed.</p>
              <p style="margin:16px 0 0 0;font-size:16px;line-height:1.55;color:#141518;">Here&rsquo;s what happens next, in order:</p>
              <ol style="margin:12px 0 0 0;padding-left:20px;font-size:15px;line-height:1.6;color:#141518;">
                <li><strong>Today:</strong> the team starts reading <strong>${safeShop}</strong>. Every product, the structured data, how AI agents see your site.</li>
                <li><strong>Within three working days:</strong> ${safeDeliverableHtml}</li>
                <li><strong>Day 30:</strong> the scanner re-runs and emails you a progress report, so you know whether the fixes moved the score.</li>
                <li><strong>Any time:</strong> reply with questions. The team reads every one.</li>
              </ol>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px 32px;">
              <p style="margin:0;font-size:14px;line-height:1.55;color:#5A5C64;">If the shop URL above is wrong, just reply to this email and we&rsquo;ll fix it before the team starts. Stripe has sent a separate receipt for your records.</p>
              <div style="margin-top:24px;padding:18px;border:1px solid #D5D2C8;">
                <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8B8D95;margin-bottom:6px;">Optional · ~4 minutes</div>
                <p style="margin:0 0 8px 0;font-size:14px;line-height:1.55;color:#141518;">Want us to read all <strong>seven pillars</strong> instead of four? A read-only Shopify Admin token lets us measure your structured attributes, Google category mapping, and checkout readiness directly. Without it, those three pillars stay directional, not measured.</p>
                <p style="margin:0 0 8px 0;font-size:14px;line-height:1.55;color:#141518;">Create a private app in your Shopify admin (Settings → Apps and sales channels → Develop apps → Create app), tick the <code>read_products</code> + <code>read_product_listings</code> + <code>read_metafields</code> scopes, install it, copy the <code>shpat_</code> token. Paste at <a href="https://flintmere.com/secret" style="color:#0A0A0B;text-decoration:underline;">flintmere.com/secret</a> &mdash; encrypted in your browser, key never reaches us &mdash; and reply to this email with the URL it gives you. We click it once, the link burns, the token never sits in any inbox or log in plaintext.</p>
                <p style="margin:0;font-size:13px;line-height:1.55;color:#5A5C64;">Step-by-step with screenshots: <a href="https://help.shopify.com/en/manual/apps/app-types/custom-apps" style="color:#0A0A0B;text-decoration:underline;">Shopify Help Centre — create a custom app →</a></p>
              </div>
            </td>
          </tr>
          ${invoiceBlockHtml}
          <tr>
            <td style="padding:28px 32px 28px 32px;border-top:1px solid #D5D2C8;">
              ${
                FOUNDER_SIGNATURE_IMAGE_URL
                  ? `<img src="${esc(FOUNDER_SIGNATURE_IMAGE_URL)}" alt="${esc(FOUNDER_SIGNATURE_NAME)}" width="200" height="60" style="display:block;height:auto;width:200px;max-width:200px;margin:0 0 6px 0;">`
                  : `<div style="font-family:ui-monospace,Menlo,monospace;font-size:32px;font-weight:600;letter-spacing:-0.01em;color:#0A0A0B;margin:0 0 4px 0;">[&nbsp;${esc(FOUNDER_SIGNATURE_NAME)}&nbsp;]</div>`
              }
              <p style="margin:0;font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8B8D95;">${esc(FOUNDER_SIGNATURE_TEAM_LINE)}</p>
              <p style="margin:14px 0 0 0;font-size:13px;color:#8B8D95;line-height:1.55;">${esc(FOUNDER_SIGNATURE_REPLY_INVITE)}</p>
              ${callFootnoteHtml}
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

  const text = `Flintmere catalog letter — you're in. Payment confirmed.

Thanks for trusting us with this. Your ${priceLine} ${bandLabel} booking is confirmed.

Here's what happens next, in order:

1. Today: the team starts reading ${shopUrl}. Every product, the
   structured data, how AI agents see your site.

2. Within three working days: ${deliverableLine}

3. Day 30: the scanner re-runs and emails you a progress report, so
   you know whether the fixes moved the score.

4. Any time: reply with questions. The team reads every one.

If the shop URL above is wrong, just reply to this email and we'll fix
it before the team starts. Stripe has sent a separate receipt for your
records.${invoiceBlockText}

Optional (~4 minutes): for us to read all seven pillars instead of four,
create a read-only Shopify Admin token (Settings → Apps and sales
channels → Develop apps → Create app; scopes: read_products,
read_product_listings, read_metafields), paste it at
flintmere.com/secret — encrypted in your browser, key never reaches
us — and reply to this email with the URL it generates.

Step-by-step with screenshots:
https://help.shopify.com/en/manual/apps/app-types/custom-apps

[ ${FOUNDER_SIGNATURE_NAME} ]
${FOUNDER_SIGNATURE_TEAM_LINE}

${FOUNDER_SIGNATURE_REPLY_INVITE}
${callFootnoteText}
—
Flintmere is a trading name of Eazy Access Ltd · flintmere.com`;

  return sendEmail({
    to,
    subject: `You're in — your Flintmere catalog letter (${bandLabel}) for ${shopUrl}`,
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
  const deliverableLine = `${scopeLabel} — a 1,500-word letter + per-product CSV (worst ${worstN} fully drafted) + 30-day plan + GS1 UK path. 30-day re-scan included.`;

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
