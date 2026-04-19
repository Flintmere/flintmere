/**
 * Resend client singleton. One place imports the SDK.
 *
 * If RESEND_API_KEY is unset (dev / CI), send() becomes a no-op and returns
 * a synthetic id so downstream logic still works.
 */

import { Resend } from 'resend';

declare global {
  // eslint-disable-next-line no-var
  var __resend: Resend | null | undefined;
}

function client(): Resend | null {
  if (globalThis.__resend !== undefined) return globalThis.__resend;
  const key = process.env.RESEND_API_KEY;
  const instance = key ? new Resend(key) : null;
  globalThis.__resend = instance;
  return instance;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Optional headers (we use List-Unsubscribe for one-click PECR/GDPR compliance). */
  headers?: Record<string, string>;
  tags?: Array<{ name: string; value: string }>;
}

export interface SendEmailResult {
  id: string;
  sent: boolean;
  reason?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const resend = client();
  const from = process.env.RESEND_FROM_ADDRESS ?? 'Flintmere <hello@flintmere.com>';
  const replyTo = process.env.RESEND_REPLY_TO ?? 'hello@flintmere.com';

  if (!resend) {
    // eslint-disable-next-line no-console
    console.warn(
      JSON.stringify({
        event: 'resend-stub',
        reason: 'RESEND_API_KEY not configured; no email sent',
        to: input.to,
        subject: input.subject,
      }),
    );
    return {
      id: `stub-${Date.now()}`,
      sent: false,
      reason: 'RESEND_API_KEY missing',
    };
  }

  const result = await resend.emails.send({
    from,
    to: [input.to],
    replyTo,
    subject: input.subject,
    html: input.html,
    text: input.text,
    headers: input.headers,
    tags: input.tags,
  });

  if (result.error) {
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        event: 'resend-send-failed',
        to: input.to,
        subject: input.subject,
        error: result.error.message,
      }),
    );
    return {
      id: `failed-${Date.now()}`,
      sent: false,
      reason: result.error.message,
    };
  }

  return { id: result.data?.id ?? `sent-${Date.now()}`, sent: true };
}
