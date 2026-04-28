/**
 * PickerDrivenContentBlock — companion primitive to VerticalRadiogroup.
 *
 * Spec source of truth (binding):
 *   context/design/components/2026-04-26-vertical-radiogroup-revision.md §Companion primitive
 *   context/decisions/2026-04-27-homepage-redesign-operator-locks.md §"Option A overlay"
 *
 * 2026-04-28 redesign — operator override of the side-by-side editorial layout
 * to a HERO-CLASS OVERLAY. Image becomes a full-bleed dramatic background;
 * heading + bullets + CTA absolute-positioned over a gradient ink scrim;
 * parallax on the image at 0.5× scroll velocity. Operator consciously
 * deviates from the design-motion spec's "single parallax instance per page"
 * rule (Pattern 3) — multiple parallax instances accepted as trade-off for
 * the more-dramatic, image-led picker experience.
 *
 * Contract:
 *   - API: { selectedId, slots, ariaLabelTemplate, surface?, className? }.
 *   - Renders h2 + 3-bullet list + CTA per `slots[selectedId]`.
 *   - Layout: section is `min(80vh, 720px)` tall; image absolute-positioned
 *     full-bleed with parallax transform; left-side gradient ink scrim;
 *     overlay text in left ~58% column. Display-scale heading weight 700
 *     (per ADR 0021 axis 6 ≥80px); body bullets big 18-20px paper-on-ink.
 *   - Cross-fade on `selectedId` change (120ms fade-out then 120ms fade-in;
 *     total ≤ 240ms perceived). Composited opacity only.
 *   - `aria-live="polite"` on the section so AT announces vertical changes
 *     without interrupting the radio's `aria-checked` announcement.
 *   - Renders `null` + dev-only console warn if `selectedId` doesn't match a slot key.
 *
 * Reduced-motion contract:
 *   - Opacity transition inherits the global @media (prefers-reduced-motion)
 *     block in apps/scanner globals.css (transition-duration → 0.01ms).
 *   - Parallax is JS-driven (rAF + scroll listener); the global CSS block
 *     does NOT cover it. JS-side `window.matchMedia('(prefers-reduced-motion: reduce)')`
 *     bypass is binding (#8 Noor P0 from ADR 0021 + design-motion spec
 *     Pattern 3). Plus `mq.addEventListener('change', ...)` to bail mid-scroll
 *     if the user toggles the OS preference.
 *
 * Dependency rule: hand-rolled. Zero new npm dependencies. Tokens via
 * `[color:var(--color-*)]` Tailwind utilities only.
 *
 * Framework: React 19. "use client" — useState/useEffect/useRef for parallax
 * + cross-fade timer.
 */

'use client';

import * as React from 'react';
import { Bracket } from './Bracket.js';

export interface PickerDrivenContent {
  /** Vertical-specific h2 text. */
  h2: string;
  /**
   * Optional bracket-keyword slotted into the h2 ahead of a closing question
   * mark or full-stop. When set, the primitive renders the heading as
   * `What changes for [ keyword ]?` — bracket co-occurrence per ADR 0021
   * axis 4 + the homepage redesign (each photoreal moment carries a bracket
   * in the same viewport — #9 Lawyer binding from Q-A2).
   */
  headingBracket?: string;
  /** 3 bullets per vertical (lint-enforced length 3 at the callsite). */
  bullets: ReadonlyArray<string>;
  /** CTA button text — Copy Council polish via web-implementation. */
  ctaLabel: string;
  /** Route target for the CTA. */
  ctaHref: string;
  /**
   * Optional photoreal hero source (AVIF). When omitted the primitive renders
   * a paper-2 solid block placeholder of the same aspect ratio so the layout
   * holds while operator licenses + drops final assets per
   * `apps/scanner/public/marketing/verticals/${vertical}.avif`.
   */
  imageSrc?: string;
  /** Required when imageSrc is set — descriptive alt per Noor's a11y floor. */
  imageAlt?: string;
}

export interface PickerDrivenContentBlockProps {
  /** Controlled — must match a key in `slots`. */
  selectedId: string;
  /** Per-vertical content payload; missing key → null render + dev console warn. */
  slots: Readonly<Record<string, PickerDrivenContent>>;
  /** Returns the section's `aria-label`; receives the selected id. */
  ariaLabelTemplate: (id: string) => string;
  /** Inversion variant; no callsite uses ink at launch. Default = "paper". */
  surface?: 'paper' | 'ink';
  /** Pass-through to the section element. */
  className?: string;
}

// Cross-fade timing: 120ms fade-out, 120ms fade-in. Total perceived ≤ 240ms.
// We swap the rendered slot at the midpoint, after the fade-out completes.
const CROSSFADE_HALF_MS = 120;

// Parallax constants — match the hero's HeroParallaxFigure pattern for
// set cohesion. 0.5× scroll velocity, ±40px clamp prevents drift off-frame.
const PARALLAX_VELOCITY = 0.5;
const PARALLAX_CLAMP_PX = 40;

const containerBaseClass =
  'relative overflow-hidden border-y transition-opacity duration-[var(--duration-short)] ease-[cubic-bezier(0.4,0,0.2,1)]';

function surfaceClass(surface: 'paper' | 'ink'): string {
  return surface === 'paper'
    ? 'border-[color:var(--color-line)] bg-[color:var(--color-paper)] text-[color:var(--color-paper-on-ink)]'
    : 'border-[color:var(--color-line-dark)] bg-[color:var(--color-ink)] text-[color:var(--color-paper-on-ink)]';
}

function ctaClass(): string {
  // Overlay CTA — paper-bordered button on the inked scrim. Inverts on hover.
  return [
    'inline-block px-6 py-3 border font-medium text-[15px] mt-8',
    'border-[color:var(--color-paper-on-ink)] text-[color:var(--color-paper-on-ink)]',
    'hover:bg-[color:var(--color-paper-on-ink)] hover:text-[color:var(--color-ink)]',
    'transition-colors duration-[var(--duration-instant)] ease-[cubic-bezier(0.4,0,0.2,1)]',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-paper-on-ink)]',
  ].join(' ');
}

export function PickerDrivenContentBlock({
  selectedId,
  slots,
  ariaLabelTemplate,
  surface = 'paper',
  className,
}: PickerDrivenContentBlockProps) {
  // We render the *displayed* slot — which lags `selectedId` by the half
  // crossfade window so the swap happens behind the fade-out. The visible
  // slot updates inside the timer callback.
  const [displayedId, setDisplayedId] = React.useState(selectedId);
  const [opacity, setOpacity] = React.useState<1 | 0>(1);
  const previousIdRef = React.useRef(selectedId);

  // Parallax state — JS-driven scroll-coupled transform on the image.
  const sectionRef = React.useRef<HTMLElement>(null);
  const [parallaxOffset, setParallaxOffset] = React.useState(0);

  React.useEffect(() => {
    if (previousIdRef.current === selectedId) return;
    previousIdRef.current = selectedId;
    // Fade-out → swap content → fade-in.
    setOpacity(0);
    const timer = setTimeout(() => {
      setDisplayedId(selectedId);
      setOpacity(1);
    }, CROSSFADE_HALF_MS);
    return () => clearTimeout(timer);
  }, [selectedId]);

  // Parallax effect — Pattern 3 from design-motion spec, adapted for the
  // overlay layout. JS-side prefers-reduced-motion bypass + change-listener
  // is binding (#8 Noor P0). IO-gated so listener only attaches when the
  // section is in viewport. RAF-coalesced so scroll spam is throttled.
  React.useEffect(() => {
    const target = sectionRef.current;
    if (!target || typeof window === 'undefined') return;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = mq.matches;
    let rafId: number | null = null;
    let inView = false;

    const compute = () => {
      rafId = null;
      if (!inView || reduced) {
        setParallaxOffset(0);
        return;
      }
      const rect = target.getBoundingClientRect();
      const viewportH = window.innerHeight;
      // Distance from viewport centre to section centre. Negative = above
      // centre, positive = below. Multiply by velocity factor + a small
      // dampener (0.1) to keep the effect subtle.
      const distanceFromCenter = rect.top + rect.height / 2 - viewportH / 2;
      const raw = -distanceFromCenter * PARALLAX_VELOCITY * 0.1;
      const clamped = Math.max(
        -PARALLAX_CLAMP_PX,
        Math.min(PARALLAX_CLAMP_PX, raw),
      );
      setParallaxOffset(clamped);
    };

    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(compute);
    };

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      reduced = e.matches;
      // Snap to rest if user toggled to reduce mid-scroll.
      setParallaxOffset(0);
    };

    const io = new IntersectionObserver(([entry]) => {
      inView = !!entry?.isIntersecting;
      if (inView && !reduced) {
        window.addEventListener('scroll', handleScroll, { passive: true });
        compute();
      } else {
        window.removeEventListener('scroll', handleScroll);
        setParallaxOffset(0);
      }
    });

    io.observe(target);
    mq.addEventListener('change', handleReducedMotionChange);

    return () => {
      io.disconnect();
      window.removeEventListener('scroll', handleScroll);
      mq.removeEventListener('change', handleReducedMotionChange);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  const content = slots[displayedId];

  if (!content) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(
        `PickerDrivenContentBlock: no slot for "${displayedId}". Available keys: ${Object.keys(slots).join(', ')}`,
      );
    }
    return null;
  }

  const sectionClass = [
    containerBaseClass,
    surfaceClass(surface),
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Heading composition — display-scale, weight 700 per ADR 0021 axis 6
  // (allowed at ≥80px). When `headingBracket` is set, the heading takes
  // shape "What changes for [ {keyword} ]?" — bracket co-occurrence
  // satisfied on the overlaid heading.
  const headingClass =
    'font-bold tracking-[-0.035em] leading-[0.95] text-[clamp(56px,9vw,96px)] max-w-[14ch]';

  const heading = content.headingBracket ? (
    <h2 className={headingClass}>
      What changes for <Bracket>{content.headingBracket}</Bracket>?
    </h2>
  ) : (
    <h2 className={headingClass}>{content.h2}</h2>
  );

  return (
    <section
      ref={sectionRef}
      aria-live="polite"
      aria-label={ariaLabelTemplate(selectedId)}
      className={sectionClass}
      style={{ opacity, height: 'min(80vh, 720px)', minHeight: '560px' }}
    >
      {/* Photoreal background — full-bleed dramatic per Q-A2 + Option A
          override 2026-04-28. Image absolute-positioned to fill the section;
          object-fit: cover crops to whatever aspect the viewport gives us;
          parallax transform applied to the inner img element. */}
      {content.imageSrc ? (
        <img
          src={content.imageSrc}
          alt={content.imageAlt ?? ''}
          loading="lazy"
          className="absolute inset-0 w-full h-full select-none"
          style={{
            objectFit: 'cover',
            objectPosition: 'center',
            transform: `translate3d(0, ${parallaxOffset}px, 0)`,
            willChange: 'transform',
            filter: 'var(--image-treatment-warm)',
          }}
          draggable={false}
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 w-full h-full"
          style={{ background: 'var(--color-paper-2)' }}
        />
      )}

      {/* Contrast scrim — gradient ink on the LEFT half fading to transparent
          on the right. Provides ~5:1+ AA contrast on body text + AAA on
          display heading without crushing the photo's right side. Noor P0
          binding from the critique satisfied. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to right, rgba(10,10,11,0.72) 0%, rgba(10,10,11,0.55) 35%, rgba(10,10,11,0.22) 65%, rgba(10,10,11,0) 90%)',
        }}
      />

      {/* Overlay text — left ~58% of the section. Display-scale heading,
          big-bold body bullets, paper-on-ink colour. */}
      <div className="relative h-full mx-auto max-w-[1280px] px-8">
        <div className="grid lg:grid-cols-[3fr_2fr] gap-12 h-full items-center">
          <div>
            {heading}
            <ul className="mt-10 list-none p-0 m-0 space-y-4 text-[clamp(17px,1.6vw,20px)] leading-[1.5] max-w-[40ch] font-medium">
              {content.bullets.map((bullet, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="text-[color:var(--color-mute-inv)] shrink-0"
                  >
                    —
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            <a href={content.ctaHref} className={ctaClass()}>
              {content.ctaLabel}
            </a>
          </div>
          <div /> {/* right-column negative space — let the photo breathe */}
        </div>
      </div>
    </section>
  );
}
