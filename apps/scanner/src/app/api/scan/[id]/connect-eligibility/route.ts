import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkScanActionRateLimit } from '@/lib/rate-limit';
import { isFeatureEnabled, normaliseShopDomain } from '@/lib/gmc/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Connect-friction spec (2026-06-07) fix 3 — GMC connect-CTA eligibility for
// a scan's owner.
//
// The scan ID is a capability token (same model as /api/scan/[id]); the
// merchant possesses it only because they ran the scan. We resolve the scan's
// domain to an eligible (paid/delivered) ConciergeAudit and return its id, so
// the results page can offer a connect CTA without an OPEN domain->audit
// enumeration oracle (which #24 / #19 would veto). Per-IP rate-limited and
// gated behind FEATURE_GMC_OAUTH — when the flag is off this 404s like the
// rest of the OAuth surface, so it ships dark with the flag.
//
// Returns { eligible: false } (never the reason) when no eligible audit
// exists, so a holder of a scan id can't probe other merchants' audit status.

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isFeatureEnabled()) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const { id } = await params;
  if (!id || typeof id !== 'string') {
    return NextResponse.json(
      { ok: false, code: 'bad-request' },
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
      { ok: false, code: 'rate-limited', retryAfterSec: rl.retryAfterSec },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    );
  }

  const scan = await prisma.scan.findUnique({
    where: { id },
    select: { normalisedDomain: true },
  });
  if (!scan) {
    return NextResponse.json({ ok: true, eligible: false }, { status: 200 });
  }

  // Match the OAuth-start eligibility gate: paid OR delivered audit whose
  // shopUrl normalises to the same domain as the scan.
  const audits = await prisma.conciergeAudit.findMany({
    where: { status: { in: ['paid', 'delivered'] } },
    select: { id: true, shopUrl: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const match = audits.find(
    (a) => normaliseShopDomain(a.shopUrl) === scan.normalisedDomain,
  );

  if (!match) {
    return NextResponse.json({ ok: true, eligible: false }, { status: 200 });
  }

  return NextResponse.json(
    { ok: true, eligible: true, auditId: match.id },
    { status: 200 },
  );
}
