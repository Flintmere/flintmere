/**
 * Contact-form emails — internal ops notification + sender confirmation.
 *
 * Two builders so the route handler can fire both in parallel via Promise.all.
 * Hex literals hoisted as named consts at top of file (Stripe/email clients
 * reject CSS vars; same convention as report-email.ts and concierge-email.ts).
 */

import {
  FOUNDER_SIGNATURE_NAME,
  FOUNDER_SIGNATURE_TEAM_LINE,
  REPLY_SLA,
} from './copy';
import { labelForTopic } from './contact-routing';
import { sendEmail, type SendEmailResult } from './resend';
import type { ContactTopic } from '@/generated/prisma';

const INK = '#141518';
const PAPER = '#F7F4EE';
const MUTE = '#8B8D95';
const LINE = '#D5D2C8';
const AMBER = '#F8BF24';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface ContactInternalInput {
  to: string;
  topic: ContactTopic;
  name: string;
  email: string;
  company: string | null;
  shopifyDomain: string | null;
  message: string;
  source: string | null;
  submissionId: string;
}

export async function sendContactInternalEmail(
  input: ContactInternalInput,
): Promise<SendEmailResult> {
  const topicLabel = labelForTopic(input.topic);
  const subject = `[contact:${input.topic}] ${input.name} — ${topicLabel}`;

  const rows: Array<[string, string]> = [
    ['Topic', topicLabel],
    ['From', `${input.name} <${input.email}>`],
  ];
  if (input.company) rows.push(['Company', input.company]);
  if (input.shopifyDomain) rows.push(['Shopify domain', input.shopifyDomain]);
  if (input.source) rows.push(['Submitted from', input.source]);
  rows.push(['Submission id', input.submissionId]);

  const rowsHtml = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:${MUTE};font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;vertical-align:top;">${esc(k)}</td><td style="padding:6px 0;color:${INK};font-size:14px;line-height:1.55;">${esc(v)}</td></tr>`,
    )
    .join('');

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:${PAPER};color:${INK};font-family:-apple-system,BlinkMacSystemFont,'Geist Sans','Inter',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid ${LINE};padding:28px;">
  <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${MUTE};margin-bottom:6px;">Contact form</div>
  <h1 style="margin:0 0 18px 0;font-size:20px;line-height:1.3;color:${INK};font-weight:600;">${esc(topicLabel)} from ${esc(input.name)}</h1>
  <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">${rowsHtml}</table>
  <div style="border-top:1px solid ${LINE};padding-top:18px;">
    <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${MUTE};margin-bottom:8px;">Message</div>
    <div style="font-size:14px;line-height:1.6;color:${INK};white-space:pre-wrap;">${esc(input.message)}</div>
  </div>
  <div style="margin-top:24px;padding-top:18px;border-top:1px solid ${LINE};font-size:12px;color:${MUTE};">
    Reply directly to this email to respond. The sender already has a confirmation that we&rsquo;ll reply within two working days.
  </div>
</div>
</body></html>`;

  const textRows = rows
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  const text = `New contact-form submission — ${topicLabel}\n\n${textRows}\n\nMessage:\n${input.message}\n\nReply directly to this email to respond.`;

  return sendEmail({
    to: input.to,
    subject,
    html,
    text,
    headers: {
      'Reply-To': `${input.name} <${input.email}>`,
    },
    tags: [
      { name: 'kind', value: 'contact-internal' },
      { name: 'topic', value: input.topic },
    ],
  });
}

export interface ContactConfirmationInput {
  to: string;
  name: string;
  topic: ContactTopic;
}

export async function sendContactConfirmationEmail(
  input: ContactConfirmationInput,
): Promise<SendEmailResult> {
  const topicLabel = labelForTopic(input.topic);
  const subject = `We got your message — ${topicLabel}`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:${PAPER};color:${INK};font-family:-apple-system,BlinkMacSystemFont,'Geist Sans','Inter',Arial,sans-serif;">
<div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid ${LINE};padding:32px;">
  <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${MUTE};margin-bottom:8px;">Flintmere</div>
  <h1 style="margin:0 0 16px 0;font-size:22px;line-height:1.3;color:${INK};font-weight:600;">Thanks, ${esc(input.name)}.</h1>
  <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:${INK};">We received your <span style="font-family:ui-monospace,Menlo,monospace;border:1px solid ${INK};padding:0 6px;font-size:13px;">[ ${esc(topicLabel)} ]</span> message.</p>
  <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:${INK};">${esc(REPLY_SLA)}</p>
  <p style="margin:0 0 0 0;font-size:14px;line-height:1.6;color:${MUTE};">If your enquiry is urgent or you don&rsquo;t hear back, just reply to this email and we&rsquo;ll bump it.</p>
  <div style="margin-top:28px;padding-top:18px;border-top:1px solid ${LINE};">
    <div style="font-size:14px;line-height:1.55;color:${INK};font-weight:500;">${esc(FOUNDER_SIGNATURE_NAME)}</div>
    <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${MUTE};margin-top:2px;">${esc(FOUNDER_SIGNATURE_TEAM_LINE)}</div>
    <div style="margin-top:14px;height:2px;width:48px;background:${AMBER};"></div>
  </div>
</div>
</body></html>`;

  const text = `Thanks, ${input.name}.

We received your [ ${topicLabel} ] message. ${REPLY_SLA}

If your enquiry is urgent or you don't hear back, just reply to this email and we'll bump it.

${FOUNDER_SIGNATURE_NAME}
${FOUNDER_SIGNATURE_TEAM_LINE}`;

  return sendEmail({
    to: input.to,
    subject,
    html,
    text,
    tags: [
      { name: 'kind', value: 'contact-confirmation' },
      { name: 'topic', value: input.topic },
    ],
  });
}
