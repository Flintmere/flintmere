import type { ReactElement } from 'react';

// Shared OpenGraph card template (1200x630) for nav-route social previews.
// Hex literals mirror --color-paper / --color-accent / --color-ink. Next.js OG
// generation runs in a satori context that doesn't read CSS variables, so literal
// hex is the only option. Keep in sync with globals.css @theme if those tokens move.
// The bracketed display word renders in Geist (display); only the [ ] hairlines are
// GeistMono — this matches the existing root + /scan OG family for share-series
// continuity, even though on-page .bracket sets the whole token in mono.

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = 'image/png';

const AMBER = '#F8BF24';
const PAPER = '#F7F7F4';
const INK = '#0A0A0A';

export type ClaimSegment = { text: string } | { bracket: string };
export type OgVariant = 'amber' | 'paper';

export interface OgCardContent {
  /** amber = diagnostic/product register (matches /scan); paper = editorial/authority */
  variant: OgVariant;
  /** rendered as `Flintmere // <eyebrowSuffix>` */
  eyebrowSuffix: string;
  /** display claim size in px — set per card so the longest line fits 1040px */
  fontSize: number;
  /** display claim, one inner array per line; { bracket } = legibility-bracket token */
  lines: ClaimSegment[][];
  footerUrl: string;
  /** complete, meaningful alt text (Noor #8) */
  alt: string;
}

export function renderOgCard(c: OgCardContent): ReactElement {
  const bg = c.variant === 'amber' ? AMBER : PAPER;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: bg,
        color: INK,
        padding: '72px 80px',
        justifyContent: 'space-between',
        fontFamily: 'Geist',
      }}
    >
      {/* top row — mono eyebrow */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          fontFamily: 'GeistMono',
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: 2,
          textTransform: 'uppercase',
        }}
      >
        <span>Flintmere</span>
        <span style={{ opacity: 0.55 }}>//</span>
        <span style={{ opacity: 0.8 }}>{c.eyebrowSuffix}</span>
      </div>

      {/* display claim */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {c.variant === 'paper' && (
          // amber under-tick: the one accent on a paper card. Decorative block, not
          // text — sidesteps the amber-on-paper contrast floor (Noor #8).
          <div
            style={{
              display: 'flex',
              width: 56,
              height: 8,
              backgroundColor: AMBER,
              marginBottom: 28,
            }}
          />
        )}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Geist',
            fontWeight: 700,
            fontSize: c.fontSize,
            lineHeight: 0.98,
            letterSpacing: -3,
          }}
        >
          {c.lines.map((line, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline' }}>
              {line.map((seg, j) =>
                'bracket' in seg ? (
                  <span key={j} style={{ display: 'flex', alignItems: 'baseline' }}>
                    <span style={{ fontFamily: 'GeistMono', fontWeight: 700, marginRight: 6 }}>
                      [
                    </span>
                    {seg.bracket}
                    <span style={{ fontFamily: 'GeistMono', fontWeight: 700, marginLeft: 6 }}>
                      ]
                    </span>
                  </span>
                ) : (
                  <span key={j} style={{ whiteSpace: 'pre' }}>
                    {seg.text}
                  </span>
                ),
              )}
            </div>
          ))}
        </div>
      </div>

      {/* footer — asymmetric wordmark + route URL */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          fontFamily: 'Geist',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            fontWeight: 500,
            fontSize: 36,
            letterSpacing: -1,
          }}
        >
          <span>Flintmere</span>
          <span style={{ fontFamily: 'GeistMono', fontWeight: 700, marginLeft: 2 }}>]</span>
        </div>
        <div
          style={{
            display: 'flex',
            fontFamily: 'GeistMono',
            fontWeight: 400,
            fontSize: 22,
            opacity: 0.7,
          }}
        >
          {c.footerUrl}
        </div>
      </div>
    </div>
  );
}
