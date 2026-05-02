'use client';

import { useEffect, useRef, useState } from 'react';
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
 * Mobile safety (added 2026-05-02): below the lg breakpoint the
 * wheel + spotlight panel stacks vertically, and the combined content
 * exceeds the 100vh sticky child — `overflow: hidden` on the sticky
 * box clipped the panel's headline + body off-screen ("reads half cut",
 * operator caught on iPhone 14 Pro Max). The bypass renders the wheel
 * in normal flow with native click/keyboard nav, same as the
 * reduced-motion path. No scroll runway, no pin, no clipping.
 *
 * Tuning:
 *   - SCROLL_PER_PILLAR_VH = 50 — each pillar gets 50vh of scroll
 *     attention. Total chapter 2 scroll runway = pillars.length × 50vh
 *     plus 100vh for the initial pin entry. With 7 pillars that's 450vh.
 */

const SCROLL_PER_PILLAR_VH = 50;
// The wheel's lg-breakpoint matches PillarWheel's grid `lg:grid-cols-[1fr_1fr]`.
// Below this, the side-by-side layout stacks and the 100vh sticky clips.
const PIN_MIN_VIEWPORT_PX = 1024;

export interface PillarWheelScrollPinProps {
  pillars: PillarSpec[];
}

export function PillarWheelScrollPin({ pillars }: PillarWheelScrollPinProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const reducedMotion = useReducedMotion();
  const [narrowViewport, setNarrowViewport] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(`(max-width: ${PIN_MIN_VIEWPORT_PX - 1}px)`);
    const apply = () => setNarrowViewport(mql.matches);
    apply();
    mql.addEventListener('change', apply);
    return () => mql.removeEventListener('change', apply);
  }, []);

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

  // Drop the pin entirely on reduced-motion OR narrow viewports. Click/
  // keyboard nav still works because the controlled prop is `undefined`
  // (passes through to internal state in PillarWheel). Mirror the desktop
  // wrapper's padding so the spotlight panel doesn't bleed to the viewport
  // edge on phones (operator caught 2026-05-02 — pillar prose hugged the
  // left edge with no breathing room).
  if (reducedMotion || narrowViewport) {
    return (
      <div
        className="mx-auto w-full max-w-[1280px]"
        style={{
          paddingLeft: 'clamp(24px, 5vw, 64px)',
          paddingRight: 'clamp(24px, 5vw, 64px)',
        }}
      >
        <PillarWheel pillars={pillars} />
      </div>
    );
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
