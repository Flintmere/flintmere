import type { Metadata } from 'next';
import Link from 'next/link';
import { Bracket, SiteFooter } from '@flintmere/ui';
import { prisma } from '@/lib/db';
import { isFeatureEnabled, normaliseShopDomain } from '@/lib/gmc/oauth';
import { RequestAccessForm } from './RequestAccessForm';
import { DisconnectButton } from './DisconnectButton';

// Per ADR 0023 §slice 2b — single canonical route, three states.
//
// State A — pre-verification (`FEATURE_GMC_OAUTH=false`):
//   the merchant clicks the link from their audit-delivery email
//   while Google's Trust & Safety review is still in flight.
//   We render a request-access form that captures their interest
//   in `scanner_gmc_access_requests`. This is the load-bearing
//   piece during the 4–6 week verification window.
//
// State B — flag flipped, no connection:
//   the merchant lands here from the same email, post-verification.
//   We render a `[ Connect Google Merchant Center → ]` CTA that
//   posts to /api/auth/google/start?audit=<id>.
//
// State C — connected:
//   we render a Margaret-Howell-restraint card showing account
//   name, scopes, connected date, plus a disconnect button.
//
// References (council pre-flight, lead seat #29 Art Director):
//   1. a24films.com — single-frame editorial poster moment with
//      monospace credits. Borrowed for the hero typographic anchor
//      and the mono scope-credits row.
//   2. margarethowell.co.uk — quiet-luxury procurement-grade
//      restraint. Borrowed for the connected-state's single-card
//      composition and pre-verification form's enclosed register.
//   3. anthonyburrill.com — poster typography as the entire
//      surface. Borrowed for state A's heroic typographic anchor
//      when the page must feel "designed" with no real CTA yet.

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

  return (
    <main id="main" className="flintmere-main">
      <a href="#connect-body" className="skip-link">
        Skip to content
      </a>

      {!featureOn ? (
        <PreVerificationHero />
      ) : connected ? (
        <ConnectedHero />
      ) : (
        <ConnectHero />
      )}

      <section
        id="connect-body"
        style={{
          background: 'var(--color-paper)',
          padding: 'clamp(48px, 8vw, 120px) 24px clamp(72px, 10vw, 160px)',
        }}
      >
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <StatusBanner status={status} reason={reason} />

          {!featureOn ? (
            <RequestAccessForm
              auditId={audit.id}
              defaultEmail={audit.email}
              shopUrl={audit.shopUrl}
            />
          ) : connected && connection ? (
            <ConnectedPanel
              auditId={audit.id}
              connection={{
                gmcAccountId: connection.gmcAccountId,
                gmcAccountName: connection.gmcAccountName,
                connectedAt: connection.connectedAt.toISOString(),
                scopes: connection.scopes,
              }}
            />
          ) : (
            <ConnectCta auditId={audit.id} />
          )}

          <ScopeCredits variant={connected ? 'connected' : 'pre-connect'} />

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

function PreVerificationHero() {
  return (
    <section
      style={{
        background: 'var(--color-paper)',
        padding: 'clamp(96px, 14vw, 192px) 24px clamp(48px, 6vw, 96px)',
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          display: 'grid',
          gap: 'clamp(32px, 4vw, 56px)',
        }}
      >
        <p
          className="eyebrow-hero"
          style={{ color: 'var(--color-mute)' }}
        >
          Awaiting Google verification
        </p>

        <h1
          style={{
            fontSize: 'clamp(48px, 11vw, 144px)',
            fontWeight: 600,
            lineHeight: 0.92,
            letterSpacing: '-0.04em',
            margin: 0,
            color: 'var(--color-ink)',
          }}
        >
          Direct from your{' '}
          <span
            className="flintmere-outline-shimmer"
            style={{
              display: 'inline-block',
              fontFamily:
                'var(--font-mono, ui-monospace, Menlo, monospace)',
              fontWeight: 700,
            }}
          >
            <Bracket>Merchant Center</Bracket>
          </span>
          .
        </h1>

        <p
          style={{
            maxWidth: '60ch',
            fontSize: 'clamp(17px, 1.6vw, 21px)',
            lineHeight: 1.5,
            color: 'var(--color-ink-2)',
            margin: 0,
          }}
        >
          We&rsquo;re in Google&rsquo;s Trust &amp; Safety review &mdash;
          typical wait is four to six weeks. Leave your details below and
          we&rsquo;ll write the day access opens. Your audit doesn&rsquo;t
          change in the meantime.
        </p>
      </div>
    </section>
  );
}

function ConnectHero() {
  return (
    <section
      style={{
        background: 'var(--color-paper)',
        padding: 'clamp(96px, 14vw, 192px) 24px clamp(48px, 6vw, 96px)',
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          display: 'grid',
          gap: 'clamp(32px, 4vw, 56px)',
        }}
      >
        <p
          className="eyebrow-hero"
          style={{ color: 'var(--color-mute)' }}
        >
          Step 2 — Connect
        </p>

        <h1
          style={{
            fontSize: 'clamp(48px, 11vw, 144px)',
            fontWeight: 600,
            lineHeight: 0.92,
            letterSpacing: '-0.04em',
            margin: 0,
            color: 'var(--color-ink)',
          }}
        >
          Read directly from your{' '}
          <span
            className="flintmere-outline-shimmer"
            style={{
              display: 'inline-block',
              fontFamily:
                'var(--font-mono, ui-monospace, Menlo, monospace)',
              fontWeight: 700,
            }}
          >
            <Bracket>Merchant Center</Bracket>
          </span>
          .
        </h1>

        <p
          style={{
            maxWidth: '60ch',
            fontSize: 'clamp(17px, 1.6vw, 21px)',
            lineHeight: 1.5,
            color: 'var(--color-ink-2)',
            margin: 0,
          }}
        >
          Your audit shipped from public signals. Connect Google Merchant
          Center and every future scan re-reads your real account &mdash;
          disapprovals, account state, the reasons Google itself stated.
          Read-only. Disconnect anytime.
        </p>
      </div>
    </section>
  );
}

function ConnectedHero() {
  return (
    <section
      style={{
        background: 'var(--color-paper)',
        padding: 'clamp(96px, 14vw, 192px) 24px clamp(48px, 6vw, 96px)',
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          display: 'grid',
          gap: 'clamp(32px, 4vw, 56px)',
        }}
      >
        <p
          className="eyebrow-hero"
          style={{ color: 'var(--color-mute)' }}
        >
          Connected
        </p>

        <h1
          style={{
            fontSize: 'clamp(48px, 11vw, 144px)',
            fontWeight: 600,
            lineHeight: 0.92,
            letterSpacing: '-0.04em',
            margin: 0,
            color: 'var(--color-ink)',
          }}
        >
          Your{' '}
          <span
            className="flintmere-outline-shimmer"
            style={{
              display: 'inline-block',
              fontFamily:
                'var(--font-mono, ui-monospace, Menlo, monospace)',
              fontWeight: 700,
            }}
          >
            <Bracket>Merchant Center</Bracket>
          </span>{' '}
          is wired in.
        </h1>

        <p
          style={{
            maxWidth: '60ch',
            fontSize: 'clamp(17px, 1.6vw, 21px)',
            lineHeight: 1.5,
            color: 'var(--color-ink-2)',
            margin: 0,
          }}
        >
          Each scan now reads Google&rsquo;s real reasons, not our model.
          Disconnect anytime &mdash; your refresh token is zeroed and we
          fall back to public signals on the next scan.
        </p>
      </div>
    </section>
  );
}

function ConnectCta({ auditId }: { auditId: string }) {
  const href = `/api/auth/google/start?audit=${encodeURIComponent(auditId)}`;
  return (
    <div
      style={{
        display: 'grid',
        gap: 24,
        padding: 32,
        border: '1px solid var(--color-line)',
        background: 'var(--color-paper)',
      }}
    >
      <p
        className="eyebrow"
        style={{ color: 'var(--color-mute)', margin: 0 }}
      >
        OAuth — read-only
      </p>
      <a
        href={href}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: '18px 24px',
          minHeight: 56,
          background: 'var(--color-accent)',
          color: 'var(--color-ink)',
          border: '1px solid var(--color-ink)',
          fontFamily:
            'var(--font-mono, ui-monospace, Menlo, monospace)',
          fontSize: 14,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Connect Google Merchant Center →
      </a>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          lineHeight: 1.6,
          color: 'var(--color-mute)',
        }}
      >
        You&rsquo;ll be redirected to Google to grant read-only access to
        your Merchant Center. We never see your password and we never
        write to your account.
      </p>
    </div>
  );
}

function ConnectedPanel({
  auditId,
  connection,
}: {
  auditId: string;
  connection: {
    gmcAccountId: string | null;
    gmcAccountName: string | null;
    connectedAt: string;
    scopes: string[];
  };
}) {
  const connectedDate = new Date(connection.connectedAt).toLocaleDateString(
    'en-GB',
    { day: 'numeric', month: 'long', year: 'numeric' },
  );
  const accountLine = connection.gmcAccountName ?? 'Pending first scan';
  const accountIdLine = connection.gmcAccountId ?? '—';
  const scopeLine = connection.scopes.length
    ? connection.scopes.join(' · ')
    : 'content (read-only)';

  return (
    <div
      style={{
        display: 'grid',
        gap: 24,
        padding: 32,
        border: '1px solid var(--color-line)',
        background: 'var(--color-paper)',
        boxShadow: 'var(--shadow-paper-1)',
      }}
    >
      <div style={{ display: 'grid', gap: 8 }}>
        <p
          className="eyebrow"
          style={{ color: 'var(--color-mute)', margin: 0 }}
        >
          Account
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 24,
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            color: 'var(--color-ink)',
            fontWeight: 500,
          }}
        >
          {accountLine}
        </p>
        <p
          style={{
            margin: 0,
            fontFamily:
              'var(--font-mono, ui-monospace, Menlo, monospace)',
            fontSize: 12,
            letterSpacing: '0.04em',
            color: 'var(--color-mute-2)',
          }}
        >
          ID · {accountIdLine}
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          paddingTop: 16,
          borderTop: '1px solid var(--color-line-soft)',
        }}
      >
        <Detail label="Connected" value={connectedDate} />
        <Detail label="Scopes" value={scopeLine} />
      </div>

      <DisconnectButton auditId={auditId} />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <p
        className="eyebrow"
        style={{ color: 'var(--color-mute)', margin: 0 }}
      >
        {label}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.5,
          color: 'var(--color-ink-2)',
        }}
      >
        {value}
      </p>
    </div>
  );
}

function ScopeCredits({
  variant,
}: {
  variant: 'pre-connect' | 'connected';
}) {
  const items =
    variant === 'connected'
      ? [
          { k: 'What we read', v: 'Account state · disapproval reasons · per-product status' },
          { k: 'What we don’t', v: 'Customer data · order data · ad spend · write access' },
          { k: 'Refresh token', v: 'AES-256-GCM at rest · zeroed on disconnect' },
        ]
      : [
          { k: 'OAuth scope', v: 'auth/content · read-only' },
          { k: 'Refresh token', v: 'AES-256-GCM at rest · isolated key' },
          { k: 'Revoke', v: 'Disconnect zeros the token here and at Google' },
        ];

  return (
    <div
      style={{
        marginTop: 48,
        paddingTop: 32,
        borderTop: '1px solid var(--color-line-soft)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 24,
      }}
    >
      {items.map((it) => (
        <div key={it.k} style={{ display: 'grid', gap: 8 }}>
          <p
            className="eyebrow-micro"
            style={{ color: 'var(--color-mute)', margin: 0 }}
          >
            {it.k}
          </p>
          <p
            style={{
              margin: 0,
              fontFamily:
                'var(--font-mono, ui-monospace, Menlo, monospace)',
              fontSize: 12,
              lineHeight: 1.55,
              color: 'var(--color-ink-2)',
              letterSpacing: '0.01em',
            }}
          >
            {it.v}
          </p>
        </div>
      ))}
    </div>
  );
}

function StatusBanner({
  status,
  reason,
}: {
  status?: string;
  reason?: string;
}) {
  if (!status) return null;

  let tone: 'ok' | 'warn' | 'error' = 'ok';
  let title = '';
  let body = '';

  if (status === 'ok') {
    tone = 'ok';
    title = 'Connected';
    body = 'We read your Merchant Center the next time your audit is regenerated.';
  } else if (status === 'denied') {
    tone = 'warn';
    title = 'Consent declined';
    body =
      reason === 'access_denied'
        ? 'You declined consent. No data was shared.'
        : 'Google ended the consent flow before completion. You can try again anytime.';
  } else if (status === 'exchange-failed') {
    tone = 'error';
    title = 'Connection failed';
    body =
      'Google accepted consent but rejected the token exchange. This usually means the OAuth client is misconfigured. Please reply to your audit email and we’ll resolve.';
  } else {
    return null;
  }

  const border =
    tone === 'error'
      ? 'var(--color-alert)'
      : tone === 'warn'
        ? 'var(--color-line)'
        : 'var(--color-ink)';
  const accent =
    tone === 'error'
      ? 'var(--color-alert)'
      : tone === 'warn'
        ? 'var(--color-mute)'
        : 'var(--color-accent)';

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        marginBottom: 32,
        padding: '20px 24px',
        border: `1px solid ${border}`,
        borderLeft: `3px solid ${accent}`,
        background: 'var(--color-paper)',
        display: 'grid',
        gap: 6,
      }}
    >
      <p
        className="eyebrow"
        style={{ margin: 0, color: 'var(--color-mute)' }}
      >
        {title}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.55,
          color: 'var(--color-ink-2)',
        }}
      >
        {body}
      </p>
    </div>
  );
}

function ExpiredLink() {
  return (
    <main id="main" className="flintmere-main">
      <section
        style={{
          background: 'var(--color-paper)',
          padding: '128px 24px 96px',
          textAlign: 'center',
        }}
      >
        <p className="eyebrow" style={{ color: 'var(--color-mute)' }}>
          Link expired
        </p>
        <h1
          style={{
            margin: '24px auto 16px',
            maxWidth: '20ch',
            fontSize: 'clamp(36px, 6vw, 56px)',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: 'var(--color-ink)',
          }}
        >
          This connection link is no longer <Bracket>active</Bracket>.
        </h1>
        <p
          style={{
            maxWidth: '52ch',
            margin: '0 auto',
            fontSize: 17,
            lineHeight: 1.55,
            color: 'var(--color-ink-2)',
          }}
        >
          Reply to your audit delivery email and we&rsquo;ll send a fresh
          link within one working day.
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}
