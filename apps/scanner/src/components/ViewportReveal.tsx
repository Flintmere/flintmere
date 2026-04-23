'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * ViewportReveal — toggles `.is-visible` on children when they scroll into view.
 * Pairs with `.text-outlined--reveal` for the [ invisible ] metaphor on the homepage.
 * Accessibility: IntersectionObserver only toggles a class; reduced-motion CSS
 * forces the visible state regardless, so SSR output is always legible.
 */

interface ViewportRevealProps {
  children: ReactNode;
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

    const targets = host.querySelectorAll<HTMLElement>('.text-outlined--reveal');
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
