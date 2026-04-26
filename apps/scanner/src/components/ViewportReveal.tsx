'use client';

import { useEffect, useRef } from 'react';
import * as React from 'react';

/**
 * ViewportReveal — toggles `.is-visible` on children when they scroll into view.
 *
 * Two child patterns observed:
 *   - `.text-outlined--reveal` — the hero [ invisible ] outlined-text reveal.
 *   - `[data-reveal]` — generic reveal for sections (Numbers strip, Pillar rows,
 *     Audit-deep figure + deliverables). Pairs with the [data-reveal] CSS
 *     contract in globals.css (opacity + translateY transition with optional
 *     --reveal-delay for stagger).
 *
 * Accessibility: IntersectionObserver only toggles a class; the global
 * @media (prefers-reduced-motion: reduce) block in globals.css scales
 * transition-duration to 0.01ms for reduced-motion users, who land on the
 * end-state instantly. SSR output is always legible.
 */

interface ViewportRevealProps {
  children: React.ReactNode;
  /** IntersectionObserver root-margin (when to trip the reveal). */
  rootMargin?: string;
  /** Class name to toggle. Default: is-visible. */
  toggleClass?: string;
  /** Trip threshold 0..1. Default: 0.5 (half the element onscreen). */
  threshold?: number;
}

export function ViewportReveal({
  children,
  rootMargin = '0px 0px -20% 0px',
  toggleClass = 'is-visible',
  threshold = 0.5,
}: ViewportRevealProps) {
  const hostRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const outlined = host.querySelectorAll<HTMLElement>('.text-outlined--reveal');
    const generic = host.querySelectorAll<HTMLElement>('[data-reveal]');
    const targets = [...Array.from(outlined), ...Array.from(generic)];
    if (targets.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add(toggleClass);
          }
        }
      },
      { rootMargin, threshold },
    );

    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [rootMargin, threshold, toggleClass]);

  return (
    <span ref={hostRef} style={{ display: 'contents' }}>
      {children}
    </span>
  );
}
