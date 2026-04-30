'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * CountUp — small client island for numerals-count-up motion (relaxation
 * axis #8 per ADR 0021). Animates the rendered text from 0 to `target`
 * with `Intl.NumberFormat` localisation, optional suffix.
 *
 * Trigger modes:
 *   - 'mount'    fires the moment the component is hydrated (above-the-
 *                fold cover percentages).
 *   - 'viewport' uses IntersectionObserver at 0.5 threshold (downstream
 *                chapters that the user scrolls into).
 *
 * Reduced-motion: respects `prefers-reduced-motion: reduce` by skipping
 * the animation and rendering the final value immediately. SSR output is
 * always the final value, so reduced-motion + no-JS users get the right
 * number from frame 0.
 *
 * Performance: rAF-driven; ~60 ticks/s only during the count window
 * (default 1200ms). One IntersectionObserver per instance, disconnected
 * once the count has fired.
 */

const DEFAULT_DURATION_MS = 1200;
const EASE_OUT_EXPO = (t: number) => 1 - Math.pow(1 - t, 4);

export interface CountUpProps {
  target: number;
  suffix?: string;
  durationMs?: number;
  trigger?: 'mount' | 'viewport';
  className?: string;
  style?: React.CSSProperties;
  /** Locale-aware formatting; defaults to en-GB. */
  locale?: string;
}

export function CountUp({
  target,
  suffix = '',
  durationMs = DEFAULT_DURATION_MS,
  trigger = 'viewport',
  className,
  style,
  locale = 'en-GB',
}: CountUpProps) {
  // SSR-safe: render the final value on the server / before hydration.
  const [value, setValue] = useState<number>(target);
  const elRef = useRef<HTMLSpanElement | null>(null);
  const firedRef = useRef<boolean>(false);
  const formatter = new Intl.NumberFormat(locale);

  useEffect(() => {
    // Reduced-motion: keep the final value, never animate.
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setValue(target);
      return;
    }

    const startCount = () => {
      if (firedRef.current) return;
      firedRef.current = true;

      const start = performance.now();
      setValue(0);
      let raf = 0;
      const tick = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(1, elapsed / durationMs);
        const eased = EASE_OUT_EXPO(progress);
        setValue(Math.round(eased * target));
        if (progress < 1) {
          raf = requestAnimationFrame(tick);
        }
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    };

    if (trigger === 'mount') {
      return startCount();
    }

    const el = elRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            startCount();
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, durationMs, trigger]);

  return (
    <span
      ref={elRef}
      className={className}
      style={style}
      aria-label={`${formatter.format(target)}${suffix}`}
    >
      <span aria-hidden="true">
        {formatter.format(value)}
        {suffix}
      </span>
    </span>
  );
}
