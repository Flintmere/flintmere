import type { SignalResult } from '../_signals/types';
import { StatusPill } from './StatusPill';

interface Props {
  title: string;
  signal: SignalResult;
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  return `${Math.round(seconds / 3600)}h ago`;
}

export function HealthCard({ title, signal }: Props) {
  const isExternal = signal.sourceUrl.startsWith('http');
  return (
    <article
      style={{
        border: '1px solid var(--color-line)',
        background: 'var(--color-paper)',
        padding: '1.25rem 1.25rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        minHeight: '11rem',
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '15px',
            fontWeight: 500,
            letterSpacing: '-0.005em',
          }}
        >
          {title}
        </h2>
        <StatusPill status={signal.status} />
      </header>

      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          lineHeight: 1.45,
          color: 'var(--color-ink-2)',
          flexGrow: 1,
        }}
      >
        {signal.metric}
      </p>

      {signal.errorMessage ? (
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--color-mute)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {signal.errorMessage}
        </p>
      ) : null}

      <footer
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '0.5rem',
          borderTop: '1px solid var(--color-line-soft)',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          letterSpacing: '0.06em',
        }}
      >
        <span style={{ color: 'var(--color-mute)' }}>
          {relativeTime(signal.fetchedAt)}
        </span>
        <a
          href={signal.sourceUrl}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          style={{
            color: 'var(--color-ink)',
            textDecoration: 'underline',
            textUnderlineOffset: '3px',
            textTransform: 'uppercase',
          }}
        >
          Open →
        </a>
      </footer>
    </article>
  );
}
