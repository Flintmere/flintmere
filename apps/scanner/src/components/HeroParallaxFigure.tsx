'use client';

/**
 * HeroParallaxFigure — Pattern 3 (subtle parallax) wrapper for the hero
 * `<figure>` containing the hero photoreal image.
 *
 * Spec source of truth (binding):
 *   context/design/motion/2026-04-27-three-patterns.md §Pattern 3.
 *
 * Contract:
 *   - 0.5× scroll velocity, ±40px clamp, transform-only (no opacity/scale).
 *   - IntersectionObserver gates listener attachment (off-screen = zero cost).
 *   - requestAnimationFrame coalesces scroll events.
 *   - JS-side `prefers-reduced-motion: reduce` bypass + `change` listener
 *     (Noor P0 binding — global CSS block does NOT cover JS scroll loops).
 *   - Single instance per page (the only parallax beat — ADR 0021 axis 8).
 *
 * The component renders a `<figure>` and `<figcaption>` so it's drop-in
 * compatible with the previous inline hero markup. Children must be a
 * single element (typically the `<Image>`).
 */

import { useEffect, useRef, type ReactNode } from 'react';

export interface HeroParallaxFigureProps {
  children: ReactNode;
  /**
   * Caption rendered as `<figcaption>` beneath the figure. Optional — overlay
   * layouts (where the figure is full-bleed and headlines sit on top of the
   * image) omit it. When omitted, no `<figcaption>` element is emitted.
   */
  caption?: string;
  className?: string;
}

const MAX_TRANSLATE = 40; // px — clamps prevent vestibular drift

export function HeroParallaxFigure({
  children,
  caption,
  className = 'hero-figure',
}: HeroParallaxFigureProps) {
  const figureRef = useRef<HTMLElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const figureEl = figureRef.current;
    const innerEl = innerRef.current;
    if (!figureEl || !innerEl) return;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

    let observer: IntersectionObserver | null = null;
    let isInViewport = false;
    let rafId: number | null = null;

    const updateTransform = () => {
      rafId = null;
      if (!isInViewport) return;
      const rect = figureEl.getBoundingClientRect();
      const figureCenterY = rect.top + rect.height / 2;
      const viewportCenterY = window.innerHeight / 2;
      const offset = (viewportCenterY - figureCenterY) * 0.5;
      const clamped = Math.max(-MAX_TRANSLATE, Math.min(MAX_TRANSLATE, offset));
      innerEl.style.transform = `translate3d(0, ${clamped}px, 0)`;
    };

    const onScroll = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(updateTransform);
      }
    };

    const attach = () => {
      // Hard bypass — reduced-motion users get the rest-state transform.
      if (mq.matches) {
        innerEl.style.transform = 'translate3d(0, 0, 0)';
        return;
      }
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              isInViewport = true;
              window.addEventListener('scroll', onScroll, { passive: true });
              updateTransform();
            } else {
              isInViewport = false;
              window.removeEventListener('scroll', onScroll);
              if (rafId !== null) {
                window.cancelAnimationFrame(rafId);
                rafId = null;
              }
            }
          }
        },
        { threshold: 0 },
      );
      observer.observe(figureEl);
    };

    const detach = () => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      window.removeEventListener('scroll', onScroll);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      innerEl.style.transform = 'translate3d(0, 0, 0)';
    };

    attach();

    // Listen for OS reduced-motion toggle mid-session — bail + reset.
    const onMqChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        detach();
      } else {
        attach();
      }
    };
    mq.addEventListener('change', onMqChange);

    return () => {
      detach();
      mq.removeEventListener('change', onMqChange);
    };
  }, []);

  return (
    <figure ref={figureRef} className={className}>
      <div ref={innerRef} style={{ willChange: 'transform' }}>
        {children}
      </div>
      {caption ? (
        <figcaption className="hero-caption mt-4 max-w-[40ch]">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
