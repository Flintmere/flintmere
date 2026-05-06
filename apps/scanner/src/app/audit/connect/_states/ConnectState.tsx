import { HeroSection, HeroBracketShimmer } from '../_shared/HeroSection';

// State B — verification cleared, no connection yet (FEATURE_GMC_OAUTH=true).
// The merchant lands here from their audit-delivery email post-verification.
// We render the OAuth start CTA. Read-only scope; disconnectable.

export function ConnectHero() {
  return (
    <HeroSection
      eyebrow="Step 2 — Connect"
      heading={
        <>
          Read directly from your{' '}
          <HeroBracketShimmer>Merchant Center</HeroBracketShimmer>.
        </>
      }
      body={
        <>
          Your audit shipped from public signals. Connect Google Merchant
          Center and every future scan re-reads your real account &mdash;
          disapprovals, account state, the reasons Google itself stated.
          Read-only. Disconnect anytime.
        </>
      }
    />
  );
}

export function ConnectBody({ auditId }: { auditId: string }) {
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
        You&rsquo;ll be redirected to Google. We never see your password,
        and we never call any method that writes to your account.
      </p>
    </div>
  );
}
