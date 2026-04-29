'use client';

import { useRef, useState } from 'react';
import { useScroll, useMotionValueEvent, useReducedMotion } from 'motion/react';
import { PillarWheel, type PillarSpec } from './PillarWheel';

/**
 * PillarWheelScrollPin — Chapter 2 scroll-pin wrapper (2026-04-29).
 *
 * Wraps the PillarWheel in a tall scroll-runway container with the wheel
 * itself sticky-pinned at viewport top. As the user scrolls within the
 * runway, the active pillar cycles 0 → N-1 driven by scroll progress.
 *
 * Apple iPhone product page parallel: the camera focal-length gallery
 * scrub uses this exact pattern — a pinned visual + scroll-driven state
 * advance.
 *
 * Reduced-motion safety: when prefers-reduced-motion is reduce, the
 * scroll-driven advance is disabled and the wheel reverts to its
 * default click/keyboard interaction model (uncontrolled internal
 * state).
 *
 * Tuning:
 *   - SCROLL_PER_PILLAR_VH = 50 — each pillar gets 50vh of scroll
 *     attention. Total chapter 2 scroll runway = pillars.length × 50vh
 *     plus 100vh for the initial pin entry. With 7 pillars that's 450vh.
 */

const SCROLL_PER_PILLAR_VH = 50;

export interface PillarWheelScrollPinProps {
  pillars: PillarSpec[];
}

export function PillarWheelScrollPin({ pillars }: PillarWheelScrollPinProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    if (reducedMotion) return;
    const next = Math.min(
      pillars.length - 1,
      Math.max(0, Math.floor(progress * pillars.length)),
    );
    if (next !== active) setActive(next);
  });

  // Runway height = (1 base viewport + N pillars × per-pillar vh).
  // useScroll's "start start → end end" maps progress 0→1 to the scroll
  // distance (containerHeight - viewportHeight), so a 100vh sticky child
  // gets (containerHeight - 100vh) of scroll runway.
  const runwayVh = 100 + pillars.length * SCROLL_PER_PILLAR_VH;

  // Under reduced-motion, drop the pin entirely and let the wheel render
  // in normal flow at its natural height. Click/keyboard nav still works
  // because the controlled prop is `undefined` (passes through to internal
  // state in PillarWheel).
  if (reducedMotion) {
    return <PillarWheel pillars={pillars} />;
  }

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', height: `${runwayVh}vh` }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div
          className="mx-auto w-full max-w-[1280px]"
          style={{
            paddingLeft: 'clamp(24px, 5vw, 64px)',
            paddingRight: 'clamp(24px, 5vw, 64px)',
          }}
        >
          <PillarWheel
            pillars={pillars}
            active={active}
            onActiveChange={setActive}
          />
        </div>
      </div>
    </div>
  );
}
