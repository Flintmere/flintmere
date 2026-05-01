import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { SiteFooter } from '@flintmere/ui';
import { PricingVerticalTabs } from '@/components/PricingVerticalTabs';
import { PricingTiersGrid } from './PricingTiersGrid';

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

export default function Pricing() {
  return (
    <main id="main" className="flintmere-main">
      {/* Hero — bracket-1 on `[ standard ]` (structural noun, ADR 0018). */}
      <section className="bg-[color:var(--color-paper)] mx-auto max-w-[1280px] px-8 py-24">
        <p className="eyebrow mb-6">Pricing</p>
        <h1 className="max-w-[24ch]">
          Pick the{' '}
          <span
            className="font-mono"
            style={{
              fontWeight: 700,
              letterSpacing: '-0.005em',
            }}
          >
            [&nbsp;standard&nbsp;]
          </span>{' '}
          your catalog needs. We maintain it.
        </h1>
        <p
          className="mt-8 max-w-[58ch] text-[color:var(--color-ink-2)]"
          style={{ fontSize: 17, lineHeight: 1.55 }}
        >
          The vertical standard licensed sets the axis. Distribution mode sets the multiplier. Forward pricing finalising May–June 2026 — existing customers grandfathered at original prices.
        </p>
      </section>

      {/* Vertical selector — URL state (?vertical=food|beauty|apparel|bundle).
          PricingTiersGrid (below) reads the same hook and renders the
          appropriate composition. */}
      <Suspense fallback={null}>
        <PricingVerticalTabs />
      </Suspense>

      {/* Tier cards grid — vertical-aware. Food = 5-card grid (Free / Food
          single / Food agency / Concierge audit (bracket-2) / Plus).
          Beauty / Apparel / Bundle = single-message card. */}
      <Suspense fallback={null}>
        <PricingTiersGrid />
      </Suspense>

      {/* "We maintain it" claim block — load-bearing per ADR 0018 + ADR 0019.
          Link target is a notify-me mailto until standards.flintmere.com
          publishes (Phase 4). Re-targets on lift via separate claim-review. */}
      <section
        aria-label="What we maintain"
        className="bg-[color:var(--color-paper)] mx-auto max-w-[1280px] px-8 py-20 border-t border-[color:var(--color-line)]"
      >
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-12 items-start">
          <div>
            <p className="eyebrow mb-4">What &lsquo;we maintain&rsquo; means</p>
            <h2
              className="max-w-[26ch]"
              style={{
                fontSize: 'clamp(28px, 3.4vw, 36px)',
                fontWeight: 500,
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
              }}
            >
              Half-yearly publication. Public diff log between.
            </h2>
            <p
              className="mt-6 max-w-[58ch] text-[color:var(--color-ink-2)]"
              style={{ fontSize: 16, lineHeight: 1.55 }}
            >
              Half-yearly publication of the food catalog standard, with a public diff log of every regulatory change between publications. Every regulatory citation links to the primary regulator URL. Maintained by Flintmere Regulatory Affairs.
            </p>
            <p
              className="mt-3 max-w-[58ch] text-[color:var(--color-ink-2)]"
              style={{ fontSize: 16, lineHeight: 1.55 }}
            >
              The standard publishes at standards.flintmere.com/food/v1 — subdomain provisioned, v1 publication follows.
            </p>
          </div>
          <div className="lg:pt-12">
            <p>
              <Link
                href="mailto:hello@flintmere.com?subject=Flintmere%20food%20standard%20%E2%80%94%20notify%20me%20on%20publication"
                className="underline"
                style={{ fontSize: 16, fontWeight: 500 }}
              >
                Notify me when the food standard publishes →
              </Link>
            </p>
            <p className="mt-3">
              <Link
                href="/about"
                className="text-[color:var(--color-mute)] underline"
                style={{ fontSize: 14 }}
              >
                Read why this is a public standard →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Grandfathered customer disclosure — calm, fairness commitment. */}
      <section
        aria-label="Grandfathered customers"
        className="bg-[color:var(--color-paper-2)] border-y border-[color:var(--color-line)]"
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

      {/* FAQ */}
      <section
        aria-label="Frequently asked questions"
        className="bg-[color:var(--color-paper)] mx-auto max-w-[1280px] px-8 py-20 border-t border-[color:var(--color-line)]"
      >
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
      </section>

      {/* GTIN / VAT / Shopify-revenue-share disclaimer — canonical wording per
          claims-register.md §GTIN non-affiliation + BUSINESS.md §VAT framing. */}
      <section
        aria-label="Disclaimers"
        className="bg-[color:var(--color-paper)] mx-auto max-w-[1280px] px-8 py-12 border-t border-[color:var(--color-line)]"
      >
        <p
          className="text-[color:var(--color-mute)]"
          style={{ fontSize: 12, lineHeight: 1.55, maxWidth: '80ch' }}
        >
          Flintmere is not affiliated with GS1. Identifier requirements vary by marketplace and jurisdiction. GS1 fees are separate. Eazy Access Ltd is not VAT-registered, so prices shown are the full price &mdash; no VAT is added. Shopify&rsquo;s revenue share and Stripe processing fees are absorbed by us, not passed on.
        </p>
      </section>

      <SiteFooter />
    </main>
  );
}
