import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkScanActionRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Merchant-driven benchmark contribution. The scan id is the
// capability — whoever has it (the merchant who ran the scan, via
// their Results URL) can flip the flag. Same trust model as GET
// /api/scan/[id]. Operation is idempotent.
//
// Per-IP rate limit added 2026-05-10 (P1-G pre-launch audit).
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

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    null;
  const rl = checkScanActionRateLimit({ ip });
  if (!rl.ok) {
    return NextResponse.json(
      {
        ok: false,
        code: 'rate-limited',
        message: 'Too many requests.',
        retryAfterSec: rl.retryAfterSec,
      },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfterSec) },
      },
    );
  }

  const scan = await prisma.scan.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      source: true,
      score: true,
      grade: true,
      publishedToBenchmark: true,
    },
  });

  if (!scan) {
    return NextResponse.json(
      { ok: false, code: 'not-found', message: 'Scan not found.' },
      { status: 404 },
    );
  }

  if (scan.status !== 'complete' || scan.score === null || scan.grade === null) {
    return NextResponse.json(
      {
        ok: false,
        code: 'not-publishable',
        message: 'Only completed scans with a score can be added to the benchmark.',
      },
      { status: 409 },
    );
  }

  // Already-opted-in scans return 200 without a write — idempotent.
  if (scan.publishedToBenchmark) {
    return NextResponse.json({ ok: true, alreadyPublished: true });
  }

  await prisma.scan.update({
    where: { id },
    data: {
      publishedToBenchmark: true,
      publishedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, alreadyPublished: false });
}
