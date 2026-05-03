import Link from 'next/link';
import { Bracket } from '@flintmere/ui';
import { AUDIT_BANDS, type AuditBand } from '@/lib/audit-pricing';

/**
 * Concierge audit band ladder — primary anchor on /pricing per the
 * Standing Council's Option B verdict on the 2026-05-03 re-scope. The
 * page now leads with the surfaces that have real prices today (this
 * + Plus); the calibrating food tiers were demoted to a cohort
 * invitation below.
 *
 * Three SKU-banded cards (Band 1 £197 / Band 2 £397 / Band 3 from £597
 * bespoke). Source of truth: AUDIT_BANDS in lib/audit-pricing.ts (ADR
 * 0022). The section's heroic anchor is the page's bracket-2 chord —
 * Saks-scale `[ from £197 ]` placed alongside the prose.
 */

export function ConciergeBands() {
  return (
    <section
      aria-labelledby="concierge-bands-heading"
      className="relative isolate overflow-hidden bg-[color:var(--color-paper-2)] border-y border-[color:var(--color-line)]"
    >
      <div
        aria-hidden="true"
        className="absolute pointer-events-none"
        style={{
          inset: 0,
          background: 'var(--gradient-amber-radial)',
          transform: 'translate(0, -10%) scale(1.1)',
          opacity: 0.6,
        }}
      />

      <div
        className="relative mx-auto max-w-[1280px]"
        style={{
          paddingLeft: 'clamp(24px, 4vw, 64px)',
          paddingRight: 'clamp(24px, 4vw, 64px)',
          paddingTop: 'clamp(72px, 9vw, 128px)',
          paddingBottom: 'clamp(72px, 9vw, 128px)',
        }}
      >
        <p className="eyebrow mb-6">Concierge audit · Available now · One-off</p>
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-12 items-end">
          <h2
            id="concierge-bands-heading"
            className="font-medium tracking-[-0.03em] leading-[1.0] text-[color:var(--color-ink)] max-w-[18ch]"
            style={{ fontSize: 'clamp(40px, 6vw, 88px)' }}
          >
            Skip the wait — book the audit.
          </h2>
          <div>
            <Bracket size="saks">from £197</Bracket>
          </div>
        </div>

        <p
          className="text-[color:var(--color-ink-2)]"
          style={{
            marginTop: 'clamp(32px, 4vw, 48px)',
            maxWidth: '60ch',
            fontSize: 17,
            lineHeight: 1.55,
          }}
        >
          Written audit letter, per-product fix CSV, 30-day plan, 30-day
          re-scan. Delivered in three working days. Pick your band by
          catalog size; you self-attest at checkout.
        </p>

        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          style={{ marginTop: 'clamp(48px, 5vw, 72px)' }}
        >
          {AUDIT_BANDS.map((band) => (
            <BandCard key={band.slug} band={band} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BandCard({ band }: { band: AuditBand }) {
  const priceId = `concierge-${band.slug}-price`;
  const ctaHref = band.isBespoke
    ? `/audit?band=${band.slug}#bands`
    : `/audit?band=${band.slug}`;
  const ctaLabel = band.isBespoke ? 'Request a quote →' : 'Book the audit →';

  return (
    <article
      data-hover-lift
      className="border border-[color:var(--color-line)] bg-[color:var(--color-paper)] p-6 flex flex-col"
      style={{ minHeight: 360 }}
      aria-labelledby={`concierge-${band.slug}-name`}
    >
      <h3
        id={`concierge-${band.slug}-name`}
        aria-describedby={priceId}
        style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.015em' }}
      >
        {band.label}
      </h3>
      <p
        id={priceId}
        className="mt-3"
        style={{
          fontSize: band.isBespoke ? 'clamp(22px, 2.6vw, 28px)' : 'clamp(40px, 5vw, 52px)',
          fontWeight: 500,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          color: 'var(--color-ink)',
        }}
      >
        {band.priceDisplay}
      </p>
      <p className="eyebrow mt-3 text-[color:var(--color-mute-2)]">
        {band.skuRangeLabel}
      </p>
      <ul
        className="mt-6 list-none p-0 m-0 space-y-2 text-[color:var(--color-ink-2)]"
        style={{ fontSize: 13, lineHeight: 1.5 }}
      >
        <li className="flex gap-3">
          <span aria-hidden="true" style={{ color: 'var(--color-mute-2)' }}>
            —
          </span>
          <span>
            {band.deliverable.auditScope === 'full'
              ? 'Full-catalog audit'
              : 'Representative-sample audit'}
          </span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" style={{ color: 'var(--color-mute-2)' }}>
            —
          </span>
          <span>{band.deliverable.fullyDraftedFixCount} drafted fixes</span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" style={{ color: 'var(--color-mute-2)' }}>
            —
          </span>
          <span>{band.hoursEstimate} of operator time</span>
        </li>
      </ul>
      <Link
        href={ctaHref}
        className="btn btn-accent mt-auto"
        style={{ marginTop: 'auto' }}
      >
        {ctaLabel}
      </Link>
    </article>
  );
}
