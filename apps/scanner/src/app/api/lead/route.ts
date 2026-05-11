import { NextRequest, NextResponse } from 'next/server';
import type { CompositeScore } from '@flintmere/scoring';
import { z } from 'zod';
import { Prisma } from '@/generated/prisma';
import { checkAntiBot } from '@/lib/anti-bot';
import { prisma } from '@/lib/db';
import { checkLeadRateLimit } from '@/lib/rate-limit';
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
  // Anti-bot signals from <Honeypot/>. Optional so dev tooling round-trips.
  website: z.string().optional().nullable(),
  dwellMs: z.number().int().min(0).max(24 * 60 * 60 * 1000).optional().nullable(),
});

export async function POST(req: NextRequest) {
  // Per-IP rate limit (added 2026-05-09 pre-launch audit P1-5). Without
  // this, anyone with a valid scanId UUID can spray emails — burning
  // Resend quota + salting the lead list with addresses the merchant
  // didn't enter. The DB (email, scanId) unique index prevents row
  // duplication but not the spray.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const rl = checkLeadRateLimit({ ip });
  if (!rl.ok) {
    return NextResponse.json(
      {
        ok: false,
        code: 'rate-limited',
        message: `Too many requests. Try again in ${rl.retryAfterSec} seconds.`,
      },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfterSec) },
      },
    );
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { ok: false, code: 'bad-request', message: 'Invalid email.' },
      { status: 400 },
    );
  }

  // Anti-bot silent-drop. Mirror the success envelope so the bot thinks
  // the lead was captured and the report queued — it can't distinguish
  // this from the real terminal state. Humans can't trip this (real
  // users take >3s to type an email after the post-scan view loads).
  const antiBot = checkAntiBot({
    website: body.website,
    dwellMs: body.dwellMs ?? null,
  });
  if (!antiBot.ok) {
    return NextResponse.json(
      { ok: true, leadId: 'silent', reportSent: false, alreadyRegistered: true },
      { status: 200 },
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

  // Idempotent insert. The unique (email, scan_id) index makes a repeat POST
  // return the original row — same lead id, no duplicate row, no second
  // report send. We don't expose this to the caller as a "duplicate" error
  // because the user's intent (receive their report) is already satisfied
  // and surfacing 409 would invite scripted retries.
  let lead;
  let alreadyRegistered = false;
  try {
    lead = await prisma.lead.create({
      data: {
        email,
        scanId: body.scanId,
        consentedAt: body.consentedAt ? new Date(body.consentedAt) : new Date(),
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      const existing = await prisma.lead.findUnique({
        where: { email_scanId: { email, scanId: body.scanId } },
      });
      if (!existing) throw err;
      lead = existing;
      alreadyRegistered = true;
    } else {
      throw err;
    }
  }

  // The original POST already triggered a send (or recorded the failure
  // reason). Don't re-send on a repeat; report status from the existing row.
  if (alreadyRegistered) {
    return NextResponse.json(
      {
        ok: true,
        leadId: lead.id,
        reportSent: lead.reportSentAt !== null,
        alreadyRegistered: true,
      },
      { status: 200 },
    );
  }

  const scannerUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://audit.flintmere.com';
  const marketingUrl =
    process.env.NEXT_PUBLIC_MARKETING_URL ?? 'https://flintmere.com';
  const token = signUnsubToken(lead.id);
  const unsubscribeUrl = `${scannerUrl}/api/unsubscribe/${token}`;
  const persistedScoreJson = scan.scoreJson as unknown as CompositeScore & {
    gmcGroundTruth?: import('@/lib/gmc/types').GmcGroundTruth | null;
  };
  const mail = buildReportEmail({
    score: persistedScoreJson,
    unsubscribeUrl,
    appUrl: marketingUrl,
    auditUrl: `${scannerUrl}/audit`,
    recipientEmail: email,
    gmcGroundTruth: persistedScoreJson.gmcGroundTruth ?? null,
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
