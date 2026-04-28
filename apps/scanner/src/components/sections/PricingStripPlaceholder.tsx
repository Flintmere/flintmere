import Link from 'next/link';

/**
 * PricingStripPlaceholder — Shape C / Variant A composition.
 *
 * Operator-confirmed proposition (context/conversion/2026-04-28-pricing-strip-homepage.md):
 *  - Eyebrow: `// pricing` — Mono, --color-mute, with sage decorative
 *    text-decoration under-line (sage as text-decoration-color, NEVER as
 *    text fill — ADR 0021 §Accent §Forbidden).
 *  - Headline: "Catalogs built for the agentic web." — display Geist Sans,
 *    weight 500, clamp(40px,4.5vw,56px), 22ch wrap, period preserved.
 *  - Sub-line: 19-word lede in --color-mute, ≤56ch wrap.
 *  - CTA: "See pricing →" as plain underlined Mono link (NOT btn-accent —
 *    the audit-deep amber CTA two sections up is the page's primary CTA;
 *    this CTA must not compete; Stripe secondary-link cadence).
 *
 * Surface: paper bg (NOT ink-slab; Manifesto immediately below carries
 * the ink-slab beat — paper → ink → footer cadence per Margaret Howell
 * quiet-luxury reference). Single left-aligned column, vertical rhythm,
 * generous py-32, zero decorative ornament beyond the eyebrow under-line.
 *
 * Bracket count: zero. Page total stays at 2 (hero + audit-deep).
 *
 * Council 9-0 GREEN — context/design/marketing/2026-04-28-batch-a-foot-of-homepage.md.
 */
export function PricingStripPlaceholder() {
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="mx-auto max-w-[1280px] px-8 py-32"
    >
      <p
        className="font-mono text-[11px] tracking-[0.14em] uppercase mb-8"
        style={{
          color: 'var(--color-mute)',
          fontWeight: 500,
          textDecorationLine: 'underline',
          textDecorationColor: 'var(--color-accent-sage)',
          textDecorationThickness: '1px',
          textUnderlineOffset: '6px',
          display: 'inline-block',
        }}
      >
        // pricing
      </p>
      <h2
        id="pricing-heading"
        className="max-w-[22ch]"
        style={{
          fontSize: 'clamp(40px, 4.5vw, 56px)',
          fontWeight: 500,
          letterSpacing: '-0.03em',
          lineHeight: 1.05,
          color: 'var(--color-ink)',
        }}
      >
        Catalogs built for the agentic web.
      </h2>
      <p
        className="mt-8 max-w-[56ch]"
        style={{
          fontSize: 18,
          lineHeight: 1.55,
          color: 'var(--color-mute)',
        }}
      >
        Free scan today. £97 to do it properly. Monthly tiers when the
        product is ready for them.
      </p>
      <p className="mt-10">
        <Link
          href="/pricing"
          className="font-mono text-[12px] tracking-[0.14em] uppercase underline underline-offset-[6px] decoration-[color:var(--color-line)]"
          style={{ color: 'var(--color-ink)' }}
        >
          See pricing
          <span aria-hidden="true"> →</span>
        </Link>
      </p>
    </section>
  );
}
