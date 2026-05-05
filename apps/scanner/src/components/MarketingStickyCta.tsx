'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * MarketingStickyCta — bottom-right floating CTA pill (rev 2,
 * 2026-05-05).
 *
 * Why it exists. The marketing chapters on the home and /audit run
 * several viewports of editorial scroll past the hero. The header CTA
 * scrolls away; without a follower, the primary action vanishes mid-
 * page. This component is that follower.
 *
 * Why bottom-right pill (not top bar). The original rev was a slim
 * full-width top bar with wordmark + CTA. Operator caught it 2026-05-05
 * as "intrusive" — the bar reads as corporate header chrome, covers
 * content, and competes with the editorial frame above. The replacement
 * is the canonical non-intrusive-but-visible pattern: a small amber
 * pill anchored to the bottom-right corner, ~44px tall (touch target),
 * appears after the hero scrolls past, fades out as the footer chord
 * approaches. No wordmark — the header already carries the brand at
 * the top of the page and the footer carries the locked closing chord
 * at the bottom; the pill is purely the action.
 *
 * Reveal contract.
 *  - Hidden initially (no flash on first paint, no LCP hit).
 *  - Reveals once the hero scrolls past upward.
 *  - Hides when the SiteFooter enters viewport — the closing
 *    `Flintmere]` wordmark must own the bottom of the page.
 *  - Hides when an in-page destination (href starting with `#`) is
 *    already in view — pointing users at where they already are is
 *    noise.
 *
 * Accessibility.
 *  - `inert={!revealed}` — removes the pill from the a11y tree AND the
 *    tab order while collapsed. React 19 first-class.
 *  - `aria-label` on the <nav> ("Persistent primary action").
 *
 * Reduced motion. The fade + slide honours
 * `prefers-reduced-motion: reduce` via the global @media block in
 * globals.css (transition-duration scales to 0.01ms). The pill still
 * appears at threshold; only the animation is suppressed.
 *
 * Safe area. Mobile bottom uses `env(safe-area-inset-bottom)` so the
 * pill sits above iPhone home-indicator gestures.
 */

interface MarketingStickyCtaProps {
  href: string;
  label: string;
  /** Hash anchor links use →; back-to-anchor links use ↑. */
  glyph?: '→' | '↑';
}

export function MarketingStickyCta({
  href,
  label,
  glyph = '→',
}: MarketingStickyCtaProps) {
  const [heroPast, setHeroPast] = useState(false);
  const [footerInView, setFooterInView] = useState(false);
  const [destinationInView, setDestinationInView] = useState(false);

  useEffect(() => {
    const hero = document.getElementById('hero');
    const footer = document.querySelector<HTMLElement>(
      'footer[aria-label="Site footer"]',
    );
    const destination = href.startsWith('#')
      ? document.getElementById(href.slice(1))
      : null;
    if (!hero) return;

    const heroObs = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setHeroPast(
          !entry.isIntersecting && entry.boundingClientRect.top < 0,
        );
      },
      { threshold: 0 },
    );
    heroObs.observe(hero);

    let footerObs: IntersectionObserver | undefined;
    if (footer) {
      footerObs = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return;
          setFooterInView(entry.isIntersecting);
        },
        { threshold: 0 },
      );
      footerObs.observe(footer);
    }

    let destObs: IntersectionObserver | undefined;
    if (destination) {
      destObs = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return;
          setDestinationInView(entry.isIntersecting);
        },
        { threshold: 0 },
      );
      destObs.observe(destination);
    }

    return () => {
      heroObs.disconnect();
      footerObs?.disconnect();
      destObs?.disconnect();
    };
  }, [href]);

  const revealed = heroPast && !footerInView && !destinationInView;

  return (
    <nav
      aria-label="Persistent primary action"
      inert={!revealed}
      style={{
        position: 'fixed',
        right: 'clamp(16px, 2.5vw, 32px)',
        bottom: 'max(clamp(16px, 2.5vw, 32px), env(safe-area-inset-bottom, 0px))',
        zIndex: 30,
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(12px)',
        transition:
          'opacity var(--duration-short) var(--ease-sharp), transform var(--duration-short) var(--ease-sharp)',
        pointerEvents: revealed ? 'auto' : 'none',
      }}
    >
      <Link
        href={href}
        className="inline-flex items-center gap-2 bg-[color:var(--color-accent)] text-[color:var(--color-accent-ink)] font-mono font-medium uppercase hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-paper)] transition-colors duration-[var(--duration-instant)] ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent-sage)] whitespace-nowrap"
        style={{
          fontSize: 'clamp(12px, 1vw, 13px)',
          letterSpacing: '0.14em',
          paddingLeft: 'clamp(16px, 1.8vw, 22px)',
          paddingRight: 'clamp(16px, 1.8vw, 22px)',
          paddingTop: 12,
          paddingBottom: 12,
          minHeight: 44,
          // Subtle paper-1 elevation — restrained per ADR 0021 §1.
          boxShadow: 'var(--shadow-paper-1)',
        }}
      >
        {label}
        <span aria-hidden="true">{glyph}</span>
      </Link>
    </nav>
  );
}
