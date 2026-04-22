import type { ReactNode } from 'react';
import { island } from './tokens';

// IslandFrame — the container that separates a Flintmere-owned region
// from the surrounding Polaris chrome. 1px ink hairline, paper canvas,
// sharp corners. DESIGN.md §Shopify app island rule.

export function IslandFrame({
  eyebrow,
  children,
}: {
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        background: island.paper,
        border: `1px solid ${island.line}`,
        padding: 28,
        fontFamily: island.fontSans,
        color: island.ink,
      }}
    >
      {eyebrow ? (
        <p
          style={{
            fontFamily: island.fontMono,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: island.mute,
            margin: 0,
            marginBottom: 20,
          }}
        >
          {eyebrow}
        </p>
      ) : null}
      {children}
    </div>
  );
}
