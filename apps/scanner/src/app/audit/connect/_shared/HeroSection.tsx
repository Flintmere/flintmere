import type { ReactNode } from 'react';
import { Bracket } from '@flintmere/ui';

// Shared hero scaffold for the three /audit/connect states.
// Each state supplies eyebrow + heading + body; padding, type scale,
// and bracket-shimmer wrapping are centralised here so visual canon
// stays consistent across pre-verification, connect, and connected.

export function HeroSection({
  eyebrow,
  heading,
  body,
}: {
  eyebrow: string;
  heading: ReactNode;
  body: ReactNode;
}) {
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
        <p className="eyebrow-hero" style={{ color: 'var(--color-mute)' }}>
          {eyebrow}
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
          {heading}
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
          {body}
        </p>
      </div>
    </section>
  );
}

export function HeroBracketShimmer({ children }: { children: ReactNode }) {
  return (
    <span
      className="flintmere-outline-shimmer"
      style={{
        display: 'inline-block',
        fontFamily: 'var(--font-mono, ui-monospace, Menlo, monospace)',
        fontWeight: 700,
      }}
    >
      <Bracket>{children}</Bracket>
    </span>
  );
}
