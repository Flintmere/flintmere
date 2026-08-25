import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '@flintmere/ui';
import { prisma } from '@/lib/db';
import { isFeatureEnabled, normaliseShopDomain } from '@/lib/gmc/oauth';
import { resolvePostConnectScan } from '@/lib/post-connect-scan';
import { ExpiredLink } from '../_states/ExpiredLink';
import { PostConnectPayoff } from './PostConnectPayoff';
import { PostConnectRetry } from './PostConnectRetry';

// Per ADR 0023 connect-friction spec (2026-06-07) fix 1 — the post-connect
// payoff. The OAuth callback routes here on success instead of dead-ending on
// the Connected card. We resolve the merchant's ground-truth scan (reuse a
// recent row or run a fresh one — sidestepping the 30s domain dedupe) and
// render the score + private GMC panel. Behind FEATURE_GMC_OAUTH; reverts by
// pointing the callback back at /catalog-letter/connect?status=ok.

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const metadata: Metadata = {
  title: 'Your Merchant Center ground truth',
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ audit?: string }>;
}

export default async function PostConnectResultsPage({ searchParams }: Props) {
  const { audit: auditId } = await searchParams;
  if (!auditId) return <ExpiredLink />;

  const audit = await prisma.conciergeAudit.findUnique({
    where: { id: auditId },
  });
  if (!audit || (audit.status !== 'paid' && audit.status !== 'delivered')) {
    return <ExpiredLink />;
  }

  const normalisedDomain = normaliseShopDomain(audit.shopUrl);
  const featureOn = isFeatureEnabled();

  // No active connection (or flag off) — send them back to the connect step
  // rather than running a scan they didn't ask for.
  const connection =
    featureOn && normalisedDomain
      ? await prisma.merchantGmcConnection.findUnique({
          where: { normalisedDomain },
        })
      : null;
  if (!connection || connection.revokedAt) {
    return <ExpiredLink />;
  }

  const result = await resolvePostConnectScan(audit.shopUrl, normalisedDomain);

  if (result.status === 'error') {
    return (
      <main id="main" className="flintmere-main">
        <PostConnectRetry auditId={audit.id} errorCode={result.errorCode} />
        <SiteFooter />
      </main>
    );
  }

  return (
    <main id="main" className="flintmere-main">
      <PostConnectPayoff
        shopDomain={result.shopDomain}
        score={result.score}
        grade={result.grade}
        gmcGroundTruth={result.gmcGroundTruth}
      />
      <section
        className="mx-auto max-w-[1280px] px-8 py-12 border-t border-[color:var(--color-line)]"
      >
        <p
          className="text-[color:var(--color-mute)]"
          style={{ fontSize: 13, lineHeight: 1.6, maxWidth: '72ch' }}
        >
          This is your own data, shown only to you. To publish your live
          approval breakdown on your public score page, run a scan from{' '}
          <Link
            href="/scan"
            style={{
              color: 'var(--color-ink)',
              textDecoration: 'underline',
              textUnderlineOffset: 3,
            }}
          >
            the scanner
          </Link>{' '}
          and use the opt-in there. You can manage your connection on the{' '}
          <Link
            href={`/catalog-letter/connect?audit=${encodeURIComponent(audit.id)}`}
            style={{
              color: 'var(--color-ink)',
              textDecoration: 'underline',
              textUnderlineOffset: 3,
            }}
          >
            connection page
          </Link>
          .
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}
