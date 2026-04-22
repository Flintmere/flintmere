import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Merchant-driven benchmark contribution. The scan id is the
// capability — whoever has it (the merchant who ran the scan, via
// their Results URL) can flip the flag. Same trust model as GET
// /api/scan/[id], which already exposes the full result to anyone
// holding the id. Operation is idempotent.
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
