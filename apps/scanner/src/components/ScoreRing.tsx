/**
 * ScoreRing — the one signature motion on the scanner surface.
 *
 * Renders a conic-gradient ring fill with a Geist numeral in the centre.
 * Static by default; animates on mount when the score arrives
 * (respects prefers-reduced-motion — see memory/design/motion.md).
 */

'use client';

import { useEffect, useState } from 'react';

export interface ScoreRingProps {
  score: number;
  /** 0–100. Defaults to score. */
  targetFill?: number;
  grade?: string;
  /** Diameter in px. Default 220. */
  size?: number;
  /** Whether to animate the fill. Default true. */
  animate?: boolean;
  className?: string;
}

export function ScoreRing({
  score,
  targetFill,
  grade,
  size = 220,
  animate = true,
  className = '',
}: ScoreRingProps) {
  const target = Math.max(0, Math.min(100, targetFill ?? score));
  const [fill, setFill] = useState(animate ? 0 : target);
  const [count, setCount] = useState(animate ? 0 : score);

  useEffect(() => {
    if (!animate) return;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      setFill(target);
      setCount(score);
      return;
    }

    const start = performance.now();
    const duration = 600;
    let raf = 0;

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setFill(target * eased);
      setCount(Math.round(score * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [animate, score, target]);

  const pct = fill.toFixed(1);

  return (
    <div
      role="img"
      aria-label={`AI-readiness score: ${score} out of 100${grade ? `, grade ${grade}` : ''}`}
      className={`relative grid place-items-center ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `conic-gradient(var(--color-accent) 0 ${pct}%, var(--color-line-soft) ${pct}% 100%)`,
      }}
    >
      <div
        className="grid place-items-center bg-[color:var(--color-paper)] rounded-full"
        style={{
          width: size - 20,
          height: size - 20,
          border: '1px solid var(--color-line)',
        }}
      >
        <div className="text-center">
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: size * 0.38,
              fontWeight: 500,
              letterSpacing: '-0.05em',
              lineHeight: 1,
              color: 'var(--color-ink)',
            }}
          >
            {count}
          </div>
          <div className="eyebrow mt-2">of 100</div>
        </div>
      </div>
    </div>
  );
}
