import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { SiteFooter } from '@flintmere/ui';
import { TrackOnMount } from '@/components/TrackOnMount';
import { prisma } from '@/lib/db';
import { isFeatureEnabled, normaliseShopDomain } from '@/lib/gmc/oauth';
import { pickState } from './pick-state';
import { ScopeCredits } from './_shared/ScopeCredits';
import { StatusBanner } from './_shared/StatusBanner';
import { ExpiredLink } from './_states/ExpiredLink';
import {
  PreVerificationHero,
  PreVerificationBody,
} from './_states/PreVerificationState';
import { ConnectHero, ConnectBody } from './_states/ConnectState';
import {
  ConnectedHero,
  ConnectedBody,
} from './_states/ConnectedState';

// Per ADR 0023 §slice 2b — single canonical route, three states.
// Per-state composition lives in ./_states; shared chrome in ./_shared.
// pickState() in ./pick-state.ts is the dispatch primitive.

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: 'Connect Google Merchant Center',
  description:
    'Connect your Google Merchant Center so future Flintmere audits read directly from your account — Google’s real disapproval reasons, not our model.',
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{
    audit?: string;
    status?: string;
    reason?: string;
  }>;
}

export default async function AuditConnectPage({ searchParams }: Props) {
  const { audit: auditId, status, reason } = await searchParams;

  if (!auditId) {
    return <ExpiredLink />;
  }

  const audit = await prisma.conciergeAudit.findUnique({
    where: { id: auditId },
  });

  if (!audit || (audit.status !== 'paid' && audit.status !== 'delivered')) {
    return <ExpiredLink />;
  }

  const normalisedDomain = normaliseShopDomain(audit.shopUrl);
  const featureOn = isFeatureEnabled();

  const connection = featureOn && normalisedDomain
    ? await prisma.merchantGmcConnection.findUnique({
        where: { normalisedDomain },
      })
    : null;
  const connected = Boolean(connection && !connection.revokedAt);

  const state = pickState({ featureOn, connected });

  let hero: ReactNode;
  let body: ReactNode;
  let scopeVariant: 'pre-connect' | 'connected';

  if (state === 'pre-verification') {
    hero = <PreVerificationHero />;
    body = (
      <PreVerificationBody
        auditId={audit.id}
        defaultEmail={audit.email}
        shopUrl={audit.shopUrl}
      />
    );
    scopeVariant = 'pre-connect';
  } else if (state === 'connected' && connection) {
    hero = <ConnectedHero />;
    body = (
      <ConnectedBody
        auditId={audit.id}
        connection={{
          gmcAccountId: connection.gmcAccountId,
          gmcAccountName: connection.gmcAccountName,
          connectedAt: connection.connectedAt.toISOString(),
          scopes: connection.scopes,
        }}
      />
    );
    scopeVariant = 'connected';
  } else {
    hero = <ConnectHero />;
    body = <ConnectBody auditId={audit.id} />;
    scopeVariant = 'pre-connect';
  }

  return (
    <main id="main" className="flintmere-main">
      {/* Funnel step 1 (ADR 0023 §measurement, spec 2026-06-07). Renders
          nothing; emits connect_page_viewed once on hydration with the state
          the merchant landed in, so the funnel reads view → start → ok →
          ground-truth. No visual change. */}
      <TrackOnMount event="connect_page_viewed" props={{ state }} />

      <a href="#connect-body" className="skip-link">
        Skip to content
      </a>

      {hero}

      <section
        id="connect-body"
        style={{
          background: 'var(--color-paper)',
          padding: 'clamp(48px, 8vw, 120px) 24px clamp(72px, 10vw, 160px)',
        }}
      >
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <StatusBanner status={status} reason={reason} />

          {body}

          <ScopeCredits variant={scopeVariant} />

          <p
            style={{
              marginTop: 48,
              fontSize: 12,
              lineHeight: 1.6,
              color: 'var(--color-mute)',
            }}
          >
            How we handle GMC data — see{' '}
            <Link
              href="/privacy#gmc-integration"
              style={{
                color: 'var(--color-ink)',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              privacy policy §11
            </Link>
            .
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
