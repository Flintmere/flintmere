'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * MarketingStickyCta — slim persistent CTA bar for long-scroll marketing
 * surfaces (2026-05-03).
 *
 * Why it exists. The marketing chapters on the home and /audit run
 * several viewports of editorial scroll past the hero (pillar wheel pin,
 * manifesto cascade, deliverables, how-it-works). The hero CTA scrolls
 * away early and the SiteHeader is non-sticky, so a primary action isn't
 * reachable from most of the page. This bar is the smallest structural
 * fix — one CTA, always reachable past the hero, never inside the
 * editorial frames themselves.
 *
 * Reveal contract. Visible from the moment the hero scrolls past upward
 * until the SiteFooter enters the viewport. The footer carries the
 * locked closing `Flintmere]` wordmark chord — the bar must not cover
 * it. Anchored to elements (not vh constants) so it works on mobile
 * where the hero stacks taller than 100vh.
 *
 * Same-page anchor hide. When `href` starts with `#`, the destination is
 * also observed — the bar hides while the destination is in view. A
 * "Book the audit ↑" pointer is noise when the user is already at the
 * bands.
 *
 * Reduced motion. The reveal honours prefers-reduced-motion via
 * globals.css §Reduced motion soft contract — `transition: none`
 * cascades onto the bar. The bar still appears at threshold; only the
 * fade animation is suppressed.
 *
 * Accessibility. `aria-hidden` flips while collapsed so screen readers
 * don't announce a duplicate CTA before scroll. Tab order picks it up
 * only once revealed.
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
      aria-hidden={!revealed}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        background: 'var(--color-paper)',
        borderBottom: '1px solid var(--color-line)',
        paddingLeft: 'clamp(20px, 4vw, 48px)',
        paddingRight: 'clamp(12px, 2vw, 24px)',
        paddingTop: 'clamp(10px, 1vw, 14px)',
        paddingBottom: 'clamp(10px, 1vw, 14px)',
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(-100%)',
        transition:
          'opacity var(--duration-short) var(--ease-sharp), transform var(--duration-short) var(--ease-sharp)',
        pointerEvents: revealed ? 'auto' : 'none',
      }}
    >
      <Link
        href="/"
        aria-label="Flintmere home"
        className="font-medium tracking-tight text-[color:var(--color-ink)] truncate"
        style={{ fontSize: 'clamp(14px, 1.1vw, 16px)' }}
        tabIndex={revealed ? 0 : -1}
      >
        Flintmere
        <span className="font-mono font-bold" aria-hidden="true">
          ]
        </span>
      </Link>

      <Link
        href={href}
        tabIndex={revealed ? 0 : -1}
        className="inline-flex items-center gap-2 bg-[color:var(--color-accent)] text-[color:var(--color-accent-ink)] font-mono font-medium uppercase hover:bg-[color:var(--color-paper-on-ink)] hover:text-[color:var(--color-ink)] transition-colors duration-[var(--duration-instant)] ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent-sage)] whitespace-nowrap"
        style={{
          fontSize: 'clamp(11px, 1vw, 12px)',
          letterSpacing: '0.14em',
          paddingLeft: 'clamp(14px, 1.6vw, 22px)',
          paddingRight: 'clamp(14px, 1.6vw, 22px)',
          paddingTop: 'clamp(8px, 0.9vw, 11px)',
          paddingBottom: 'clamp(8px, 0.9vw, 11px)',
        }}
      >
        {label}
        <span aria-hidden="true">{glyph}</span>
      </Link>
    </nav>
  );
}
