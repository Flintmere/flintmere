/**
 * PickerDrivenContentBlock — companion primitive to VerticalRadiogroup.
 *
 * Spec source of truth (binding):
 *   context/design/components/2026-04-26-vertical-radiogroup-revision.md §Companion primitive
 *   context/decisions/2026-04-27-homepage-redesign-operator-locks.md §"Option A overlay"
 *   2026-04-28 frontend-design rebuild — hero-class editorial-cinematic surface.
 *
 * What this primitive renders:
 *   A full-bleed photoreal image as the section background, two layered
 *   scrims (vertical paper-mist for depth + horizontal ink-fade for text
 *   contrast), a decorative sage hairline anchoring the bottom-left, and an
 *   editorial overlay containing:
 *     - mono sage eyebrow `// {keyword} catalog`
 *     - display-scale heading "What changes for [ keyword ]?"
 *     - ordered list with bracketed numerals + sage hairline rules between
 *     - paper-bordered CTA with mono uppercase
 *
 * Layout:
 *   Section is `min(85vh, 780px)` with `min-height: 560px`. The photo is the
 *   dominant visual moment; text overlays the left ~58% over the contrast
 *   scrim. ONE such moment per vertical pick.
 *
 * Cross-fade:
 *   On `selectedId` change the OVERLAY TEXT cross-fades 240ms total
 *   (CROSSFADE_HALF_MS = 120 each direction). Image + scrims do NOT fade —
 *   only the text container — so swaps feel cinematic, not flickery. The
 *   image src updates atomically with the text swap.
 *
 * Parallax (axis 8 + Pattern 3 from design-motion spec):
 *   Image translates on scroll at 0.5x velocity, ±40px clamp. JS-side
 *   `prefers-reduced-motion: reduce` bypass + change-listener (Noor #8 P0
 *   binding — global CSS @media block does NOT cover JS scroll handlers).
 *   IO-gated so listener attaches only when section is in viewport. RAF-
 *   coalesced. Conscious deviation from "single parallax instance per page"
 *   per operator's 2026-04-28 lock — accepted trade-off for image-led
 *   picker.
 *
 * Bracket budget (ADR 0021 axis 4, ≤1 keyword bracket per section, no page
 * cap; numeric enumeration brackets follow the documented pillar `[ 01 ]–[ 07 ]`
 * precedent in tokens.md §Signature §Examples and don't compete with the
 * keyword bracket):
 *   - 1 keyword bracket: `[ {keyword} ]` in heading
 *   - 3 enumeration brackets: `[ 01 ]` `[ 02 ]` `[ 03 ]` on bullets
 *
 * Reduced-motion contract:
 *   - Cross-fade opacity: inherits global `@media (prefers-reduced-motion)`
 *     block in apps/scanner globals.css (transition-duration → 0.01ms).
 *   - Parallax: JS bypass + change-listener (above).
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
  /** Vertical-specific h2 text (used when headingBracket is unset). */
  h2: string;
  /**
   * Bracket-keyword slotted into the heading. When set, the primitive
   * renders the heading as `What changes for [ keyword ]?` — bracket
   * co-occurrence per ADR 0021 axis 4 + the homepage redesign (each
   * photoreal moment carries a bracket in the same viewport — #9 Lawyer
   * binding from Q-A2).
   */
  headingBracket?: string;
  /** Exactly 3 bullets per vertical (lint-enforced length 3 at the callsite). */
  bullets: ReadonlyArray<string>;
  /** CTA button text — Copy Council polish via web-implementation. */
  ctaLabel: string;
  /** Route target for the CTA. */
  ctaHref: string;
  /**
   * Photoreal hero source (AVIF). When omitted the primitive renders a
   * paper-2 solid block placeholder so the layout holds while operator
   * licenses + drops final assets per
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
  /** Inversion variant — affects underlying section bg behind the scrim
   * stack. The TEXT colour is always paper-on-ink because the scrim sits
   * over the image regardless of surface. Default = "paper". */
  surface?: 'paper' | 'ink';
  /** Pass-through to the section element. */
  className?: string;
}

// Cross-fade timing: 120ms fade-out, 120ms fade-in. Total perceived ≤ 240ms.
// Applied to the OVERLAY TEXT CONTAINER ONLY — image + scrims stay steady.
const CROSSFADE_HALF_MS = 120;

// Parallax constants — match the hero's HeroParallaxFigure pattern for
// set cohesion. 0.5× scroll velocity, ±40px clamp prevents drift off-frame.
const PARALLAX_VELOCITY = 0.5;
const PARALLAX_CLAMP_PX = 40;

function ctaClass(): string {
  // Editorial-mono CTA — paper-bordered button on the inked scrim. Inverts
  // on hover; sage focus-ring for keyboard parity.
  return [
    'group inline-flex items-center gap-3 mt-10 px-7 py-3.5',
    'border border-[color:var(--color-paper-on-ink)] text-[color:var(--color-paper-on-ink)]',
    'font-mono text-[12px] font-medium tracking-[0.14em] uppercase',
    'hover:bg-[color:var(--color-paper-on-ink)] hover:text-[color:var(--color-ink)]',
    'transition-colors duration-[var(--duration-instant)] ease-[cubic-bezier(0.4,0,0.2,1)]',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent-sage)]',
  ].join(' ');
}

function sectionBgClass(surface: 'paper' | 'ink'): string {
  // Paper or ink behind the image is mostly hidden by the photo, but the
  // border colour adapts so paper-surface sections share line tone with
  // their neighbours.
  return surface === 'paper'
    ? 'bg-[color:var(--color-paper)] border-[color:var(--color-line)]'
    : 'bg-[color:var(--color-ink)] border-[color:var(--color-line-dark)]';
}

export function PickerDrivenContentBlock({
  selectedId,
  slots,
  ariaLabelTemplate,
  surface = 'paper',
  className,
}: PickerDrivenContentBlockProps) {
  // Cross-fade state — `displayedId` lags `selectedId` by half the crossfade
  // window so the swap happens behind the fade-out.
  const [displayedId, setDisplayedId] = React.useState(selectedId);
  const [textOpacity, setTextOpacity] = React.useState<1 | 0>(1);
  const previousIdRef = React.useRef(selectedId);

  // Parallax — dedicated refs for the section (IO target) and the image
  // element (transform target). The image element is the same across slot
  // swaps; only `src` changes, so the ref stays bound.
  const sectionRef = React.useRef<HTMLElement>(null);
  const imageRef = React.useRef<HTMLImageElement | null>(null);

  // Cross-fade effect — fires only when selectedId actually changes.
  React.useEffect(() => {
    if (previousIdRef.current === selectedId) return;
    previousIdRef.current = selectedId;
    setTextOpacity(0);
    const timer = setTimeout(() => {
      setDisplayedId(selectedId);
      setTextOpacity(1);
    }, CROSSFADE_HALF_MS);
    return () => clearTimeout(timer);
  }, [selectedId]);

  // Parallax effect — Pattern 3 (HeroParallaxFigure mirror).
  React.useEffect(() => {
    const sectionEl = sectionRef.current;
    if (!sectionEl || typeof window === 'undefined') return;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    let observer: IntersectionObserver | null = null;
    let isInViewport = false;
    let rafId: number | null = null;

    const resetTransform = () => {
      const img = imageRef.current;
      if (img) img.style.transform = 'translate3d(0, 0, 0)';
    };

    const updateTransform = () => {
      rafId = null;
      if (!isInViewport) return;
      const img = imageRef.current;
      if (!img) return;
      const rect = sectionEl.getBoundingClientRect();
      const sectionCentreY = rect.top + rect.height / 2;
      const viewportCentreY = window.innerHeight / 2;
      const offset = (viewportCentreY - sectionCentreY) * PARALLAX_VELOCITY;
      const clamped = Math.max(
        -PARALLAX_CLAMP_PX,
        Math.min(PARALLAX_CLAMP_PX, offset),
      );
      img.style.transform = `translate3d(0, ${clamped}px, 0)`;
    };

    const onScroll = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(updateTransform);
      }
    };

    const attach = () => {
      if (mq.matches) {
        resetTransform();
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
      observer.observe(sectionEl);
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
      resetTransform();
    };

    attach();

    const onMqChange = (event: MediaQueryListEvent) => {
      if (event.matches) detach();
      else attach();
    };
    mq.addEventListener('change', onMqChange);

    return () => {
      detach();
      mq.removeEventListener('change', onMqChange);
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

  // Eyebrow text — `// {keyword} catalog` in sage mono. When headingBracket
  // is unset the eyebrow is plain `// catalog`.
  const eyebrowText = content.headingBracket
    ? `// ${content.headingBracket} catalog`
    : '// catalog';

  // Heading composition — display scale, weight 700 per ADR 0021 axis 6.
  // Geist Sans for ambient text + Geist Mono for the bracketed keyword
  // (the brand canon's intentional typographic switch on the bracket).
  const headingClass =
    'font-bold tracking-[-0.045em] leading-[0.92] text-[clamp(56px,9vw,96px)] max-w-[18ch] text-[color:var(--color-paper-on-ink)]';

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
      role="region"
      aria-live="polite"
      aria-label={ariaLabelTemplate(selectedId)}
      className={[
        'relative isolate overflow-hidden border-y',
        sectionBgClass(surface),
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        height: 'min(85vh, 780px)',
        minHeight: '560px',
      }}
    >
      {/* Image layer — full-bleed, parallax, object-cover. */}
      {content.imageSrc ? (
        <img
          ref={imageRef}
          src={content.imageSrc}
          alt={content.imageAlt ?? ''}
          loading="lazy"
          draggable={false}
          className="absolute inset-0 w-full h-full select-none"
          style={{
            objectFit: 'cover',
            objectPosition: 'center',
            willChange: 'transform',
            filter: 'var(--image-treatment-warm)',
          }}
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 w-full h-full bg-[color:var(--color-paper-2)]"
        />
      )}

      {/* Scrim layer 1 — vertical paper-tone mist for atmospheric depth.
          Subtle ink at top + bottom, transparent through the upper-mid. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(10,10,11,0.18) 0%, rgba(10,10,11,0.0) 32%, rgba(10,10,11,0.0) 60%, rgba(10,10,11,0.32) 100%)',
        }}
      />

      {/* Scrim layer 2 — horizontal strong ink fade left → transparent right.
          Provides AA contrast on overlay text. ~5:1 on body bullets and
          ~10:1 on display heading against paper-on-ink. Photo stays visible
          on the right side. Noor #8 P0 binding satisfied. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(95deg, rgba(10,10,11,0.78) 0%, rgba(10,10,11,0.62) 28%, rgba(10,10,11,0.30) 55%, rgba(10,10,11,0.05) 82%, rgba(10,10,11,0) 100%)',
        }}
      />

      {/* Decorative sage hairline — bottom-left edge anchor. 2px stroke,
          200px wide, ~32px from corner on desktop, scaled in on mobile.
          Decorative-only sage per ADR 0021 axis 1; carries no meaning. */}
      <div
        aria-hidden="true"
        className="absolute left-8 bottom-8 h-[2px] w-[160px] lg:left-12 lg:bottom-12 lg:w-[220px]"
        style={{
          background: 'var(--color-accent-sage)',
          opacity: 0.85,
        }}
      />

      {/* Content overlay — left ~58% of the section. Cross-fade target. */}
      <div className="relative h-full mx-auto max-w-[1280px] px-8 lg:px-12">
        <div
          className="grid h-full items-center transition-opacity duration-[var(--duration-short)] ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ opacity: textOpacity }}
        >
          <div className="max-w-[640px]">
            {/* Eyebrow — sage mono, code-comment-coded. Ties to Flintmere's
                structured-data brand. */}
            <p
              className="font-mono text-[11px] tracking-[0.18em] uppercase mb-6"
              style={{
                color: 'var(--color-accent-sage)',
                fontWeight: 500,
              }}
            >
              {eyebrowText}
            </p>

            {heading}

            {/* Bracketed-numeral list — `[ 01 ] [ 02 ] [ 03 ]` enumeration
                follows the documented pillar precedent in tokens.md
                §Signature §Examples. Sage hairline rules between bullets. */}
            <ol className="mt-12 list-none p-0 m-0 max-w-[40ch] border-t border-[color:var(--color-accent-sage)]">
              {content.bullets.map((bullet, i) => (
                <li
                  key={i}
                  className="grid grid-cols-[56px_1fr] gap-4 items-baseline py-5 border-b border-[color:var(--color-accent-sage)] text-[clamp(17px,1.55vw,20px)] leading-[1.5] text-[color:var(--color-paper-on-ink)] font-medium"
                  style={{ borderColor: 'rgba(90,107,77,0.55)' }}
                >
                  <span
                    aria-hidden="true"
                    className="font-mono text-[12px] tracking-[0.14em] pt-1 uppercase"
                    style={{
                      color: 'var(--color-accent-sage)',
                      fontWeight: 500,
                    }}
                  >
                    {`[ 0${i + 1} ]`}
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ol>

            <a href={content.ctaHref} className={ctaClass()}>
              <span>{content.ctaLabel}</span>
              <span aria-hidden="true" className="text-[14px]">
                →
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
