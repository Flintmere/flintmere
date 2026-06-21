'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Example } from './ManifestoChord';

/**
 * ManifestoMobileCascade — mobile (<lg) swipe-snap carousel.
 *
 * The desktop #8 live-cascade + #4 pin is desktop-only by canon (a 400vh
 * pinned runway reads as "stuck" on a phone, and the flat fallback was three
 * near-identical text walls — "it loses the design it has on desktop").
 * This is the mobile-native form: a horizontal scroll-snap track, one example
 * per card, peek of the next + a NN/NN counter and dots. Each card ENACTS the
 * metaphor on snap — the marketing prose recedes (opacity → 0.12 after a
 * hold) while the amber data-tokens stay lit ("only structured data
 * registers"). The swipe is the advance the desktop got from scroll.
 *
 * IntersectionObserver (root = the track) marks the most-visible card active;
 * the CSS (.manifesto-mobile-card.is-active) drives the prose fade. Under
 * reduced-motion the fade is skipped (prose stays readable) but the snap
 * carousel — being structural — remains. An sr-only prose copy per card keeps
 * the content narrated regardless of fade state.
 *
 * Containment: the track lives inside .flintmere-curtain-pair, whose
 * relative/isolate context lets a scroll container's overflow leak page width;
 * globals.css clips the pair on mobile (§Manifesto mobile cascade).
 *
 * References (council pre-flight, lead #6 Idris): apple.com/ipad-mini (snap
 * one beat at a time), order-form.shop (grid-as-readout cards), linear.app
 * (peek + counter as the only chrome).
 */
export function ManifestoMobileCascade({
  examples,
  renderSegments,
  reducedMotion,
}: {
  examples: Example[];
  renderSegments: (ex: Example) => ReactNode;
  reducedMotion: boolean;
}) {
  const trackRef = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const cards = Array.from(track.querySelectorAll<HTMLElement>('[data-card]'));
    if (cards.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        let best = -1;
        let bestRatio = 0;
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            best = Number((entry.target as HTMLElement).dataset.index);
          }
        }
        if (best >= 0) setActive(best);
      },
      { root: track, threshold: [0.55, 0.85] },
    );
    cards.forEach((card) => io.observe(card));
    return () => io.disconnect();
  }, []);

  const goTo = (i: number) => {
    const card = trackRef.current?.querySelector<HTMLElement>(
      `[data-index="${i}"]`,
    );
    card?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      inline: 'start',
      block: 'nearest',
    });
  };

  return (
    <div style={{ marginTop: 'clamp(28px, 4vh, 56px)' }}>
      <ol
        ref={trackRef}
        className="manifesto-carousel list-none m-0 p-0"
        aria-label="Catalog page examples — what AI agents extract. Swipe horizontally."
        aria-roledescription="carousel"
        tabIndex={0}
      >
        {examples.map((ex, i) => (
          <li
            key={i}
            data-card
            data-index={i}
            className={`manifesto-mobile-card${
              !reducedMotion && i === active ? ' is-active' : ''
            }`}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${examples.length} — ${ex.category}`}
          >
            <p
              className="font-mono uppercase"
              style={{
                fontSize: 11,
                letterSpacing: '0.18em',
                fontWeight: 500,
                color: 'var(--color-mute)',
                margin: 0,
              }}
              aria-hidden="true"
            >
              // {ex.numeral} · {ex.category}
            </p>
            <span className="sr-only">{ex.prose}</span>
            <p
              className="font-sans"
              aria-hidden="true"
              style={{
                fontSize: 'clamp(16px, 4.2vw, 19px)',
                lineHeight: 1.5,
                letterSpacing: '-0.005em',
                color: 'var(--color-mute)',
                margin: 0,
              }}
            >
              {renderSegments(ex)}
            </p>
          </li>
        ))}
      </ol>

      {/* Chrome — dots (tap to jump, ≥44px targets) + NN/NN counter. */}
      <div
        className="flex items-center justify-between"
        style={{ marginTop: 12 }}
      >
        <div className="manifesto-carousel-dots" aria-hidden="true">
          {examples.map((ex, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show ${ex.category}`}
              aria-current={i === active ? true : undefined}
              onClick={() => goTo(i)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 44,
                minHeight: 44,
                border: 0,
                background: 'transparent',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <span
                className="manifesto-carousel-dot"
                data-active={i === active}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
        <p
          className="font-mono"
          aria-hidden="true"
          style={{
            fontSize: 11,
            letterSpacing: '0.16em',
            color: 'var(--color-mute)',
          }}
        >
          {String(active + 1).padStart(2, '0')} /{' '}
          {String(examples.length).padStart(2, '0')}
        </p>
      </div>
    </div>
  );
}
