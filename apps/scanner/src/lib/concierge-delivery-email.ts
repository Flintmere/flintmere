/**
 * Concierge delivery email — sent at audit completion with the letter
 * PDF + per-product CSV attached. Fired from the `audit:deliver` script
 * after the team has finished writing.
 *
 * Voice: same neutral-bold register as the confirmation email. "We" /
 * "the team" in body copy per BUSINESS.md:19; named-director sign-off
 * because this is procurement-disclosure 1:1 communication.
 *
 * The body sets a single expectation: read the letter, work through the
 * CSV, reply with anything. Day 30 is mentioned but the re-scan email
 * (when shipped) will land separately so it doesn't get buried.
 */

import { bandBySlug, bandPriceLine, type AuditBandSlug } from './audit-pricing';
import {
  FOUNDER_SIGNATURE_IMAGE_URL,
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

export interface ConciergeDeliveryInput {
  to: string;
  shopUrl: string;
  bandSlug: AuditBandSlug;
  notes?: string;
  letterFilename: string;
  letterBuffer: Buffer;
  csvFilename: string;
  csvBuffer: Buffer;
  /**
   * ConciergeAudit row id. When present, the email includes the GMC
   * connect link `${NEXT_PUBLIC_APP_URL}/audit/connect?audit=${auditId}`
   * per ADR 0023 §slice 2b. The /audit/connect page renders either the
   * pre-verification request-access form (FEATURE_GMC_OAUTH=false) or
   * the live OAuth start (flag flipped post Google T&S verification);
   * the email link is identical across both states.
   */
  auditId?: string;
}

export async function sendConciergeDeliveryEmail(
  input: ConciergeDeliveryInput,
): Promise<SendEmailResult> {
  const {
    to,
    shopUrl,
    bandSlug,
    notes,
    letterFilename,
    letterBuffer,
    csvFilename,
    csvBuffer,
    auditId,
  } = input;
  const safeShop = esc(shopUrl);
  const band = bandBySlug(bandSlug);
  const priceLine = bandPriceLine(bandSlug);
  const bandLabel = band?.label ?? 'Band 1';
  const safeNotesHtml = notes
    ? `<p style="margin:16px 0 0 0;font-size:15px;line-height:1.6;color:#141518;">${esc(notes)}</p>`
    : '';
  const safeNotesText = notes ? `\n${notes}\n` : '';

  const connectUrl = auditId
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://audit.flintmere.com'}/audit/connect?audit=${encodeURIComponent(auditId)}`
    : null;
  const connectHtml = connectUrl
    ? `
          <tr>
            <td style="padding:0 32px 24px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #D5D2C8;border-left:3px solid #F8BF24;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0;font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8B8D95;">Optional · ground-truth track</p>
                    <p style="margin:8px 0 0 0;font-size:15px;line-height:1.55;color:#141518;">Connect Google Merchant Center and the next scan reads Google&rsquo;s real disapproval reasons direct from your account &mdash; not our model. Read-only. Disconnect anytime.</p>
                    <p style="margin:12px 0 0 0;font-size:14px;line-height:1.55;"><a href="${esc(connectUrl)}" style="color:#0A0A0B;text-decoration:underline;">Connect Google Merchant Center &rarr;</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
    : '';
  const connectText = connectUrl
    ? `\nOptional — Connect Google Merchant Center so the next scan reads Google's real disapproval reasons direct from your account, not our model. Read-only, disconnect anytime:\n${connectUrl}\n`
    : '';

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#F7F7F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0A0A0B;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F7F4;padding:40px 16px;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #0A0A0B;">
          <tr>
            <td style="padding:28px 32px 8px 32px;border-bottom:1px solid #0A0A0B;">
              <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8B8D95;">Flintmere concierge audit · ${esc(bandLabel)} · ${safeShop}</div>
              <div style="margin-top:12px;font-size:26px;font-weight:500;letter-spacing:-0.02em;color:#0A0A0B;">
                Your audit&rsquo;s <span style="font-family:ui-monospace,Menlo,monospace;font-weight:700;">[&nbsp;in&nbsp;]</span>.
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;">
              <p style="margin:0;font-size:16px;line-height:1.6;color:#141518;">Two attachments on this email — the letter and the per-product CSV. The letter walks you through what we found and what to fix in priority order. The CSV is your working document: every product flagged, with the worst offenders pre-drafted in the <em>suggested fix</em> column.</p>
              <p style="margin:16px 0 0 0;font-size:16px;line-height:1.6;color:#141518;">Read the letter first. Work through the CSV second. Anything in either that needs clarifying, reply direct.</p>
              ${safeNotesHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px 32px;">
              <p style="margin:0;font-size:14px;line-height:1.55;color:#5A5C64;">In thirty days the scanner re-runs against ${safeShop} and emails you a progress report — what moved, what didn&rsquo;t. No further action from you.</p>
            </td>
          </tr>${connectHtml}
          <tr>
            <td style="padding:28px 32px 28px 32px;border-top:1px solid #D5D2C8;">
              ${
                FOUNDER_SIGNATURE_IMAGE_URL
                  ? `<img src="${esc(FOUNDER_SIGNATURE_IMAGE_URL)}" alt="${esc(FOUNDER_SIGNATURE_NAME)}" width="200" height="60" style="display:block;height:auto;width:200px;max-width:200px;margin:0 0 6px 0;">`
                  : `<div style="font-family:ui-monospace,Menlo,monospace;font-size:32px;font-weight:600;letter-spacing:-0.01em;color:#0A0A0B;margin:0 0 4px 0;">[&nbsp;${esc(FOUNDER_SIGNATURE_NAME)}&nbsp;]</div>`
              }
              <p style="margin:0;font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8B8D95;">${esc(FOUNDER_SIGNATURE_TEAM_LINE)}</p>
              <p style="margin:14px 0 0 0;font-size:13px;color:#8B8D95;line-height:1.55;">${esc(FOUNDER_SIGNATURE_REPLY_INVITE)}</p>
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

  const text = `Your Flintmere concierge audit — ${bandLabel} (${priceLine}) for ${shopUrl}.

Two attachments on this email: the letter and the per-product CSV.

The letter walks you through what we found and what to fix in priority
order. The CSV is your working document — every product flagged, with the
worst offenders pre-drafted in the "suggested fix" column.

Read the letter first. Work through the CSV second. Anything in either
that needs clarifying, reply direct.
${safeNotesText}
In thirty days the scanner re-runs against ${shopUrl} and emails you a
progress report — what moved, what didn't. No further action from you.
${connectText}
[ ${FOUNDER_SIGNATURE_NAME} ]
${FOUNDER_SIGNATURE_TEAM_LINE}

${FOUNDER_SIGNATURE_REPLY_INVITE}

—
Flintmere is a trading name of Eazy Access Ltd · flintmere.com`;

  return sendEmail({
    to,
    subject: `Your Flintmere audit — ${shopUrl}`,
    html,
    text,
    attachments: [
      { filename: letterFilename, content: letterBuffer },
      { filename: csvFilename, content: csvBuffer },
    ],
    tags: [
      { name: 'kind', value: 'concierge-delivery' },
      { name: 'band', value: bandSlug },
    ],
  });
}
