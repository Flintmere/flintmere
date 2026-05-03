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

import { useCallback, useEffect, useId, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AUDIT_BANDS,
  type AuditBand,
  type AuditBandSlug,
} from '@/lib/audit-pricing';
import { track } from '@/lib/plausible';
import { CheckoutCard } from './CheckoutCard';

// Default band drives the headline price the user sees on land. Anchored
// to band-1 (£197) to match the "from £197" marketing copy across the
// site — defaulting higher creates sticker shock at the conversion
// moment. Council 2026-05-03 (#15 PM, #5 Pricing, #22 Marketing,
// #37 Consumer Psych): minimum-friction default; merchants self-attest
// up to band-2/band-3 via the band switcher. ADR 0022 §Customer
// self-attestation accepts the operational catch.
const DEFAULT_BAND: AuditBandSlug = 'band-1';

function isAuditBandSlug(value: string | null): value is AuditBandSlug {
  return value === 'band-1' || value === 'band-2' || value === 'band-3';
}

export function BandTriptych() {
  const reduce = useReducedMotion();
  const [bandSlug, setBandSlug] = useState<AuditBandSlug>(DEFAULT_BAND);
  const liveId = useId();
  const groupName = useId();

  // Read ?band= URL param on mount and pre-select the requested band.
  // Bridges the /pricing → /audit deep-link path: clicking a specific
  // band card on /pricing lands the user on /audit?band=band-X#checkout
  // with that band already selected — no second click. window.location
  // over useSearchParams to avoid forcing the route into Suspense.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const requested = new URLSearchParams(window.location.search).get('band');
    if (isAuditBandSlug(requested) && requested !== DEFAULT_BAND) {
      setBandSlug(requested);
      track('band_preselected', { band: requested });
    }
  }, []);

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
      {/* CheckoutCard FIRST — the page is a checkout, not a band picker.
          Council 2026-05-03 (#15 PM, #36 SRE, #34 QE, #10 Eng, #11 Founder,
          #7 Ops, #8 Noor, #9 Legal, #22 Marketing — verdict A): single
          flow, ExpressCheckoutElement + PaymentElement above the fold,
          band-switcher demoted below as the secondary disclosure. Top-tier
          checkout archetype (Apple One, Stripe Atlas, Linear, Notion,
          Shop Pay) — never put a comparison spread between intent and
          submit. */}
      <div
        data-reveal
        style={{
          marginTop: 'clamp(40px, 5vw, 72px)',
          maxWidth: 720,
          ['--reveal-delay' as string]: '160ms',
        }}
      >
        <CheckoutCard bandSlug={bandSlug} onBandChange={handleBandChange} />
      </div>

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
          ['--reveal-delay' as string]: '240ms',
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

      {/* Band-switcher — demoted to disclosure. The user does NOT need
          to interact with this to pay; band-1 is the default and most
          merchants belong here. Shown for those who need to escalate to
          band-2 (1,501–5,000 SKUs) or band-3 (5,001+, bespoke quote). */}
      <fieldset
        data-reveal
        style={{
          border: 0,
          padding: 0,
          margin: 0,
          marginTop: 'clamp(56px, 7vw, 96px)',
          ['--reveal-delay' as string]: '320ms',
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
          <span aria-hidden="true">// </span>different size catalogue? change band
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
  reducedMotion: _reducedMotion,
  onSelect,
}: BandColumnProps) {
  const inputId = `band-chord-${band.slug}`;

  return (
    <label
      htmlFor={inputId}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        cursor: 'pointer',
        padding: 'clamp(20px, 2.4vw, 28px) clamp(20px, 2.4vw, 32px)',
        borderLeft: isFirst ? 'none' : '1px solid var(--color-line-soft)',
        background: isSelected ? 'var(--color-paper-2)' : 'transparent',
        position: 'relative',
        transition: 'background-color 0.2s ease',
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

      {/* Caption row — band label + SKU range, mono caps */}
      <span
        aria-hidden="true"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(10px, 0.9vw, 12px)',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          fontWeight: 500,
          color: 'var(--color-mute)',
          lineHeight: 1.3,
        }}
      >
        {band.label} · {band.skuRangeLabel}
      </span>

      {/* Price — solid mono at human-readable scale (not saks-heroic).
          Always solid ink; never outline-stroke. The chip is a
          switcher, not a brand-mark moment. */}
      <span
        aria-hidden="true"
        style={{
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          fontSize: 'clamp(28px, 3.4vw, 44px)',
          letterSpacing: '-0.03em',
          lineHeight: 1,
          color: 'var(--color-ink)',
        }}
      >
        {band.priceDisplay}
      </span>

      {/* Hours line — micro mono caption */}
      <span
        aria-hidden="true"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(10px, 0.85vw, 11px)',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--color-mute-2)',
          lineHeight: 1.3,
          marginTop: 4,
        }}
      >
        {band.hoursEstimate}
      </span>

      {/* Sage under-tick — selected only. Static (not animated) — the
          switcher is below the fold; reveal motion is overproduced. */}
      {isSelected && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 'clamp(20px, 2.4vw, 32px)',
            width: 32,
            height: 2,
            background: 'var(--color-accent-sage)',
            opacity: 0.9,
          }}
        />
      )}

      {/* SR-only accessible name — full canonical band info per
          Noor P0. */}
      <span className="sr-only">
        {`${band.label}, ${band.priceDisplay}, ${band.skuRangeLabel}, ${band.hoursEstimate}.`}
      </span>
    </label>
  );
}
