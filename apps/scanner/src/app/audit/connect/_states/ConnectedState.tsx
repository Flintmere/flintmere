import { HeroSection, HeroBracketShimmer } from '../_shared/HeroSection';
import { DisconnectButton } from '../DisconnectButton';

// State C — connected. Margaret-Howell-restraint card showing account
// name, scopes, connected date; disconnect button zeros the refresh
// token here and at Google and falls back to public signals next scan.

export type ConnectionData = {
  gmcAccountId: string | null;
  gmcAccountName: string | null;
  connectedAt: string;
  scopes: string[];
};

export function ConnectedHero() {
  return (
    <HeroSection
      eyebrow="Connected"
      heading={
        <>
          Your{' '}
          <HeroBracketShimmer>Merchant Center</HeroBracketShimmer>{' '}
          is wired in.
        </>
      }
      body={
        <>
          Each scan now reads Google&rsquo;s real reasons, not our model.
          Disconnect anytime &mdash; your refresh token is zeroed and we
          fall back to public signals on the next scan.
        </>
      }
    />
  );
}

export function ConnectedBody({
  auditId,
  connection,
}: {
  auditId: string;
  connection: ConnectionData;
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
