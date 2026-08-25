import Link from 'next/link';
import { AUDIT_BANDS, type AuditBand } from '@/lib/audit-pricing';
import { ViewportReveal } from '@/components/ViewportReveal';

/**
 * Catalog Letter band ladder — primary pricing-comparison surface on
 * /pricing per the Standing Council's Option B verdict on the
 * 2026-05-03 re-scope.
 *
 * IMPORTANT: this section is /pricing's COMPARISON treatment (here are
 * the three bands, pick yours), NOT a re-statement of /audit's hero.
 * /audit is the conversion surface and owns the heroic Saks chord
 * `[ for you ]` + the value-prop prose ("written letter, per-product
 * fix CSV, no call, no screen-share, three working days"). /pricing
 * trims to: a one-line comparison framing, the three SKU bands as
 * cards, and per-band CTAs that hand off to /audit. Borrowing
 * /audit's chord here makes both pages read identically at the fold —
 * which is what we just fixed.
 *
 * Source of truth: AUDIT_BANDS in lib/audit-pricing.ts (ADR 0022).
 */

export function ConciergeBands() {
  return (
    <section
      id="concierge-bands"
      aria-labelledby="concierge-bands-heading"
      className="bg-[color:var(--color-paper-2)] border-y border-[color:var(--color-line)]"
    >
      <div
        className="mx-auto max-w-[1280px]"
        style={{
          paddingLeft: 'clamp(24px, 4vw, 64px)',
          paddingRight: 'clamp(24px, 4vw, 64px)',
          paddingTop: 'clamp(64px, 8vw, 112px)',
          paddingBottom: 'clamp(64px, 8vw, 112px)',
        }}
      >
        <p className="eyebrow mb-6">The Catalog Letter · Available now · One-off</p>
        <h2
          id="concierge-bands-heading"
          className="font-medium tracking-[-0.03em] leading-[1.05] text-[color:var(--color-ink)] max-w-[24ch]"
          style={{ fontSize: 'clamp(28px, 3.6vw, 52px)' }}
        >
          Three bands. Pick by catalog size.
        </h2>
        <p
          className="text-[color:var(--color-ink-2)]"
          style={{
            marginTop: 'clamp(20px, 2.5vw, 32px)',
            maxWidth: '60ch',
            fontSize: 16,
            lineHeight: 1.55,
          }}
        >
          One-off catalog letter; you self-attest your band at checkout. Full
          deliverable + offer detail on the{' '}
          <Link
            href="/catalog-letter#checkout"
            // Cross-host (marketing → audit.flintmere.com): Next prefetches this
            // relative Link, middleware 301s it cross-origin, and the CORS-mode
            // RSC fetch can't follow → "Failed to fetch RSC payload" console noise.
            // Suppress the doomed prefetch; the click still full-navigates.
            prefetch={false}
            className="underline"
            style={{ textDecorationColor: 'var(--color-accent)', textUnderlineOffset: 4 }}
          >
            catalog letter page
          </Link>
          .
        </p>

        <ViewportReveal>
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            style={{ marginTop: 'clamp(40px, 5vw, 64px)' }}
          >
            {AUDIT_BANDS.map((band, i) => (
              <BandCard key={band.slug} band={band} revealDelay={i * 120} />
            ))}
          </div>
        </ViewportReveal>
      </div>
    </section>
  );
}

function BandCard({ band, revealDelay }: { band: AuditBand; revealDelay: number }) {
  const priceId = `concierge-${band.slug}-price`;
  // All bands deep-link to the checkout section; the BandTriptych
  // reads ?band= on mount and pre-selects, so the user lands on the
  // form already configured for their chosen band — no extra click.
  // Bespoke (band-3) routes through the same anchor; CheckoutCard
  // renders the bespoke-quote variant when the band is band-3.
  const ctaHref = `/catalog-letter?band=${band.slug}#checkout`;
  const ctaLabel = band.isBespoke ? 'Request a quote →' : 'Book your catalog letter →';

  return (
    <article
      data-reveal
      data-hover-lift
      className="border border-[color:var(--color-line)] bg-[color:var(--color-paper)] p-6 flex flex-col"
      style={{
        minHeight: 360,
        ['--reveal-delay' as string]: `${revealDelay}ms`,
      }}
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
      <p className="eyebrow mt-3">
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
              ? 'Full-catalog letter'
              : 'Representative-sample letter'}
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
