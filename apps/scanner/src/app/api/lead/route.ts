import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  email: z.string().email(),
  scanId: z.string().min(1),
  consentedAt: z.string().datetime().optional(),
});

export async function POST(req: NextRequest) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { ok: false, code: 'bad-request', message: 'Invalid email.' },
      { status: 400 },
    );
  }

  const scan = await prisma.scan.findUnique({ where: { id: body.scanId } });
  if (!scan) {
    return NextResponse.json(
      { ok: false, code: 'scan-not-found', message: 'Unknown scan.' },
      { status: 404 },
    );
  }

  const lead = await prisma.lead.create({
    data: {
      email: body.email.toLowerCase(),
      scanId: body.scanId,
      consentedAt: body.consentedAt ? new Date(body.consentedAt) : new Date(),
    },
  });

  // TODO(resend): queue report email delivery when RESEND_API_KEY is configured.

  return NextResponse.json(
    { ok: true, leadId: lead.id },
    { status: 201 },
  );
}
