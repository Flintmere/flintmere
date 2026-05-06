import { NextRequest, NextResponse } from 'next/server';
import {
  buildAuthUrl,
  isFeatureEnabled,
  normaliseShopDomain,
  signState,
} from '@/lib/gmc/oauth';
import { prisma } from '@/lib/db';

// Per ADR 0023 §slice 2 — OAuth start endpoint. Behind FEATURE_GMC_OAUTH.
// Caller posts an audit id; we look up the audit, validate eligibility,
// derive the merchant's normalised domain from the audit's shopUrl,
// sign that into a CSRF state token, and redirect the merchant to
// Google's consent page. Google then bounces them back to /callback
// with ?code= and ?state=.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isFeatureEnabled()) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const url = new URL(request.url);
  const auditId = url.searchParams.get('audit');
  if (!auditId) {
    return NextResponse.json({ error: 'missing-audit-param' }, { status: 400 });
  }

  const audit = await prisma.conciergeAudit.findUnique({ where: { id: auditId } });
  if (!audit) {
    return NextResponse.json({ error: 'audit-not-found' }, { status: 404 });
  }
  if (audit.status !== 'paid' && audit.status !== 'delivered') {
    return NextResponse.json({ error: 'audit-not-eligible' }, { status: 403 });
  }

  const normalisedDomain = normaliseShopDomain(audit.shopUrl);
  if (!normalisedDomain) {
    return NextResponse.json({ error: 'invalid-audit-domain' }, { status: 422 });
  }

  const state = signState({ normalisedDomain, auditId: audit.id });
  const redirectUri = new URL('/api/auth/google/callback', url).toString();
  const authUrl = buildAuthUrl({ state, redirectUri });

  return NextResponse.redirect(authUrl, { status: 302 });
}
