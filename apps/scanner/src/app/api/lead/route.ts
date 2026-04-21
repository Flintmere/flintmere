import { NextRequest, NextResponse } from 'next/server';
import type { CompositeScore } from '@flintmere/scoring';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { buildReportEmail } from '@/lib/report-email';
import { sendEmail } from '@/lib/resend';
import { signUnsubToken } from '@/lib/unsub-token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const BodySchema = z.object({
  email: z.string().email(),
  scanId: z.string().min(1),
  consentedAt: z.string().datetime().optional(),
});

export async function POST(req: NextRequest) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { ok: false, code: 'bad-request', message: 'Invalid email.' },
      { status: 400 },
    );
  }

  const scan = await prisma.scan.findUnique({ where: { id: body.scanId } });
  if (!scan) {
    return NextResponse.json(
      { ok: false, code: 'scan-not-found', message: 'Unknown scan.' },
      { status: 404 },
    );
  }

  if (scan.status !== 'complete' || !scan.scoreJson) {
    return NextResponse.json(
      {
        ok: false,
        code: 'scan-not-ready',
        message: 'Scan has not completed yet. Try again shortly.',
      },
      { status: 409 },
    );
  }

  const email = body.email.trim().toLowerCase();

  const lead = await prisma.lead.create({
    data: {
      email,
      scanId: body.scanId,
      consentedAt: body.consentedAt ? new Date(body.consentedAt) : new Date(),
    },
  });

  const scannerUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://audit.flintmere.com';
  const marketingUrl =
    process.env.NEXT_PUBLIC_MARKETING_URL ?? 'https://flintmere.com';
  const token = signUnsubToken(lead.id);
  const unsubscribeUrl = `${scannerUrl}/api/unsubscribe/${token}`;
  const mail = buildReportEmail({
    score: scan.scoreJson as unknown as CompositeScore,
    unsubscribeUrl,
    appUrl: `${marketingUrl}/for/plus`,
    auditUrl: `${scannerUrl}/audit`,
    recipientEmail: email,
  });

  const send = await sendEmail({
    to: email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    headers: {
      'List-Unsubscribe': `<${unsubscribeUrl}>, <mailto:hello@flintmere.com?subject=unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
    tags: [
      { name: 'kind', value: 'scanner-report' },
      { name: 'scan_id', value: scan.id },
    ],
  });

  if (send.sent) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { reportSentAt: new Date() },
    });
  }

  return NextResponse.json(
    {
      ok: true,
      leadId: lead.id,
      reportSent: send.sent,
      reason: send.sent ? undefined : send.reason,
    },
    { status: 201 },
  );
}
