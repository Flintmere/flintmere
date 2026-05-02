import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Bracket, SiteFooter } from '@flintmere/ui';
import { PricingVerticalTabs } from '@/components/PricingVerticalTabs';
import { PricingTiersGrid } from './PricingTiersGrid';
import { AUDIT_BANDS } from '@/lib/audit-pricing';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Flintmere pricing — the vertical standard licensed × distribution mode. Forward pricing finalising May–June 2026. Existing customers grandfathered.',
};

const FAQS = [
  {
    q: "Why aren't food sign-up prices listed yet?",
    a: "We're calibrating with food merchants in May–June 2026 — what they'd actually pay against what the work costs us. Existing customers stay at their original prices either way; new sign-ups land on the calibrated number when it's ready. Talk to us if you'd like to be involved.",
  },
  {
    q: "What does 'we maintain it' mean?",
    a: 'Half-yearly publication of the food catalog standard, with a public diff log of every regulatory change between publications. Every regulatory citation links to the primary regulator URL. Maintained by Flintmere Regulatory Affairs.',
  },
  {
    q: 'Can I keep my Growth / Scale / Agency / Plus subscription?',
    a: 'Yes. Subscribers from before 2026-04-26 stay at their original prices indefinitely. The new vertical-axis ladder applies to sign-ups from 2026-04-26 forward.',
  },
  {
    q: 'Do you sell GTINs?',
    a: 'No. Flintmere is not affiliated with GS1. We guide merchants to the right GS1 office for their geography and help import the GTINs they purchase. Identifier requirements vary by marketplace.',
  },
  {
    q: 'Can I reach 100/100 without GTINs?',
    a: 'Your GTIN-less ceiling is around 82/100 depending on your catalog. You can reach that score without any GS1 investment. The last ~18 points require licensed GTINs.',
  },
  {
    q: 'How does the 30-day refund work?',
    a: 'Full refund within 30 days of your first payment, no questions. Cancel any time; you keep access through the period you paid for.',
  },
  {
    q: 'Are Shopify revenue-share fees included in the price?',
    a: "Yes. Prices are what you pay. Shopify takes its revenue share from us, not from you. Agency and Plus are direct-invoiced via Stripe; Growth and Scale bill through Shopify when the new ladder calibrates.",
  },
  {
    q: 'What about fake GTINs from third-party sellers?',
    a: "Don't. Amazon, Google Shopping, and Shopify Catalog increasingly verify against GS1's database. Fake barcodes get listings suppressed. Buy legitimate GTINs from your local GS1 office — we'll route you to the right one.",
  },
];

function conciergeBandsProse(): string {
  const lines = AUDIT_BANDS.map((b) => {
    if (b.isBespoke) {
      const price = b.priceDisplay.match(/£[\d,]+/)?.[0] ?? '£597';
      return `from ${price} bespoke (${b.skuLowerBound.toLocaleString()}+)`;
    }
    const upper = b.skuUpperBound?.toLocaleString();
    const lower = b.skuLowerBound > 0 ? b.skuLowerBound.toLocaleString() : null;
    const range = lower ? `${lower}–${upper}` : `≤${upper}`;
    return `${b.priceDisplay} (${range})`;
  });
  return `Three SKU bands — ${lines.join(', ')}.`;
}

export default function Pricing() {
  return (
    <main id="main" className="flintmere-main">
      {/* Hero — Saks chord on `[ standard ]` (extravagant-mode rebuild
          2026-05-02). The bracket is the page's brand-mark, not inline
          punctuation. Amber-radial atmosphere blooms behind it per ADR
          0021 §3. */}
      <section
        aria-labelledby="pricing-heading"
        className="relative isolate overflow-hidden bg-[color:var(--color-paper)]"
      >
        <div
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{
            inset: 0,
            background: 'var(--gradient-amber-radial)',
            transform: 'translate(0, -10%) scale(1.15)',
            opacity: 0.85,
          }}
        />

        <div
          className="relative mx-auto max-w-[1280px]"
          style={{
            paddingLeft: 'clamp(24px, 4vw, 64px)',
            paddingRight: 'clamp(24px, 4vw, 64px)',
            paddingTop: 'clamp(72px, 9vw, 128px)',
            paddingBottom: 'clamp(48px, 6vw, 96px)',
          }}
        >
          <p className="eyebrow mb-10">Pricing</p>
          <h1
            id="pricing-heading"
            className="font-sans tracking-[-0.04em] leading-[0.92] text-[color:var(--color-ink)] max-w-[18ch]"
            style={{ fontSize: 'clamp(40px, 7vw, 112px)', fontWeight: 700 }}
          >
            Pick the{' '}
            <Bracket size="saks">standard</Bracket>
            {' '}your catalog needs. We maintain it.
          </h1>
          <p
            className="font-sans"
            style={{
              marginTop: 'clamp(32px, 4vw, 56px)',
              maxWidth: '58ch',
              fontSize: 'clamp(15px, 1.1vw, 17px)',
              lineHeight: 1.55,
              fontWeight: 400,
              color: 'var(--color-mute)',
            }}
          >
            The vertical standard licensed sets the axis. Distribution mode sets the multiplier. Forward pricing finalising May–June 2026 — existing customers grandfathered at original prices.
          </p>
        </div>
      </section>

      {/* Vertical selector — URL state (?vertical=food|beauty|apparel|bundle).
          PricingTiersGrid (below) reads the same hook and renders the
          appropriate composition. Picker comes BEFORE the vertical-specific
          tier content so non-food visitors land on their selected vertical's
          content directly (was: picker buried below Concierge anchor + intro
          for food users; left non-food pages feeling empty). */}
      <Suspense fallback={null}>
        <PricingVerticalTabs />
      </Suspense>

      {/* Tier cards grid — vertical-aware.
          food   → calibrating-frame intro + 4-card recurring grid (Free /
                   Food single / Food agency / Plus). The "Calibrating
                   May–June 2026" framing baked into the section header so
                   empty price slots read as in-progress, not missing.
          non-food → heroic full-width single-message section (was a small
                     card buried in a wide container; non-food pages now
                     read as first-class). */}
      <Suspense fallback={null}>
        <PricingTiersGrid />
      </Suspense>

      {/* Concierge audit anchor — universal cross-vertical real-price
          option. Sits AFTER the vertical-specific content so each vertical
          page renders its own content first, then the audit as the
          available-now action. Bracket budget: this section's 1 active
          anchor (per ADR 0021 §4 amendment 2026-05-02). */}
      <section
        aria-label="Concierge audit"
        className="relative isolate overflow-hidden bg-[color:var(--color-paper-2)] border-y border-[color:var(--color-line)]"
      >
        <div
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{
            inset: 0,
            background: 'var(--gradient-amber-radial)',
            transform: 'translate(0, 10%) scale(1.1)',
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
          <h2
            className="font-medium tracking-[-0.03em] leading-[1.05] text-[color:var(--color-ink)] max-w-[22ch]"
            style={{ fontSize: 'clamp(32px, 4.5vw, 56px)' }}
          >
            Skip the wait — book the audit.
          </h2>

          <div
            className="overflow-hidden"
            style={{ marginTop: 'clamp(40px, 5vw, 72px)' }}
          >
            <Bracket size="saks">from £197</Bracket>
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
            {conciergeBandsProse()} Written audit letter, per-product fix CSV, 30-day plan, 30-day re-scan. Delivered in three working days.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4"
            style={{ marginTop: 'clamp(32px, 4vw, 48px)' }}
          >
            <Link href="/audit" className="btn btn-accent whitespace-nowrap">
              Book the audit →
            </Link>
            <Link href="/audit#bands" className="btn whitespace-nowrap">
              See the bands →
            </Link>
          </div>
        </div>
      </section>

      {/* "We maintain it" — ink-slab variant per ADR 0021 §7 (extravagant-mode
          rebuild 2026-05-02). Display-700 h2 at clamp(48–96px) per axis 6
          ("weight 700 permitted at display scale ≥80px"). Sage hairline
          accent below the eyebrow per axis 1. Load-bearing per ADR 0018
          + ADR 0019. */}
      <section
        aria-label="What we maintain"
        className="bg-[color:var(--color-ink)] text-[color:var(--color-paper-on-ink)]"
      >
        <div
          className="mx-auto max-w-[1280px] grid lg:grid-cols-[1.4fr_1fr] gap-12 items-start"
          style={{
            paddingLeft: 'clamp(24px, 4vw, 64px)',
            paddingRight: 'clamp(24px, 4vw, 64px)',
            paddingTop: 'clamp(80px, 10vw, 144px)',
            paddingBottom: 'clamp(80px, 10vw, 144px)',
          }}
        >
          <div>
            <p
              className="eyebrow"
              style={{
                color: 'var(--color-paper-on-ink)',
                opacity: 0.65,
                marginBottom: 16,
              }}
            >
              What &lsquo;we maintain&rsquo; means
            </p>

            <div
              aria-hidden="true"
              style={{
                width: 'clamp(48px, 5vw, 80px)',
                height: 2,
                background: 'var(--color-accent-sage)',
                marginBottom: 24,
                opacity: 0.9,
              }}
            />

            <h2
              className="max-w-[18ch]"
              style={{
                fontSize: 'clamp(48px, 7vw, 96px)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1.02,
              }}
            >
              Half-yearly publication. Public diff log between.
            </h2>
            <p
              className="mt-8"
              style={{
                fontSize: 'clamp(15px, 1.1vw, 17px)',
                lineHeight: 1.55,
                maxWidth: '58ch',
                opacity: 0.85,
              }}
            >
              Half-yearly publication of the food catalog standard, with a public diff log of every regulatory change between publications. Every regulatory citation links to the primary regulator URL. Maintained by Flintmere Regulatory Affairs.
            </p>
            <p
              className="mt-3"
              style={{
                fontSize: 'clamp(15px, 1.1vw, 17px)',
                lineHeight: 1.55,
                maxWidth: '58ch',
                opacity: 0.7,
              }}
            >
              The standard publishes at standards.flintmere.com/food/v1 — subdomain provisioned, v1 publication follows.
            </p>
          </div>
          <div className="lg:pt-16">
            <p>
              <Link
                href="mailto:hello@flintmere.com?subject=Flintmere%20food%20standard%20%E2%80%94%20notify%20me%20on%20publication"
                className="underline"
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  color: 'var(--color-paper-on-ink)',
                  textDecorationColor: 'var(--color-accent)',
                  textUnderlineOffset: 4,
                }}
              >
                Notify me when the food standard publishes →
              </Link>
            </p>
            <p className="mt-4">
              <Link
                href="/methodology"
                className="underline"
                style={{
                  fontSize: 14,
                  color: 'var(--color-paper-on-ink)',
                  opacity: 0.7,
                  textUnderlineOffset: 4,
                }}
              >
                Read how we maintain it →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Grandfathered customer disclosure — calm, fairness commitment. */}
      <section
        aria-label="Grandfathered customers"
        className="bg-[color:var(--color-paper-2)] border-b border-[color:var(--color-line)]"
      >
        <div className="mx-auto max-w-[1280px] px-8 py-12">
          <p className="eyebrow mb-4">Existing subscribers</p>
          <p
            className="max-w-[64ch] text-[color:var(--color-ink-2)]"
            style={{ fontSize: 16, lineHeight: 1.55 }}
          >
            Existing Growth (£79/mo), Scale (£249/mo), Agency (£499/mo), and Plus subscribers who signed up before 2026-04-26 continue at their original prices. The new vertical-axis ladder applies to sign-ups from 2026-04-26 forward. No action required for existing customers.
          </p>
        </div>
      </section>

      {/* FAQ — full-bleed paper section; max-width lives on the inner div so
          the background seals the gutter. Same pattern as "Existing subscribers"
          above; without this the page-level ink shows through on the sides. */}
      <section
        aria-label="Frequently asked questions"
        className="bg-[color:var(--color-paper)] border-t border-[color:var(--color-line)]"
      >
        <div className="mx-auto max-w-[1280px] px-8 py-20">
          <p className="eyebrow mb-8">Frequently asked</p>
          <ul className="list-none p-0 m-0 border-y border-[color:var(--color-line)]">
            {FAQS.map((item) => (
              <li
                key={item.q}
                className="grid md:grid-cols-[280px_1fr] gap-6 py-8 border-t border-[color:var(--color-line-soft)] first:border-t-0"
              >
                <p style={{ fontSize: 18, letterSpacing: '-0.01em' }}>{item.q}</p>
                <p
                  className="text-[color:var(--color-ink-2)]"
                  style={{ fontSize: 15, lineHeight: 1.55 }}
                >
                  {item.a}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* GTIN / VAT / Shopify-revenue-share disclaimer — canonical wording per
          claims-register.md §GTIN non-affiliation + BUSINESS.md §VAT framing.
          Same full-bleed seal pattern as the FAQ above. */}
      <section
        aria-label="Disclaimers"
        className="bg-[color:var(--color-paper)] border-t border-[color:var(--color-line)]"
      >
        <div className="mx-auto max-w-[1280px] px-8 py-12">
          <p
            className="text-[color:var(--color-mute)]"
            style={{ fontSize: 12, lineHeight: 1.55, maxWidth: '80ch' }}
          >
            Flintmere is not affiliated with GS1. Identifier requirements vary by marketplace and jurisdiction. GS1 fees are separate. Eazy Access Ltd is not VAT-registered, so prices shown are the full price &mdash; no VAT is added. Shopify&rsquo;s revenue share and Stripe processing fees are absorbed by us, not passed on.
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
