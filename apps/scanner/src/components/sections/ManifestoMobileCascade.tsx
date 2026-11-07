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
 * IntersectionObserver (root = the track) marks the most-visible card active,
 * which drives the dots, the counter and aria-current. The prose fade is
 * separate and continuous: --prose-fade is a function of each card's distance
 * from the centre of the track, so swipe distance is the duration and a
 * half-swipe shows half-faded prose (2026-11-07 — was a boolean .is-active
 * class plus a 700ms transition the gesture did not control). Under
 * reduced-motion the property is never written and the fallback keeps the
 * prose fully readable, while the snap carousel — being structural —
 * remains. An sr-only prose copy per card keeps the content narrated
 * regardless of fade state.
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

  // Continuous swipe binding (2026-11-07). The observer above still picks
  // `active` for the dots, the counter and aria-current — a discrete value
  // that changes three times across the track, which is the right job for
  // React state. The prose fade is not that job. It is a continuous function
  // of how near a card sits to the centre of the track, written straight onto
  // each card element so the gesture drives it frame by frame and reverses
  // when you swipe back. Never React state: that would re-render three cards
  // and all 24 segment spans per frame, which is what the desktop chapter was
  // measured doing at 4.02ms/frame before 2026-11-07.
  //
  // Replaces `.is-active` + a 700ms transition with a 480ms delay. That made
  // the swipe a boolean trigger for a wall-clock animation the gesture no
  // longer controlled — scroll-as-trigger rather than scroll-as-duration, the
  // inversion that kept Flintmere from reading as a motion site.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || reducedMotion) return;
    const cards = Array.from(track.querySelectorAll<HTMLElement>('[data-card]'));
    if (cards.length === 0) return;

    const update = () => {
      const trackRect = track.getBoundingClientRect();
      const mid = trackRect.left + trackRect.width / 2;
      // Read every rect before writing any property — interleaving them
      // forces a reflow per card.
      const fades = cards.map((card) => {
        const r = card.getBoundingClientRect();
        const centre = r.left + r.width / 2;
        // Reach = one card width, so a single swipe spends exactly one card
        // of distance: fully faded at the centre, fully restored a card away.
        const reach = r.width || trackRect.width || 1;
        return Math.max(0, Math.min(1, 1 - Math.abs(centre - mid) / reach));
      });
      cards.forEach((card, i) => {
        card.style.setProperty('--prose-fade', String(fades[i]));
      });
    };

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };

    update();
    track.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      track.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

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
            className="manifesto-mobile-card"
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
