// Renders the post-OAuth-callback flash above the body content.
// `status` and `reason` arrive as URL params from /api/auth/google/callback.

export function StatusBanner({
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
    body = 'We read your Merchant Center the next time your catalog letter is regenerated.';
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
      'Google accepted consent but rejected the token exchange. This usually means the OAuth client is misconfigured. Please reply to your catalog letter email and we’ll resolve.';
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
