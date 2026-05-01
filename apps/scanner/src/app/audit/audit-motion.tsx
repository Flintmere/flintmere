'use client';

/**
 * Three small motion primitives for the /audit sales page. Framer
 * Motion is scoped here so the page itself stays a server component.
 *
 * Why these three, and only these three:
 *   - PriceBracket — the [£197] Saks bracket gets a soft spring entrance
 *     so the price moment is the felt centre of the page. The headline
 *     words around it land on the existing CSS fade; only the bracket
 *     springs.
 *   - DeliverableLift — each deliverable card lifts 2px on hover with a
 *     soft spring. Tactility for an otherwise static read.
 *   - CTAButton — the primary amber CTA scales 0.97 on press. Reads as
 *     a real button, not a styled link.
 *
 * Reduced-motion: every primitive checks `useReducedMotion()` and
 * collapses to a no-op static element when the user has the preference.
 * No spring runs, no transform applies, no opacity transition fires.
 */

import { useReducedMotion, motion, type Variants } from 'framer-motion';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Bracket } from '@flintmere/ui';

const bracketVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 220,
      damping: 22,
      mass: 0.9,
      delay: 0.36,
    },
  },
};

interface PriceBracketProps {
  children: ReactNode;
}

/**
 * Saks-scale price bracket with a soft spring entrance. Used in the
 * Chapter 2 price chord — `[£197]`. The surrounding headline lands on
 * the page's standard CSS fade-up; the bracket's spring trails it by
 * ~360ms so the price reads as the punchline.
 */
export function PriceBracket({ children }: PriceBracketProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <Bracket size="saks">{children}</Bracket>;
  }

  return (
    <motion.span
      style={{ display: 'inline-block', verticalAlign: 'baseline' }}
      initial="hidden"
      animate="visible"
      variants={bracketVariants}
    >
      <Bracket size="saks">{children}</Bracket>
    </motion.span>
  );
}

interface DeliverableLiftProps {
  children: ReactNode;
  delayMs: number;
}

/**
 * Wraps a deliverable list item. Inherits the page's CSS-driven
 * data-reveal entrance via the `data-reveal` attribute and `--reveal-delay`
 * custom property; Framer Motion only takes over for the hover-lift.
 *
 * Hover spring: y -2, soft warm-paper shadow. On press, a tiny y bounce
 * downward so the row feels physical.
 */
export function DeliverableLift({ children, delayMs }: DeliverableLiftProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <li
        data-reveal
        className="border-t border-[color:var(--color-line)] pt-8"
        style={
          {
            '--reveal-delay': `${delayMs}ms`,
          } as React.CSSProperties
        }
      >
        {children}
      </li>
    );
  }

  return (
    <motion.li
      data-reveal
      className="border-t border-[color:var(--color-line)] pt-8"
      style={
        {
          '--reveal-delay': `${delayMs}ms`,
        } as React.CSSProperties
      }
      whileHover={{
        y: -2,
        boxShadow: '0 6px 20px -12px rgba(10, 10, 11, 0.18)',
        transition: { type: 'spring', stiffness: 320, damping: 26 },
      }}
      whileTap={{
        y: 0,
        transition: { type: 'spring', stiffness: 480, damping: 28 },
      }}
    >
      {children}
    </motion.li>
  );
}

interface CTAButtonProps {
  href: string;
  children: ReactNode;
  className?: string;
}

const MotionLink = motion.create(Link);

/**
 * Primary amber CTA — scales 0.97 on press. Hover state stays on the
 * underlying CSS class (colour-flip to ink); only the press is
 * physically animated.
 */
export function CTAButton({ href, children, className }: CTAButtonProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <MotionLink
      href={href}
      className={className}
      whileTap={{
        scale: 0.97,
        transition: { type: 'spring', stiffness: 600, damping: 30 },
      }}
    >
      {children}
    </MotionLink>
  );
}
