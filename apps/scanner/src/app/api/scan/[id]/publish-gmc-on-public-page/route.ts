import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkScanActionRateLimit } from '@/lib/rate-limit';
import { revalidatePublicScore } from '@/lib/public-score';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Per ADR 0023 slice 3 — toggles `publish_gmc_on_public_page` on the scan
 * record. Separate consent column from `publish_public_page` (which covers
 * pillar scores only). The 2026-04-24 precedent (publish_public_page split
 * from published_to_benchmark) is the pattern we're following: each new
 * data class on a public surface gets its own consent column + endpoint.
 *
 * Server-side enforcement: GMC publish requires publish_public_page=true
 * as a precondition. Caller cannot turn on the GMC panel for a merchant
 * who hasn't published the parent score page first.
 *
 * The scan id is the capability — whoever holds the Results URL can
 * toggle it. Idempotent. POST = opt in. DELETE = opt back out.
 */
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
      publishGmcOnPublicPage: true,
      scoreJson: true,
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

  // Parent-consent precondition. Caller has to enable the public score
  // page first; only then can they layer GMC counts on top.
  if (!scan.publishPublicPage) {
    return NextResponse.json(
      {
        ok: false,
        code: 'parent-consent-required',
        message:
          'Publish the public score page first before adding GMC counts.',
      },
      { status: 409 },
    );
  }

  // Data-existence precondition. No GMC data → nothing to publish.
  const scoreJson = scan.scoreJson as { gmcGroundTruth?: unknown } | null;
  if (!scoreJson?.gmcGroundTruth) {
    return NextResponse.json(
      {
        ok: false,
        code: 'no-gmc-data',
        message:
          'Connect Google Merchant Center first; this scan has no ground-truth data to publish.',
      },
      { status: 409 },
    );
  }

  if (scan.publishGmcOnPublicPage) {
    return NextResponse.json({
      ok: true,
      alreadyPublished: true,
      domain: scan.normalisedDomain,
    });
  }

  await prisma.scan.update({
    where: { id },
    data: {
      publishGmcOnPublicPage: true,
      publishGmcOnPublicPageAt: new Date(),
    },
  });

  // The GMC panel renders on the public score page + OG image, so purge
  // both now — the added panel shows on the next request, not after the
  // 1h ISR window (#24).
  revalidatePublicScore(scan.normalisedDomain);

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
    select: { id: true, publishGmcOnPublicPage: true, normalisedDomain: true },
  });

  if (!scan) {
    return NextResponse.json(
      { ok: false, code: 'not-found', message: 'Scan not found.' },
      { status: 404 },
    );
  }

  if (!scan.publishGmcOnPublicPage) {
    return NextResponse.json({ ok: true, alreadyOff: true });
  }

  await prisma.scan.update({
    where: { id },
    data: {
      publishGmcOnPublicPage: false,
      publishGmcOnPublicPageAt: null,
    },
  });

  // Purge the score page + OG image so the GMC panel disappears on the next
  // request, not after the 1h ISR window (#24).
  revalidatePublicScore(scan.normalisedDomain);

  return NextResponse.json({ ok: true, alreadyOff: false });
}
