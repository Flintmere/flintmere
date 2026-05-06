type Variant = 'pre-connect' | 'connected';

const ITEMS: Record<Variant, ReadonlyArray<{ k: string; v: string }>> = {
  connected: [
    { k: 'What we read', v: 'Account state · disapproval reasons · per-product status' },
    { k: 'What we don’t', v: 'Customer data · order data · ad spend · writes to your account' },
    { k: 'Refresh token', v: 'AES-256-GCM at rest · zeroed on disconnect' },
  ],
  'pre-connect': [
    { k: 'OAuth scope', v: 'auth/content · read methods only' },
    { k: 'Refresh token', v: 'AES-256-GCM at rest · isolated key' },
    { k: 'Revoke', v: 'Disconnect zeros the token here and at Google' },
  ],
};

export function ScopeCredits({ variant }: { variant: Variant }) {
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
      {ITEMS[variant].map((it) => (
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
