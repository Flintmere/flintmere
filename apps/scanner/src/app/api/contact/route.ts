import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ContactTopic } from '@/generated/prisma';
import { prisma } from '@/lib/db';
import {
  sendContactInternalEmail,
  sendContactConfirmationEmail,
} from '@/lib/contact-email';
import { inboxForTopic, ALL_TOPICS } from '@/lib/contact-routing';
import { checkContactRateLimit } from '@/lib/contact-rate-limit';
import { hashIp } from '@/lib/hash';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MIN_MESSAGE_LEN = 30;
const MAX_MESSAGE_LEN = 4000;
const MIN_PAGE_DWELL_MS = 3000;

const BodySchema = z.object({
  topic: z.enum(ALL_TOPICS as unknown as [ContactTopic, ...ContactTopic[]]),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  company: z.string().trim().max(160).optional().nullable(),
  shopifyDomain: z.string().trim().max(253).optional().nullable(),
  message: z.string().trim().min(MIN_MESSAGE_LEN).max(MAX_MESSAGE_LEN),
  // Honeypot — accepted by zod so the route can decide what to do, then
  // the explicit length check below sends the request to silent-drop.
  // (If we 422'd on a non-empty value here, scrapers would learn the
  // field is a tell.)
  website: z.string().optional().nullable(),
  // Time-on-page in ms before submit. Anything under MIN_PAGE_DWELL_MS is
  // treated as a bot. Sent as ms-since-mount, computed client-side.
  dwellMs: z.number().int().min(0).max(24 * 60 * 60 * 1000),
  // Caller-provided source label (e.g. "/security inline embed").
  source: z.string().trim().max(120).optional().nullable(),
});

export async function POST(req: NextRequest) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { ok: false, code: 'bad-request', message: 'Please complete every required field.' },
      { status: 422 },
    );
  }

  // Honeypot. Bots fill it; humans don't see it.
  if (body.website && body.website.length > 0) {
    return NextResponse.json(
      { ok: true, submissionId: 'silent', reason: 'honeypot' },
      { status: 200 },
    );
  }

  // Page dwell — too fast = scripted submit.
  if (body.dwellMs < MIN_PAGE_DWELL_MS) {
    return NextResponse.json(
      { ok: true, submissionId: 'silent', reason: 'dwell' },
      { status: 200 },
    );
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;

  const rate = checkContactRateLimit({ ip, email: body.email });
  if (!rate.ok) {
    return NextResponse.json(
      {
        ok: false,
        code: 'rate-limited',
        reason: rate.reason,
        retryAfterSec: rate.retryAfterSec,
        message:
          'Too many submissions. Please try again in a few minutes.',
      },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } },
    );
  }

  const routedTo = inboxForTopic(body.topic);
  const ipHash = hashIp(ip);
  const userAgent = req.headers.get('user-agent')?.slice(0, 500) ?? null;

  const submission = await prisma.contactMessage.create({
    data: {
      topic: body.topic,
      name: body.name,
      email: body.email,
      company: body.company || null,
      shopifyDomain: body.shopifyDomain || null,
      message: body.message,
      routedTo,
      source: body.source || null,
      ipHash,
      userAgent,
    },
  });

  // Fire both emails in parallel. We don't fail the request on email error —
  // the row is already persisted and the operator can re-send from /admin.
  const [internalResult, confirmationResult] = await Promise.allSettled([
    sendContactInternalEmail({
      to: routedTo,
      topic: body.topic,
      name: body.name,
      email: body.email,
      company: body.company || null,
      shopifyDomain: body.shopifyDomain || null,
      message: body.message,
      source: body.source || null,
      submissionId: submission.id,
    }),
    sendContactConfirmationEmail({
      to: body.email,
      name: body.name,
      topic: body.topic,
    }),
  ]);

  return NextResponse.json(
    {
      ok: true,
      submissionId: submission.id,
      internalSent:
        internalResult.status === 'fulfilled' && internalResult.value.sent,
      confirmationSent:
        confirmationResult.status === 'fulfilled' &&
        confirmationResult.value.sent,
    },
    { status: 201 },
  );
}
