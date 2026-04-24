import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Merchant opts their score into the public /score/{normalisedDomain} page.
// The scan id is the capability — whoever holds the Results URL can toggle it.
// Idempotent. Separate from publishedToBenchmark (aggregate-only consent).
// POST = opt in. DELETE = opt back out. Both operate on the same column.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id || typeof id !== 'string') {
    return NextResponse.json(
      { ok: false, code: 'bad-request', message: 'Missing scan id.' },
      { status: 400 },
    );
  }

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
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id || typeof id !== 'string') {
    return NextResponse.json(
      { ok: false, code: 'bad-request', message: 'Missing scan id.' },
      { status: 400 },
    );
  }

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
