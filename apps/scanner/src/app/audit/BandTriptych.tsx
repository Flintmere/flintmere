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
import {
  AUDIT_BANDS,
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
  const [bandSlug, setBandSlug] = useState<AuditBandSlug>(DEFAULT_BAND);
  const liveId = useId();

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

  // Selected band drives the heroic price chord + the value-prop
  // copy. Defaults reflect band-1 deliverable (10 drafted fixes) and
  // scope (full per-product); upgrades to 25 drafted fixes / sample
  // for band-2/3 when the URL pre-select fires.
  const heroPrice = selected.priceDisplay;
  const fixCount = selected.deliverable.fullyDraftedFixCount;
  const isSample = selected.deliverable.auditScope === 'representative-sample';
  const valueLine = isSample
    ? `Representative-sample audit. ${fixCount} fully-drafted fixes. Three working days.`
    : `Per-product audit. ${fixCount} fully-drafted fixes. Three working days.`;

  return (
    <>
      {/* Heroic price chord — the page's brand-mark moment. The price
          IS the chord (replaces the previous `[ for you ]` voice
          chord on the deleted Chapter 1 hero). Dynamically reflects
          the selected band — band-1 default shows £197; band-2/3
          upgrade in place when ?band= URL param fires. Council
          2026-05-04 ratified hero-IS-checkout archetype. */}
      <h1
        id="audit-hero"
        data-reveal
        className="font-sans tracking-[-0.04em] leading-[0.88] text-[color:var(--color-ink)]"
        style={{
          fontSize: 'var(--scale-h1-saks)',
          maxWidth: '14ch',
          fontWeight: 700,
          margin: 0,
          ['--reveal-delay' as string]: '0ms',
        }}
      >
        <span
          className="bracket flintmere-outline-shimmer"
          style={{
            fontSize: 'var(--scale-h1-saks)',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            display: 'inline-block',
          }}
        >
          {heroPrice}
        </span>
      </h1>

      {/* Value-prop line — single read, dynamic per band */}
      <p
        data-reveal
        style={{
          marginTop: 'clamp(20px, 2.5vw, 32px)',
          maxWidth: '50ch',
          fontSize: 'clamp(15px, 1.1vw, 18px)',
          lineHeight: 1.55,
          fontWeight: 400,
          color: 'var(--color-mute)',
          ['--reveal-delay' as string]: '80ms',
        }}
      >
        {valueLine}
      </p>

      {/* CheckoutCard — the form. ExpressCheckoutElement + PaymentElement
          + Email + Shop URL fields + submit. */}
      <div
        data-reveal
        style={{
          marginTop: 'clamp(36px, 4vw, 56px)',
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

      {/* Band-change round-trip — top-tier checkout playbook (Stripe,
          Apple, Linear, Notion, Vercel, Shop Pay) puts comparison on
          the pricing surface and never re-presents it mid-checkout.
          /pricing owns the 3-band comparison; /audit owns conversion.
          Users who landed on band-1 by default and need to escalate
          round-trip to /pricing#concierge-bands. ~3 seconds of friction
          for the minority who need it; net win on flow clarity. */}
      <p
        data-reveal
        className="font-mono uppercase"
        style={{
          marginTop: 'clamp(40px, 5vw, 64px)',
          fontSize: 'clamp(11px, 1vw, 13px)',
          letterSpacing: '0.18em',
          fontWeight: 500,
          color: 'var(--color-mute)',
          ['--reveal-delay' as string]: '320ms',
        }}
      >
        <span aria-hidden="true">// </span>
        {`Currently: ${selected.label} · ${selected.priceDisplay} · ${selected.skuRangeLabel}.`}
        {' '}
        <a
          href="/pricing#concierge-bands"
          style={{
            color: 'var(--color-ink)',
            textDecoration: 'underline',
            textUnderlineOffset: 4,
          }}
        >
          Wrong size? Compare bands →
        </a>
      </p>

      {/* ARIA-live region — natural-sentence announcement on
          programmatic band change (URL param). Polite, not assertive.
          Visually hidden via .sr-only. */}
      <p
        id={liveId}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {`${selected.label} selected — ${selected.priceDisplay} — ${selected.skuRangeLabel}, ${selected.hoursEstimate}.`}
      </p>
    </>
  );
}
