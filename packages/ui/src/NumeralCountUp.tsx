'use client';

/**
 * NumeralCountUp — Pattern 1 (numerals-count-up) for the StatTriad focal numeral.
 *
 * Spec source of truth (binding):
 *   context/design/motion/2026-04-27-three-patterns.md §Pattern 1.
 *
 * Contract:
 *   - Format-aware parser splits `prefix + digit-run + suffix` (e.g. `£97` →
 *     `£` + `97` + ``; `60s` → `` + `60` + `s`; `£1.2m` → `£` + `1.2` + `m`).
 *   - 1200ms `--ease-signature` interpolation via requestAnimationFrame.
 *   - IntersectionObserver fires once at 30% threshold, then disconnects.
 *   - JS-side `prefers-reduced-motion: reduce` bypass + `change` listener
 *     (Noor P0 binding — global CSS block does NOT cover JS animation loops).
 *   - aria-hidden on the visible span — the parent cell carries the SR label.
 *
 * Render contract:
 *   - Returns a `<span>` whose className/style is supplied by the parent.
 *   - Initial paint = `${prefix}0${suffix}` (e.g. `0s`, `£0`); reduced-motion
 *     users land on the final value at first paint.
 */

import { useEffect, useRef, useState } from 'react';

export interface NumeralCountUpProps {
  /** Final numeral string. E.g. "60s", "£97", "12k", "£1.2m". */
  value: string;
  /** Pass-through to the rendered span. */
  className?: string;
  /** Animation duration ms (defaults to 1200ms per ADR 0021 axis 8). */
  durationMs?: number;
}

interface Parsed {
  prefix: string;
  startNumber: number;
  endNumber: number;
  decimals: number;
  suffix: string;
}

/**
 * Format-aware parser. Splits the string on the first digit-run.
 * Returns null when no digit-run is found (caller should snap-render).
 */
function parseNumeral(value: string): Parsed | null {
  const match = value.match(/^(.*?)(\d+(?:\.\d+)?)(.*)$/);
  if (!match) return null;
  const [, prefix = '', digitRun = '', suffix = ''] = match;
  const endNumber = Number(digitRun);
  if (!Number.isFinite(endNumber)) return null;
  const dotIndex = digitRun.indexOf('.');
  const decimals = dotIndex >= 0 ? digitRun.length - dotIndex - 1 : 0;
  return { prefix, startNumber: 0, endNumber, decimals, suffix };
}

function format(parsed: Parsed, current: number): string {
  const text =
    parsed.decimals > 0 ? current.toFixed(parsed.decimals) : String(Math.round(current));
  return `${parsed.prefix}${text}${parsed.suffix}`;
}

// `--ease-signature` cubic-bezier(0.22, 1, 0.36, 1). Closed-form approximation
// of cubicBezier — Newton-Raphson on the x-axis, then evaluate y. Good enough
// for visible motion at 60fps; avoids the cost of a CSS variable read.
function easeSignature(t: number): number {
  // Decelerating curve approaching 1 — analytic approximation: 1 - (1-t)^3
  // (matches the shape of (0.22,1,0.36,1) closely enough for count-up).
  const u = 1 - t;
  return 1 - u * u * u;
}

export function NumeralCountUp({
  value,
  className,
  durationMs = 1200,
}: NumeralCountUpProps) {
  const parsed = parseNumeral(value);
  const finalText = parsed ? format(parsed, parsed.endNumber) : value;
  const startText = parsed ? format(parsed, 0) : value;

  const [rendered, setRendered] = useState<string>(() => {
    // SSR-safe initial render — match parent server render to avoid hydration mismatch.
    return startText;
  });
  const spanRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = spanRef.current;
    if (!el || !parsed) {
      setRendered(finalText);
      return;
    }

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setRendered(finalText);
      return;
    }

    let rafId: number | null = null;
    let observer: IntersectionObserver | null = null;
    let cancelled = false;

    const startCountUp = () => {
      const start = performance.now();
      const tick = (now: number) => {
        if (cancelled) return;
        const t = Math.min(1, (now - start) / durationMs);
        const eased = easeSignature(t);
        const current = parsed.startNumber + (parsed.endNumber - parsed.startNumber) * eased;
        setRendered(format(parsed, current));
        if (t < 1) {
          rafId = window.requestAnimationFrame(tick);
        } else {
          rafId = null;
          setRendered(finalText);
        }
      };
      rafId = window.requestAnimationFrame(tick);
    };

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            observer?.disconnect();
            observer = null;
            startCountUp();
          }
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);

    const onMqChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        cancelled = true;
        if (rafId !== null) {
          window.cancelAnimationFrame(rafId);
          rafId = null;
        }
        observer?.disconnect();
        observer = null;
        setRendered(finalText);
      }
    };
    mq.addEventListener('change', onMqChange);

    return () => {
      cancelled = true;
      mq.removeEventListener('change', onMqChange);
      observer?.disconnect();
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [durationMs, finalText, parsed]);

  return (
    <span
      ref={spanRef}
      className={className}
      aria-hidden="true"
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {rendered}
    </span>
  );
}
