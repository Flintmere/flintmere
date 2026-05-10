import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkScanActionRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Public read of a scan by ID (UUID = capability token).
//
// Two layers of defense added 2026-05-10 (P1-H pre-launch audit):
// 1. Per-IP rate limit — prevents ID-enumeration floods + DB-connection
//    exhaustion on the single-droplet deployment.
// 2. Response is restricted to display-safe fields. `scoreJson` and
//    `errorMessage` are NOT returned by this public GET — they contain
//    merchant-specific diagnostic detail that was never consented for
//    public consumption. The "scan ID = capability" model is ratified
//    only for benchmark-opt-in POST verbs (per publish/route.ts), not
//    for full read of internal scoring detail.
export async function GET(
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
      normalisedDomain: true,
      score: true,
      grade: true,
      productCount: true,
      variantCount: true,
      errorCode: true,
      createdAt: true,
      completedAt: true,
    },
  });

  if (!scan) {
    return NextResponse.json(
      { ok: false, code: 'not-found', message: 'Scan not found.' },
      { status: 404 },
    );
  }

  return NextResponse.json(scan);
}
