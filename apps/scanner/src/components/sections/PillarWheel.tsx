'use client';

import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
  type Variants,
} from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { Bracket } from '@flintmere/ui';

/**
 * PillarWheel — Chapter 2 v8 (Apple-grade redesign, 2026-04-29).
 * Spec: context/design/extravagant/2026-04-29-chapter-2-pillars-wheel.md.
 *
 * Operator brief: "no holds barred something Apple would do without
 * even thinking about it." Reference: apple.com/uk/iphone gallery +
 * apple.com/uk/apple-watch-series-11.
 *
 * Three composition layers:
 *   Layer 1 — the wheel (interactive gallery; mirrors scanner ScoreRing).
 *   Layer 2 — the spotlight panel (Apple feature-card register: bold short
 *             headline + sage hairline + restrained body).
 *   Layer 3 — the modal (click-to-deep-dive; Apple iPhone modal pattern:
 *             eyebrow + bigger headline + extended body + what-to-do).
 *
 * Motion choreography:
 *   - Section entry: rings draw clockwise → wedges stagger-fade in journey
 *     order → centre stack assembles in beats → panel cascades.
 *   - Active change: AnimatePresence cross-fades centre + panel; under-
 *     tick re-plucks; headline slides up with Apple-grade weight.
 *   - Modal open: fullscreen overlay fades in, content cascades.
 *
 * Reduced-motion: <MotionConfig reducedMotion="user"> respects OS preference.
 */

export interface PillarSpec {
  name: string;
  headline: string;
  weight: string;
  weightPct: number;
  looksFor: string;
  commonMiss: string;
  whatToDo: string;
  image: string;
  imageAlt: string;
}

interface WedgeGeometry {
  pillar: PillarSpec;
  idx: number;
  startAngle: number;
  endAngle: number;
  midAngle: number;
  path: string;
  labelX: number;
  labelY: number;
  labelAnchor: 'start' | 'middle' | 'end';
}

const VIEW = 600;
const CENTER = VIEW / 2;
const OUTER_R = 260;
const INNER_R = 132;
const LABEL_OFFSET = 32;
const SAGE_RING_OUTER = OUTER_R + 10;
const SAGE_RING_INNER = INNER_R - 10;

const EASE = [0.4, 0, 0.2, 1] as const;
const APPLE_EASE = [0.16, 1, 0.3, 1] as const; // Apple's signature cubic

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function annulusWedge(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startAngle: number,
  endAngle: number,
): string {
  const startOuter = polar(cx, cy, rOuter, startAngle);
  const endOuter = polar(cx, cy, rOuter, endAngle);
  const startInner = polar(cx, cy, rInner, endAngle);
  const endInner = polar(cx, cy, rInner, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${startOuter.x.toFixed(2)} ${startOuter.y.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${endOuter.x.toFixed(2)} ${endOuter.y.toFixed(2)}`,
    `L ${startInner.x.toFixed(2)} ${startInner.y.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${endInner.x.toFixed(2)} ${endInner.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

function buildWedges(pillars: PillarSpec[]): WedgeGeometry[] {
  let cursor = 0;
  return pillars.map((pillar, idx) => {
    const sweep = pillar.weightPct * 360;
    const startAngle = cursor;
    const endAngle = cursor + sweep;
    cursor = endAngle;
    const midAngle = (startAngle + endAngle) / 2;
    const labelPoint = polar(CENTER, CENTER, OUTER_R + LABEL_OFFSET, midAngle);
    const cosMid = Math.cos(((midAngle - 90) * Math.PI) / 180);
    const labelAnchor: 'start' | 'middle' | 'end' =
      cosMid > 0.2 ? 'start' : cosMid < -0.2 ? 'end' : 'middle';
    return {
      pillar,
      idx,
      startAngle,
      endAngle,
      midAngle,
      path: annulusWedge(CENTER, CENTER, OUTER_R, INNER_R, startAngle, endAngle),
      labelX: labelPoint.x,
      labelY: labelPoint.y,
      labelAnchor,
    };
  });
}

const wheelGroupVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.35 },
  },
};

const wedgeVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.42, ease: EASE } },
};

const ringDrawTransition = { duration: 0.7, ease: EASE };

const centreStackVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, when: 'beforeChildren' },
  },
  exit: { opacity: 0, transition: { duration: 0.16 } },
};

const numeralVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.16 } },
};

const tickVariants: Variants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: [0, 1.18, 1],
    opacity: 1,
    transition: { duration: 0.4, times: [0, 0.7, 1], ease: EASE },
  },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.14 } },
};

// Apple-grade headline reveal: bigger Y delta, slower duration,
// signature cubic-bezier(0.16, 1, 0.3, 1) — Apple's "easeOutExpo"-adjacent
// easing that lands with confidence rather than acceleration.
const headlineVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: APPLE_EASE } },
  exit: { opacity: 0, y: -18, transition: { duration: 0.22 } },
};

const eyebrowVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.32, ease: EASE } },
  exit: { opacity: 0, transition: { duration: 0.14 } },
};

const sageBarVariants: Variants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: 0.5, ease: APPLE_EASE },
  },
  exit: { scaleX: 0, opacity: 0, transition: { duration: 0.18 } },
};

const panelVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
  exit: { opacity: 0, transition: { duration: 0.16 } },
};

const bodyLineVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: APPLE_EASE } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.16 } },
};

export function PillarWheel({ pillars }: { pillars: PillarSpec[] }) {
  const [active, setActive] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const titleId = useId();
  const descId = useId();
  const modalTitleId = useId();
  const wedges = useMemo(() => buildWedges(pillars), [pillars]);
  const safeActive = Math.min(active, pillars.length - 1);
  const activePillar = pillars[safeActive]!;
  const activeId = String(safeActive + 1).padStart(2, '0');
  const reduced = useReducedMotion();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const handleKey = useCallback(
    (e: KeyboardEvent<SVGGElement>, idx: number) => {
      const len = pillars.length;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((idx + 1) % len);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((idx - 1 + len) % len);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setActive(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setActive(len - 1);
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setActive(idx);
      }
    },
    [pillars.length],
  );

  // Modal — body scroll lock + ESC handler + focus management
  useEffect(() => {
    if (!modalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      triggerRef.current?.focus();
    };
  }, [modalOpen]);

  const viewportConfig = { once: true, amount: 0.3 };

  return (
    <MotionConfig reducedMotion="user">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-12 gap-y-12 lg:gap-y-0 items-center">
        {/* Wheel — right column on desktop, top on mobile */}
        <div className="order-1 lg:order-2 flex flex-col items-center">
          <div className="pillar-wheel relative w-full max-w-[600px] aspect-square">
            <svg
              viewBox={`0 0 ${VIEW} ${VIEW}`}
              role="group"
              aria-roledescription="pillar selector"
              aria-labelledby={titleId}
              aria-describedby={descId}
              className="w-full h-full block overflow-visible"
            >
              <title id={titleId}>Seven catalog-readiness pillars</title>
              <desc id={descId}>
                An interactive radial diagram. Each wedge represents one of
                seven scoring pillars; wedge size shows its weight in the
                final score. Use arrow keys to move between pillars, or
                click a wedge.
              </desc>

              <motion.circle
                cx={CENTER}
                cy={CENTER}
                r={SAGE_RING_OUTER}
                fill="none"
                stroke="var(--color-accent-sage)"
                strokeWidth={1}
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.7 }}
                viewport={viewportConfig}
                transition={ringDrawTransition}
                style={{
                  transform: 'rotate(-90deg)',
                  transformOrigin: `${CENTER}px ${CENTER}px`,
                }}
                aria-hidden="true"
              />
              <motion.circle
                cx={CENTER}
                cy={CENTER}
                r={SAGE_RING_INNER}
                fill="none"
                stroke="var(--color-accent-sage)"
                strokeWidth={1}
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.7 }}
                viewport={viewportConfig}
                transition={{ ...ringDrawTransition, delay: 0.15 }}
                style={{
                  transform: 'rotate(-90deg)',
                  transformOrigin: `${CENTER}px ${CENTER}px`,
                }}
                aria-hidden="true"
              />

              <motion.g
                variants={wheelGroupVariants}
                initial="hidden"
                whileInView="visible"
                viewport={viewportConfig}
              >
                {wedges.map((w) => {
                  const isActive = w.idx === active;
                  const labelText = String(w.idx + 1).padStart(2, '0');
                  return (
                    <motion.g
                      key={w.idx}
                      variants={wedgeVariants}
                      whileHover={reduced ? undefined : { scale: 1.025 }}
                      whileTap={reduced ? undefined : { scale: 0.99 }}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isActive}
                      aria-label={`Pillar ${w.idx + 1}, ${
                        w.pillar.name
                      }, weighted ${w.pillar.weight.replace(
                        '%',
                        ' percent',
                      )} of total score`}
                      onClick={() => setActive(w.idx)}
                      onKeyDown={(e) => handleKey(e, w.idx)}
                      className="pillar-wedge"
                      data-active={isActive ? 'true' : 'false'}
                      style={{
                        cursor: 'pointer',
                        outline: 'none',
                        transformOrigin: `${CENTER}px ${CENTER}px`,
                        transformBox: 'fill-box',
                      }}
                    >
                      <path
                        d={w.path}
                        fill={
                          isActive
                            ? 'var(--color-accent)'
                            : 'var(--color-paper-2)'
                        }
                        stroke="var(--color-ink)"
                        strokeWidth={1}
                        style={{
                          transition:
                            'fill var(--duration-short) var(--ease-sharp), stroke var(--duration-instant) var(--ease-sharp)',
                        }}
                      />
                      <text
                        x={w.labelX}
                        y={w.labelY}
                        textAnchor={w.labelAnchor}
                        dominantBaseline="middle"
                        style={{
                          fontFamily:
                            'var(--font-geist-mono), ui-monospace, monospace',
                          fontSize: '18px',
                          letterSpacing: '0.18em',
                          fontWeight: isActive ? 600 : 500,
                          fill: isActive
                            ? 'var(--color-ink)'
                            : 'var(--color-mute)',
                          textTransform: 'uppercase',
                          pointerEvents: 'none',
                          userSelect: 'none',
                          transition:
                            'fill var(--duration-short) var(--ease-sharp), font-weight var(--duration-instant) var(--ease-sharp)',
                        }}
                      >
                        {labelText}
                      </text>
                    </motion.g>
                  );
                })}
              </motion.g>
            </svg>

            {/* Centre overlay — identity-only. Pillar name + weight chip
                live in the side panel; centre carries the identity marker
                in container-relative scale (cqi) so it always fits the
                inner sage disc regardless of viewport. */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              aria-hidden="true"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeId}
                  variants={centreStackVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="text-center"
                >
                  <motion.div
                    variants={numeralVariants}
                    className="font-mono font-bold leading-none text-[color:var(--color-ink)] tracking-[-0.04em]"
                    style={{ fontSize: 'clamp(32px, 13cqi, 84px)' }}
                  >
                    <Bracket>{activeId}</Bracket>
                  </motion.div>
                  <motion.div
                    variants={tickVariants}
                    className="mx-auto"
                    style={{
                      width: 'clamp(14px, 3.5cqi, 28px)',
                      height: '1px',
                      marginTop: 'clamp(8px, 1.6cqi, 14px)',
                      background: 'var(--color-accent)',
                      transformOrigin: 'center',
                    }}
                  />
                  <motion.div
                    variants={fadeUpVariants}
                    className="font-mono uppercase"
                    style={{
                      fontSize: 'clamp(8px, 1.5cqi, 11px)',
                      letterSpacing: '0.18em',
                      fontWeight: 500,
                      color: 'var(--color-mute-2)',
                      marginTop: 'clamp(8px, 1.6cqi, 14px)',
                    }}
                  >
                    of <Bracket>07</Bracket>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportConfig}
            transition={{ duration: 0.4, delay: 1.0, ease: EASE }}
            className="mt-8 lg:mt-10 font-mono uppercase text-center"
            style={{
              fontSize: 'clamp(10px, 0.85vw, 12px)',
              letterSpacing: '0.18em',
              fontWeight: 500,
              color: 'var(--color-mute-2)',
              lineHeight: 1.6,
            }}
          >
            <span aria-hidden="true">// </span>click any wedge to read more
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportConfig}
            transition={{ duration: 0.4, delay: 1.1, ease: EASE }}
            className="mt-3 font-mono uppercase text-center"
            style={{
              fontSize: 'clamp(10px, 0.85vw, 12px)',
              letterSpacing: '0.18em',
              fontWeight: 500,
              color: 'var(--color-mute-2)',
              lineHeight: 1.6,
              whiteSpace: 'nowrap',
            }}
          >
            <span aria-hidden="true">// </span>360° equals 100% of total score
          </motion.p>
        </div>

        {/* Spotlight panel — Apple feature-card register */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="order-2 lg:order-1"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeId}
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <motion.p
                variants={eyebrowVariants}
                className="font-mono uppercase mb-6 lg:mb-8"
                style={{
                  fontSize: 'clamp(10px, 0.85vw, 12px)',
                  letterSpacing: '0.18em',
                  fontWeight: 500,
                  color: 'var(--color-mute-2)',
                }}
              >
                <span aria-hidden="true">// </span>pillar{' '}
                <Bracket>{activeId}</Bracket>
                <span className="mx-2" aria-hidden="true">
                  ·
                </span>
                <span className="text-[color:var(--color-mute)]">
                  {activePillar.name}
                </span>
                <span className="mx-2" aria-hidden="true">
                  ·
                </span>
                <span className="text-[color:var(--color-ink)]">
                  {activePillar.weight} of score
                </span>
              </motion.p>

              <motion.h3
                variants={headlineVariants}
                className="font-sans font-medium tracking-[-0.035em] leading-[1.02] text-[color:var(--color-ink)]"
                style={{
                  fontSize: 'clamp(40px, 5vw, 72px)',
                  maxWidth: '14ch',
                }}
              >
                {activePillar.headline}
              </motion.h3>

              <motion.div
                variants={sageBarVariants}
                className="mt-8 lg:mt-10"
                style={{
                  height: '2px',
                  width: 'clamp(80px, 8vw, 144px)',
                  background: 'var(--color-accent-sage)',
                  opacity: 0.85,
                  transformOrigin: 'left',
                }}
                aria-hidden="true"
              />

              <div className="mt-10 lg:mt-12 max-w-[52ch]">
                <motion.p
                  variants={bodyLineVariants}
                  className="font-mono uppercase"
                  style={{
                    fontSize: 'clamp(10px, 0.85vw, 11px)',
                    letterSpacing: '0.18em',
                    fontWeight: 500,
                    color: 'var(--color-mute-2)',
                  }}
                >
                  <span aria-hidden="true">// </span>WHAT WE CHECK
                </motion.p>
                <motion.p
                  variants={bodyLineVariants}
                  className="mt-3 font-sans"
                  style={{
                    fontSize: '17px',
                    lineHeight: 1.55,
                    color: 'var(--color-ink-2, var(--color-ink))',
                  }}
                >
                  {activePillar.looksFor}
                </motion.p>

                <motion.p
                  variants={bodyLineVariants}
                  className="mt-10 font-mono uppercase inline-flex items-center gap-2"
                  style={{
                    fontSize: 'clamp(10px, 0.85vw, 11px)',
                    letterSpacing: '0.18em',
                    fontWeight: 500,
                    color: 'var(--color-mute-2)',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '999px',
                      background: 'var(--color-accent)',
                    }}
                  />
                  <span aria-hidden="true">// </span>COMMON MISS
                </motion.p>
                <motion.p
                  variants={bodyLineVariants}
                  className="mt-3 font-sans"
                  style={{
                    fontSize: '17px',
                    lineHeight: 1.55,
                    color: 'var(--color-mute)',
                  }}
                >
                  {activePillar.commonMiss}
                </motion.p>

                <motion.button
                  ref={triggerRef}
                  variants={bodyLineVariants}
                  onClick={() => setModalOpen(true)}
                  className="pillar-spec-trigger mt-10 inline-flex items-center gap-3 font-mono uppercase"
                  style={{
                    fontSize: 'clamp(11px, 1vw, 13px)',
                    letterSpacing: '0.16em',
                    fontWeight: 500,
                    color: 'var(--color-ink)',
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                  }}
                  aria-haspopup="dialog"
                  aria-expanded={modalOpen}
                >
                  <span
                    aria-hidden="true"
                    className="pillar-spec-plus inline-flex items-center justify-center"
                  >
                    +
                  </span>
                  read full spec
                </motion.button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Spotlight modal — Apple iPhone-overview deep-dive register */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: EASE }}
            className="fixed inset-0 z-[60] flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            style={{ background: 'rgba(10, 10, 11, 0.55)' }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setModalOpen(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 48, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 32, scale: 0.97 }}
              transition={{ duration: 0.46, ease: APPLE_EASE }}
              className="relative bg-[color:var(--color-paper)] w-full max-w-[1120px] max-h-[92vh] overflow-y-auto"
              style={{
                margin: '4vh clamp(16px, 4vw, 64px)',
                boxShadow: 'var(--shadow-paper-1)',
              }}
            >
              {/* Close */}
              <button
                ref={closeRef}
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close spotlight"
                className="absolute z-10 inline-flex items-center justify-center transition-colors"
                style={{
                  top: 'clamp(20px, 2vw, 32px)',
                  right: 'clamp(20px, 2vw, 32px)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '999px',
                  border: '1px solid var(--color-ink)',
                  background: 'var(--color-paper)',
                  color: 'var(--color-ink)',
                  fontSize: '20px',
                  fontWeight: 400,
                  lineHeight: 1,
                  cursor: 'pointer',
                }}
              >
                <span aria-hidden="true">×</span>
              </button>

              <div
                className="px-8 lg:px-16 xl:px-24 py-16 lg:py-24"
                style={{ minHeight: '60vh' }}
              >
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.1, ease: EASE }}
                  className="font-mono uppercase"
                  style={{
                    fontSize: 'clamp(11px, 1vw, 13px)',
                    letterSpacing: '0.18em',
                    fontWeight: 500,
                    color: 'var(--color-mute-2)',
                  }}
                >
                  <span aria-hidden="true">// </span>pillar{' '}
                  <Bracket>{activeId}</Bracket>
                  <span className="mx-2" aria-hidden="true">
                    ·
                  </span>
                  {activePillar.name}
                </motion.p>

                <motion.h2
                  id={modalTitleId}
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.18, ease: APPLE_EASE }}
                  className="font-sans font-medium tracking-[-0.04em] leading-[1.0] text-[color:var(--color-ink)] mt-8 lg:mt-10"
                  style={{
                    fontSize: 'clamp(48px, 7vw, 112px)',
                    maxWidth: '16ch',
                  }}
                >
                  {activePillar.headline}
                </motion.h2>

                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5, delay: 0.4, ease: APPLE_EASE }}
                  className="mt-10 lg:mt-12"
                  style={{
                    height: '2px',
                    width: 'clamp(120px, 12vw, 220px)',
                    background: 'var(--color-accent-sage)',
                    transformOrigin: 'left',
                  }}
                  aria-hidden="true"
                />

                {/* Hero illustration band — photoreal still-life for the
                    active pillar. Generated via Runware Flux Dev under
                    operator authorization 2026-04-29. Each image is a
                    macro editorial still-life, no faces, no hands, single
                    subject, warm cream palette. --image-treatment-warm
                    filter pulls the photo toward Flintmere's paper canvas. */}
                <motion.figure
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.45, ease: APPLE_EASE }}
                  className="mt-12 lg:mt-16"
                  style={{ margin: 0 }}
                >
                  <div
                    className="relative overflow-hidden border border-[color:var(--color-line)] bg-[color:var(--color-paper-2)]"
                    style={{ aspectRatio: '4 / 3' }}
                  >
                    <Image
                      key={activePillar.image}
                      src={activePillar.image}
                      alt={activePillar.imageAlt}
                      fill
                      sizes="(min-width: 1120px) 1024px, 100vw"
                      className="object-cover"
                      style={{ filter: 'var(--image-treatment-warm)' }}
                      priority={false}
                    />
                  </div>
                  <figcaption
                    className="mt-3 font-mono uppercase"
                    style={{
                      fontSize: 'clamp(10px, 0.85vw, 11px)',
                      letterSpacing: '0.18em',
                      fontWeight: 500,
                      color: 'var(--color-mute-2)',
                    }}
                  >
                    <span aria-hidden="true">// </span>figure{' '}
                    <Bracket>{activeId}</Bracket>
                    <span className="mx-2" aria-hidden="true">·</span>
                    {activePillar.name}
                  </figcaption>
                </motion.figure>

                <div className="mt-12 lg:mt-16 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-10 lg:gap-16 max-w-[1120px]">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.5, ease: APPLE_EASE }}
                  >
                    <p
                      className="font-mono uppercase"
                      style={{
                        fontSize: 'clamp(10px, 0.85vw, 11px)',
                        letterSpacing: '0.18em',
                        fontWeight: 500,
                        color: 'var(--color-mute-2)',
                      }}
                    >
                      <span aria-hidden="true">// </span>WHAT WE CHECK
                    </p>
                    <p
                      className="mt-4 font-sans"
                      style={{
                        fontSize: '18px',
                        lineHeight: 1.6,
                        color: 'var(--color-ink-2, var(--color-ink))',
                      }}
                    >
                      {activePillar.looksFor}
                    </p>

                    <p
                      className="mt-10 font-mono uppercase inline-flex items-center gap-2"
                      style={{
                        fontSize: 'clamp(10px, 0.85vw, 11px)',
                        letterSpacing: '0.18em',
                        fontWeight: 500,
                        color: 'var(--color-mute-2)',
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          display: 'inline-block',
                          width: '8px',
                          height: '8px',
                          borderRadius: '999px',
                          background: 'var(--color-accent)',
                        }}
                      />
                      <span aria-hidden="true">// </span>COMMON MISS
                    </p>
                    <p
                      className="mt-4 font-sans"
                      style={{
                        fontSize: '18px',
                        lineHeight: 1.6,
                        color: 'var(--color-mute)',
                      }}
                    >
                      {activePillar.commonMiss}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.7, ease: APPLE_EASE }}
                  >
                    <p
                      className="font-mono uppercase"
                      style={{
                        fontSize: 'clamp(10px, 0.85vw, 11px)',
                        letterSpacing: '0.18em',
                        fontWeight: 500,
                        color: 'var(--color-ink)',
                      }}
                    >
                      <span aria-hidden="true">// </span>WHAT TO DO ABOUT IT
                    </p>
                    <p
                      className="mt-4 font-sans"
                      style={{
                        fontSize: '18px',
                        lineHeight: 1.6,
                        color: 'var(--color-ink)',
                      }}
                    >
                      {activePillar.whatToDo}
                    </p>

                    <div
                      className="mt-12 border-t border-[color:var(--color-line)] pt-8 font-mono uppercase"
                      style={{
                        fontSize: 'clamp(10px, 0.85vw, 11px)',
                        letterSpacing: '0.18em',
                        fontWeight: 500,
                        color: 'var(--color-mute-2)',
                        lineHeight: 1.7,
                      }}
                    >
                      <span aria-hidden="true">// </span>this pillar carries{' '}
                      <Bracket>{activePillar.weight}</Bracket>
                      <br />
                      <span aria-hidden="true">// </span>of your final score
                    </div>
                  </motion.div>
                </div>

                {/* Closing CTA — Apple modals end on a buy/learn-more
                    moment; ours ends on the conversion mechanic. Amber-fill
                    button → /scan. The merchant has just learned what the
                    pillar measures; the next step is to find out where they
                    score on it. */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.85, ease: APPLE_EASE }}
                  className="mt-16 lg:mt-20 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-t border-[color:var(--color-line)] pt-10 lg:pt-12"
                >
                  <p
                    className="font-sans tracking-[-0.02em] leading-[1.2] text-[color:var(--color-ink)]"
                    style={{
                      fontSize: 'clamp(20px, 2vw, 28px)',
                      fontWeight: 500,
                      maxWidth: '32ch',
                    }}
                  >
                    See where you score on this pillar.
                  </p>
                  <Link
                    href="/scan"
                    onClick={() => setModalOpen(false)}
                    className="inline-flex items-center gap-3 px-7 py-4 bg-[color:var(--color-accent)] text-[color:var(--color-accent-ink)] font-mono uppercase hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-paper)] transition-colors duration-[var(--duration-instant)]"
                    style={{
                      fontSize: '13px',
                      letterSpacing: '0.16em',
                      fontWeight: 500,
                    }}
                  >
                    Run the scan
                    <span aria-hidden="true">→</span>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
