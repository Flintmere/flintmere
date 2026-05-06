import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { normaliseShopDomain } from '@/lib/gmc/oauth';

// Per ADR 0023 §slice 2b — pre-verification waiting list capture.
// Receives the request when a paid audit's owner clicks the connect
// link from their delivery email during the FEATURE_GMC_OAUTH=false
// window. We look up the audit by id (the link-from-email is the
// auth gate — only paid customers receive a real audit id), insert
// a row in scanner_gmc_access_requests, and return ok.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  auditId: z.string().min(1),
  email: z.string().email(),
  shopUrl: z.string().min(4).max(512),
  reason: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { ok: false, code: 'bad-request', message: 'Invalid request.' },
      { status: 400 },
    );
  }

  const audit = await prisma.conciergeAudit.findUnique({
    where: { id: body.auditId },
  });
  if (!audit) {
    return NextResponse.json(
      { ok: false, code: 'audit-not-found', message: 'Unknown audit.' },
      { status: 404 },
    );
  }
  if (audit.status !== 'paid' && audit.status !== 'delivered') {
    return NextResponse.json(
      { ok: false, code: 'audit-not-eligible', message: 'Audit not eligible.' },
      { status: 403 },
    );
  }

  const normalisedDomain = normaliseShopDomain(body.shopUrl);
  if (!normalisedDomain) {
    return NextResponse.json(
      { ok: false, code: 'invalid-shop-url', message: 'Invalid shop URL.' },
      { status: 422 },
    );
  }

  await prisma.gmcAccessRequest.create({
    data: {
      auditId: body.auditId,
      email: body.email.toLowerCase().trim(),
      shopUrl: body.shopUrl.trim(),
      normalisedDomain,
      reason: body.reason?.trim() || null,
    },
  });

  return NextResponse.json({ ok: true });
}
