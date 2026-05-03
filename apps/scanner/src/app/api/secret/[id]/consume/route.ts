/**
 * POST /api/secret/[id]/consume — atomically claim and return a
 * client-side-encrypted secret.
 *
 * Returns: { ok: true, ciphertext, iv, authTag } where each field is
 * base64-encoded raw bytes.
 *
 * Failure modes (status: code):
 *   404 not-found            — no row with that id
 *   410 already-consumed     — already burned
 *   410 expired              — past expiresAt
 *
 * Why POST and not GET. With GET, link-prefetchers (Slack/Discord/Outlook
 * link previews, antivirus link checkers, browsers' speculative loads)
 * would consume the secret before the human ever sees it. The reveal
 * page renders a "Click to reveal" button; the click fires this POST.
 *
 * The server only stores ciphertext + IV + authTag — it has no key, so
 * the body of this response is useless without the URL fragment held by
 * the recipient's browser. The atomic `updateMany` with the
 * `consumedAt: null` predicate ensures only one click wins under
 * concurrent access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const now = new Date();

  const claimed = await prisma.oneTimeSecret.updateMany({
    where: { id, consumedAt: null, expiresAt: { gt: now } },
    data: { consumedAt: now },
  });

  if (claimed.count === 0) {
    const row = await prisma.oneTimeSecret.findUnique({ where: { id } });
    if (!row) {
      return NextResponse.json(
        { ok: false, code: 'not-found' },
        { status: 404 },
      );
    }
    if (row.expiresAt <= now) {
      return NextResponse.json(
        { ok: false, code: 'expired' },
        { status: 410 },
      );
    }
    return NextResponse.json(
      { ok: false, code: 'already-consumed' },
      { status: 410 },
    );
  }

  const row = await prisma.oneTimeSecret.findUnique({ where: { id } });
  if (!row) {
    return NextResponse.json(
      { ok: false, code: 'not-found' },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    ciphertext: Buffer.from(row.ciphertext).toString('base64'),
    iv: Buffer.from(row.iv).toString('base64'),
    authTag: Buffer.from(row.authTag).toString('base64'),
  });
}
