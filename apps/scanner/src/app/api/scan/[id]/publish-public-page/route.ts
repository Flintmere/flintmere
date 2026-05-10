import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkScanActionRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Merchant opts their score into the public /score/{normalisedDomain} page.
// The scan id is the capability — whoever holds the Results URL can toggle it.
// Idempotent. Separate from publishedToBenchmark (aggregate-only consent).
// POST = opt in. DELETE = opt back out. Both operate on the same column.
//
// Per-IP rate limit added 2026-05-10 (P1-G pre-launch audit) — sustained
// ID enumeration without a bucket would exhaust DB connections on the
// single-droplet deployment.
function readIp(req: NextRequest): string | null {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    null
  );
}

function rateLimited(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      code: 'rate-limited',
      message: 'Too many requests.',
      retryAfterSec,
    },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSec) },
    },
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id || typeof id !== 'string') {
    return NextResponse.json(
      { ok: false, code: 'bad-request', message: 'Missing scan id.' },
      { status: 400 },
    );
  }

  const rl = checkScanActionRateLimit({ ip: readIp(req) });
  if (!rl.ok) return rateLimited(rl.retryAfterSec);

  const scan = await prisma.scan.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      score: true,
      grade: true,
      normalisedDomain: true,
      publishPublicPage: true,
    },
  });

  if (!scan) {
    return NextResponse.json(
      { ok: false, code: 'not-found', message: 'Scan not found.' },
      { status: 404 },
    );
  }

  if (
    scan.status !== 'complete' ||
    scan.score === null ||
    scan.grade === null
  ) {
    return NextResponse.json(
      {
        ok: false,
        code: 'not-publishable',
        message: 'Only completed scans with a score can be published.',
      },
      { status: 409 },
    );
  }

  if (scan.publishPublicPage) {
    return NextResponse.json({
      ok: true,
      alreadyPublished: true,
      domain: scan.normalisedDomain,
    });
  }

  await prisma.scan.update({
    where: { id },
    data: {
      publishPublicPage: true,
      publicPageAt: new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
    alreadyPublished: false,
    domain: scan.normalisedDomain,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id || typeof id !== 'string') {
    return NextResponse.json(
      { ok: false, code: 'bad-request', message: 'Missing scan id.' },
      { status: 400 },
    );
  }

  const rl = checkScanActionRateLimit({ ip: readIp(req) });
  if (!rl.ok) return rateLimited(rl.retryAfterSec);

  const scan = await prisma.scan.findUnique({
    where: { id },
    select: { id: true, publishPublicPage: true },
  });

  if (!scan) {
    return NextResponse.json(
      { ok: false, code: 'not-found', message: 'Scan not found.' },
      { status: 404 },
    );
  }

  if (!scan.publishPublicPage) {
    return NextResponse.json({ ok: true, alreadyOff: true });
  }

  await prisma.scan.update({
    where: { id },
    data: {
      publishPublicPage: false,
      publicPageAt: null,
    },
  });

  return NextResponse.json({ ok: true, alreadyOff: false });
}
