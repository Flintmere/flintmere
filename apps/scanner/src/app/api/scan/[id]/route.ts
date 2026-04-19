import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
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
      normalisedDomain: true,
      score: true,
      grade: true,
      productCount: true,
      variantCount: true,
      scoreJson: true,
      errorCode: true,
      errorMessage: true,
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
