import type { SignalStatus } from '../_signals/types';

// Status communicated by colour + dot + LABEL TEXT redundantly so the
// pill survives forced-colors mode and screen readers. Text is ink on
// paper (AAA on canon tokens); the dot carries the semantic colour
// but only as a non-meaning-carrying decoration since the label is
// the source of truth (Noor #8).
const STYLES: Record<
  SignalStatus,
  { dot: string; border: string; label: string }
> = {
  ok: {
    dot: 'var(--color-ok)',
    border: 'var(--color-line-soft)',
    label: 'OK',
  },
  warn: {
    dot: 'var(--color-accent)',
    border: 'var(--color-ink)',
    label: 'WARN',
  },
  error: {
    dot: 'var(--color-alert)',
    border: 'var(--color-ink)',
    label: 'ERROR',
  },
  unknown: {
    dot: 'var(--color-mute-2)',
    border: 'var(--color-line-soft)',
    label: 'UNKNOWN',
  },
};

export function StatusPill({ status }: { status: SignalStatus }) {
  const s = STYLES[status];
  return (
    <span
      role="status"
      aria-label={`signal ${s.label.toLowerCase()}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '2px 8px',
        background: 'var(--color-paper)',
        color: 'var(--color-ink)',
        border: `1px solid ${s.border}`,
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        fontWeight: 500,
        letterSpacing: '0.14em',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: s.dot,
          flex: '0 0 8px',
        }}
      />
      {s.label}
    </span>
  );
}
