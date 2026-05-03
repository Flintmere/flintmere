import Link from 'next/link';

/**
 * Plus tier anchor — secondary heroic surface on /pricing per the
 * Standing Council's Option B verdict. Plus has a published floor
 * (£1,200/mo) per ADR 0017; the full ladder is on enquiry. This is one
 * of the two "real-priced" surfaces the page now leads with (the other
 * is the concierge band ladder above).
 *
 * Bracket budget: amber-radial atmosphere blooms behind the price
 * chord; this is the section's single bracket-2 anchor (per ADR 0021
 * §4 amendment 2026-05-02).
 */

export function PlusAnchor() {
  return (
    <section
      aria-labelledby="plus-anchor-heading"
      className="relative isolate overflow-hidden bg-[color:var(--color-paper)] border-b border-[color:var(--color-line)]"
    >
      <div
        aria-hidden="true"
        className="absolute pointer-events-none"
        style={{
          inset: 0,
          background: 'var(--gradient-amber-radial)',
          transform: 'translate(0, 20%) scale(1.05)',
          opacity: 0.5,
        }}
      />

      <div
        className="relative mx-auto max-w-[1280px] grid lg:grid-cols-[1fr_1.2fr] gap-12 items-center"
        style={{
          paddingLeft: 'clamp(24px, 4vw, 64px)',
          paddingRight: 'clamp(24px, 4vw, 64px)',
          paddingTop: 'clamp(72px, 9vw, 128px)',
          paddingBottom: 'clamp(72px, 9vw, 128px)',
        }}
      >
        <div>
          <p className="eyebrow mb-6">Shopify Plus · Private beta · ADR 0017</p>
          <h2
            id="plus-anchor-heading"
            className="font-medium tracking-[-0.03em] leading-[1.0] text-[color:var(--color-ink)] max-w-[16ch]"
            style={{ fontSize: 'clamp(36px, 5vw, 72px)' }}
          >
            For 10,000+ SKUs and named-contact SLAs.
          </h2>
          <p
            className="text-[color:var(--color-ink-2)]"
            style={{
              marginTop: 'clamp(28px, 3vw, 40px)',
              maxWidth: '52ch',
              fontSize: 17,
              lineHeight: 1.55,
            }}
          >
            Custom attribute templates per vertical, dedicated support
            channel, monthly strategy call, per-contract SLAs. Anchor
            floor published; the full ladder lands on enquiry.
          </p>
          <div
            className="flex flex-col sm:flex-row gap-4"
            style={{ marginTop: 'clamp(28px, 3vw, 40px)' }}
          >
            <Link
              href="/contact?topic=plus"
              className="btn btn-accent whitespace-nowrap"
            >
              Talk to the team →
            </Link>
            <Link href="/for/plus" className="btn whitespace-nowrap">
              See what Plus includes →
            </Link>
          </div>
        </div>
        <div className="lg:justify-self-end lg:text-right">
          {/* Solid heroic price chord — saks-scale outline-shimmer reads
              airy at price-tag scale, undersells the £1,200 anchor.
              Council 2026-05-03: solid Geist Mono 700 at clamp(56-128px)
              creates the visual weight the price needs against the
              left-column display headline. */}
          <div
            aria-label="From one thousand two hundred pounds per month"
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: 'clamp(56px, 8vw, 128px)',
              letterSpacing: '-0.04em',
              lineHeight: 0.95,
              color: 'var(--color-ink)',
            }}
          >
            <span className="bracket-char" style={{ marginRight: '0.16em' }} aria-hidden="true">[</span>
            From £1,200
            <span className="bracket-char" style={{ marginLeft: '0.16em' }} aria-hidden="true">]</span>
          </div>
          <p
            className="eyebrow text-[color:var(--color-mute-2)]"
            style={{ marginTop: 'clamp(16px, 2vw, 28px)' }}
          >
            / month · anchor on enquiry
          </p>
        </div>
      </div>
    </section>
  );
}
