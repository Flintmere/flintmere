import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyUnsubToken } from '@/lib/unsub-token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * One-click unsubscribe (PECR/GDPR + RFC 8058 List-Unsubscribe-Post compliance).
 * Accepts GET for human clicks and POST for mail-client one-click buttons.
 */
async function handle(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const verified = verifyUnsubToken(token);
  if (!verified) {
    return NextResponse.redirect(
      new URL('/unsubscribe?status=invalid', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
      { status: 303 },
    );
  }

  const lead = await prisma.lead.findUnique({ where: { id: verified.leadId } });
  if (!lead) {
    return NextResponse.redirect(
      new URL('/unsubscribe?status=invalid', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
      { status: 303 },
    );
  }

  if (!lead.unsubscribedAt) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { unsubscribedAt: new Date() },
    });
  }

  return NextResponse.redirect(
    new URL('/unsubscribe?status=ok', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
    { status: 303 },
  );
}

export const GET = handle;
export const POST = handle;
