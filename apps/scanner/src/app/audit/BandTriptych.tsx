'use client';

/**
 * Chapter 2 band-selection composition for /audit.
 *
 * Three saks chords side-by-side as a triptych — the configurator IS
 * the visual anchor at heroic scale, not a row beneath a heroic price.
 * Selected band carries full ink fill + sage under-tick + paper-2
 * column wash. Unselected bands render as outline-stroke only
 * (transparent fill, 1px --color-mute-2 text-stroke).
 *
 * The triptych IS the radio group. Selection drives state lifted from
 * CheckoutCard; CheckoutCard receives bandSlug + onBandChange and
 * renders the email/pay flow without its own band-picker.
 *
 * Spec: context/design/marketing/2026-05-01-audit-band-selector.md
 * Critique: context/design/critiques/2026-05-01-audit-band-triptych.md
 *
 * Operator direction 2026-05-01: full ink fill on selected chord;
 * NO .flintmere-outline-shimmer (canon stays reserved for homepage
 * hero, manifesto, footer wordmark).
 *
 * Reduced-motion: useReducedMotion() collapses AnimatePresence layout
 * to instant; the global globals.css block scales transitions to
 * 0.01ms. Both layers redundant by design.
 *
 * Bracket budget: ≤1 active anchor bracket per section. The two
 * recessive chords are comparison-set brackets per the design-
 * extravagant relaxation; ADR 0021 §1 amendment pending.
 */

import { useCallback, useId, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AUDIT_BANDS,
  type AuditBand,
  type AuditBandSlug,
} from '@/lib/audit-pricing';
import { track } from '@/lib/plausible';
import { CheckoutCard } from './CheckoutCard';

const DEFAULT_BAND: AuditBandSlug = 'band-2'; // BUSINESS.md target cohort

export function BandTriptych() {
  const reduce = useReducedMotion();
  const [bandSlug, setBandSlug] = useState<AuditBandSlug>(DEFAULT_BAND);
  const liveId = useId();
  const groupName = useId();

  const selected = AUDIT_BANDS.find((b) => b.slug === bandSlug)!;

  const handleBandChange = useCallback(
    (next: AuditBandSlug) => {
      setBandSlug((prev) => {
        if (prev === next) return prev;
        track('band_switched', { from: prev, to: next });
        return next;
      });
    },
    [],
  );

  return (
    <>
      {/* Triptych — three saks chords. The grid IS the SKU-range axis.
          Click any chord to select. */}
      <fieldset
        data-reveal
        style={{
          border: 0,
          padding: 0,
          margin: 0,
          marginTop: 'clamp(48px, 6vw, 96px)',
          ['--reveal-delay' as string]: '240ms',
        }}
      >
        <legend
          className="font-mono uppercase"
          style={{
            fontSize: 'clamp(11px, 1vw, 13px)',
            letterSpacing: '0.18em',
            fontWeight: 500,
            color: 'var(--color-mute-2)',
            marginBottom: 'clamp(20px, 2.5vw, 32px)',
            padding: 0,
          }}
        >
          <span aria-hidden="true">// </span>pick a band — the price is the choice
        </legend>

        <div
          role="radiogroup"
          aria-label="Audit band"
          className="band-triptych-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 0,
            borderTop: '1px solid var(--color-line)',
            borderBottom: '1px solid var(--color-line)',
          }}
        >
          {AUDIT_BANDS.map((band, idx) => (
            <BandColumn
              key={band.slug}
              band={band}
              isSelected={band.slug === bandSlug}
              groupName={groupName}
              isFirst={idx === 0}
              isLast={idx === AUDIT_BANDS.length - 1}
              reducedMotion={!!reduce}
              onSelect={() => handleBandChange(band.slug)}
            />
          ))}
        </div>

        {/* ARIA-live region — natural-sentence announcement on change.
            Polite, not assertive. Visually hidden via .sr-only. */}
        <p
          id={liveId}
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {`${selected.label} selected — ${selected.priceDisplay} — ${selected.skuRangeLabel}, ${selected.hoursEstimate}.`}
        </p>
      </fieldset>

      {/* Micro-strip — reassurance row, single read */}
      <p
        data-reveal
        className="font-mono uppercase"
        aria-label="One-time payment, no VAT, thirty-day refund, three working days"
        style={{
          marginTop: 'clamp(32px, 4vw, 56px)',
          fontSize: 'clamp(11px, 1vw, 13px)',
          letterSpacing: '0.18em',
          fontWeight: 500,
          color: 'var(--color-ink)',
          ['--reveal-delay' as string]: '320ms',
        }}
      >
        One-time
        <span className="mx-3" aria-hidden="true" style={{ color: 'var(--color-mute-2)' }}>·</span>
        No VAT
        <span className="mx-3" aria-hidden="true" style={{ color: 'var(--color-mute-2)' }}>·</span>
        30-day refund
        <span className="mx-3" aria-hidden="true" style={{ color: 'var(--color-mute-2)' }}>·</span>
        Three working days
      </p>

      {/* CheckoutCard — controlled. Receives bandSlug + onBandChange. */}
      <div
        data-reveal
        style={{
          marginTop: 'clamp(48px, 6vw, 88px)',
          maxWidth: 720,
          ['--reveal-delay' as string]: '400ms',
        }}
      >
        <CheckoutCard bandSlug={bandSlug} onBandChange={handleBandChange} />
      </div>
    </>
  );
}

interface BandColumnProps {
  band: AuditBand;
  isSelected: boolean;
  groupName: string;
  isFirst: boolean;
  isLast: boolean;
  reducedMotion: boolean;
  onSelect: () => void;
}

function BandColumn({
  band,
  isSelected,
  groupName,
  isFirst,
  isLast: _isLast,
  reducedMotion,
  onSelect,
}: BandColumnProps) {
  const inputId = `band-chord-${band.slug}`;
  // Band 3 chord shortens to "£597+" at saks scale; the full
  // priceDisplay surfaces in the CheckoutCard's bespoke fork and in
  // the SR-only sentence below.
  const chordText = band.isBespoke ? '£597+' : band.priceDisplay;

  return (
    <label
      htmlFor={inputId}
      className={
        isSelected
          ? 'band-chord band-chord--selected'
          : 'band-chord band-chord--recessive'
      }
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        textAlign: 'center',
        cursor: 'pointer',
        padding:
          'clamp(40px, 5vw, 72px) clamp(16px, 2vw, 32px) clamp(32px, 4vw, 56px) clamp(16px, 2vw, 32px)',
        borderLeft: isFirst ? 'none' : '1px solid var(--color-line-soft)',
        background: isSelected ? 'var(--color-paper-2)' : 'transparent',
        position: 'relative',
        transition:
          'background-color 0.32s ease, color 0.32s ease',
      }}
    >
      <input
        id={inputId}
        type="radio"
        name={groupName}
        value={band.slug}
        checked={isSelected}
        onChange={onSelect}
        className="sr-only"
      />

      {/* Saks chord — bracket + price at heroic scale.
          Selected: full ink fill (color: var(--color-ink)).
          Unselected: text fill transparent + 1px mute-2 stroke.
          Both states are aria-hidden — the SR-only sentence below
          carries the meaning per Noor P0. */}
      <span
        aria-hidden="true"
        className={
          isSelected
            ? 'band-chord-numeral band-chord-numeral--selected'
            : 'band-chord-numeral band-chord-numeral--recessive'
        }
      >
        [&nbsp;{chordText}&nbsp;]
      </span>

      {/* Sage under-tick — selected only. AnimatePresence + layout
          props give the FLIP-style slide between columns on switch.
          Reduced-motion: layout=false → instant. */}
      <AnimatePresence initial={false}>
        {isSelected && (
          <motion.span
            key="band-under-tick"
            layout={!reducedMotion}
            layoutId={reducedMotion ? undefined : 'band-under-tick'}
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={reducedMotion ? undefined : { opacity: 0.85 }}
            exit={reducedMotion ? undefined : { opacity: 0 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 220, damping: 24, mass: 0.9 }
            }
            aria-hidden="true"
            style={{
              display: 'block',
              width: 'min(80%, 240px)',
              height: 2,
              background: 'var(--color-accent-sage)',
              marginTop: 16,
              opacity: 0.85,
            }}
          />
        )}
      </AnimatePresence>

      {/* Mono label cluster. AA contrast on every text role here. */}
      <div
        style={{
          marginTop: isSelected ? 24 : 'clamp(28px, 3vw, 40px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(11px, 1vw, 13px)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontWeight: 500,
            color: isSelected ? 'var(--color-ink)' : 'var(--color-mute)',
          }}
        >
          {band.label}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(15px, 1.2vw, 18px)',
            letterSpacing: '-0.01em',
            fontWeight: 500,
            color: isSelected ? 'var(--color-ink)' : 'var(--color-mute)',
          }}
        >
          {band.skuRangeLabel}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(11px, 0.9vw, 12px)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--color-mute-2)',
          }}
        >
          {band.hoursEstimate}
        </span>
      </div>

      {/* SR-only accessible name — full canonical band info per
          Noor P0 (saks numeral is aria-hidden; this carries the
          meaning to assistive tech). */}
      <span className="sr-only">
        {`${band.label}, ${band.priceDisplay}, ${band.skuRangeLabel}, ${band.hoursEstimate}.`}
      </span>
    </label>
  );
}
