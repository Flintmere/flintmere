import Link from 'next/link';

/**
 * PricingStripPlaceholder — slim pricing placeholder while the per-vertical /
 * per-channel pricing axis lands out-of-band per ADR 0016 + 2026-04-26
 * strategy ratification. The legacy 5-tier strip on this surface is RETIRED;
 * `/pricing` keeps the legacy composition until the pricing-restructure
 * phase. Page bracket cap stays at 2 (hero `[ last ]` + audit `[ £97 ]`).
 *
 * Extracted from `apps/scanner/src/app/page.tsx` as part of the pre-emptive
 * homepage split (refactor only — no behaviour change). Pure-presentational;
 * no props, no state.
 */
export function PricingStripPlaceholder() {
  return (
    <section id="pricing" className="mx-auto max-w-[1280px] px-8 py-24">
      <p className="eyebrow mb-6">Pricing</p>
      <p
        className="max-w-[60ch] text-[color:var(--color-ink)] mb-6"
        style={{ fontSize: 16, lineHeight: 1.55, fontWeight: 500 }}
      >
        Per-vertical, per-channel. Magnitudes are calibrating.
      </p>
      <p>
        <Link
          href="/pricing"
          className="text-[color:var(--color-ink)] underline"
          style={{ fontSize: 16, fontWeight: 500 }}
        >
          See pricing →
        </Link>
      </p>
    </section>
  );
}
