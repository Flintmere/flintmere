import type { Metadata } from 'next';
import Link from 'next/link';
import { Bracket } from '@/components/Bracket';
import { SiteFooter } from '@/components/SiteFooter';
import { TIERS } from '@/lib/pricing';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Flintmere pricing — Free, Growth £79, Scale £249, Agency £499, Plus from £1,500. 14-day trial on Growth and Scale.',
};

const FAQS = [
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
    a: 'Yes. Prices are what you pay. Shopify takes its revenue share from us, not from you. Agency and Plus are direct-invoiced via Stripe; Growth and Scale bill through Shopify.',
  },
  {
    q: 'What about fake GTINs from third-party sellers?',
    a: "Don't. Amazon, Google Shopping, and Shopify Catalog increasingly verify against GS1's database. Fake barcodes get listings suppressed. Buy legitimate GTINs from your local GS1 office — we'll route you to the right one.",
  },
];

export default function Pricing() {
  return (
    <main id="main">
      <header className="border-b border-[color:var(--color-line)]">
        <div className="mx-auto max-w-[1280px] px-8 h-[56px] flex items-center justify-between">
          <Link href="/" aria-label="Flintmere home" className="text-[18px] font-medium tracking-tight">
            Flintmere<span className="font-mono font-bold" aria-hidden="true">]</span>
          </Link>
          <nav className="hidden md:flex gap-8" aria-label="Primary">
            <Link href="/#pillars" className="eyebrow">Pillars</Link>
            <Link href="/pricing" className="eyebrow" aria-current="page" style={{ color: 'var(--color-ink)' }}>Pricing</Link>
            <Link href="/research" className="eyebrow">Research</Link>
          </nav>
          <Link href="/scan" className="btn btn-accent">Run a free scan →</Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1280px] px-8 py-24">
        <p className="eyebrow mb-6">Pricing</p>
        <h1 className="max-w-[20ch]">
          Five tiers. One <Bracket>question</Bracket>: how many stores?
        </h1>
        <p
          className="mt-8 max-w-[52ch] text-[color:var(--color-ink-2)]"
          style={{ fontSize: 17, lineHeight: 1.55 }}
        >
          Flat-rate subscriptions. No per-enrichment billing, no credit packs, no surprises. Start free, upgrade when the value&rsquo;s visible.
        </p>
      </section>

      <section
        aria-label="Start here"
        className="border-y border-[color:var(--color-line)] bg-[color:var(--color-paper-2)]"
      >
        <div className="mx-auto max-w-[1280px] px-8 py-24 grid md:grid-cols-[auto_1fr] gap-12 items-end">
          <div>
            <p className="eyebrow mb-4">Start here</p>
            <p
              style={{
                fontSize: 'clamp(88px, 14vw, 220px)',
                fontWeight: 500,
                letterSpacing: '-0.045em',
                lineHeight: 0.92,
              }}
            >
              £0
              <span
                aria-hidden="true"
                className="inline-block align-baseline ml-2"
                style={{
                  width: '0.22em',
                  height: '2px',
                  background: 'var(--color-accent)',
                  transform: 'translateY(-0.22em)',
                }}
              />
            </p>
          </div>
          <div className="pb-6">
            <p
              className="max-w-[40ch]"
              style={{
                fontSize: 24,
                lineHeight: 1.35,
                letterSpacing: '-0.015em',
              }}
            >
              The free scan runs in 60 seconds. No signup, no credit card.
              Upgrade when the value is visible.
            </p>
            <p className="mt-6">
              <Link href="/scan" className="underline eyebrow">
                Run the free scan →
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section aria-label="Tiers" className="grid grid-cols-1 md:grid-cols-5 border-y border-[color:var(--color-line)]">
        {TIERS.map((tier) => (
          <div
            key={tier.slug}
            className="p-8 border-r border-[color:var(--color-line)] last:border-r-0 max-md:border-r-0 max-md:border-b max-md:last:border-b-0"
            style={{ background: tier.featured ? 'var(--color-paper-2)' : undefined }}
          >
            <p className="eyebrow">{tier.name}</p>
            <p className="mt-3" style={{ fontSize: 40, letterSpacing: '-0.04em', lineHeight: 1, fontWeight: 500 }}>
              {tier.price}
              {tier.unit ? (
                <span className="text-[color:var(--color-mute)]" style={{ fontSize: 13, fontWeight: 400, marginLeft: 4 }}>
                  {tier.unit}
                </span>
              ) : null}
            </p>
            <p className="eyebrow mt-4 text-[color:var(--color-mute)]">{tier.scope}</p>
            <ul className="mt-6 list-none p-0 m-0 space-y-3" style={{ fontSize: 13, lineHeight: 1.5 }}>
              {tier.features.map((f) => (
                <li key={f} className="flex gap-3">
                  <span aria-hidden="true" style={{ color: 'var(--color-mute-2)' }}>—</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Concierge callout */}
      <section className="mx-auto max-w-[1280px] px-8 py-16">
        <div className="p-12 border border-[color:var(--color-line)] bg-[color:var(--color-paper-2)] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="eyebrow mb-3">One-off audit</p>
            <h2 className="max-w-[28ch]" style={{ fontSize: 28, letterSpacing: '-0.02em' }}>
              Want John to read your store? <Bracket>£97</Bracket>, delivered in three working days.
            </h2>
            <p className="mt-4 text-[color:var(--color-mute)] max-w-[48ch]" style={{ fontSize: 14, lineHeight: 1.55 }}>
              Written audit letter, per-product fix CSV with the worst ten already drafted, 30-day fix sequence, GS1 UK barcode path, and a 30-day re-scan. No video, no call &mdash; just the data.
            </p>
          </div>
          <Link href="/audit" className="btn btn-accent whitespace-nowrap">Book the audit →</Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-[1280px] px-8 py-20 border-t border-[color:var(--color-line)]">
        <p className="eyebrow mb-8">Frequently asked</p>
        <ul className="list-none p-0 m-0 border-y border-[color:var(--color-line)]">
          {FAQS.map((item) => (
            <li
              key={item.q}
              className="grid md:grid-cols-[280px_1fr] gap-6 py-8 border-t border-[color:var(--color-line-soft)] first:border-t-0"
            >
              <p style={{ fontSize: 18, letterSpacing: '-0.01em' }}>{item.q}</p>
              <p className="text-[color:var(--color-ink-2)]" style={{ fontSize: 15, lineHeight: 1.55 }}>
                {item.a}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Disclaimer */}
      <section className="mx-auto max-w-[1280px] px-8 py-12 border-t border-[color:var(--color-line)]">
        <p className="text-[color:var(--color-mute)]" style={{ fontSize: 12, lineHeight: 1.55, maxWidth: '80ch' }}>
          Flintmere is not affiliated with GS1. Identifier requirements vary by marketplace and jurisdiction. Prices shown exclude VAT where applicable. Shopify&rsquo;s revenue share and Stripe processing fees are absorbed by us, not passed on.
        </p>
      </section>

      <SiteFooter />
    </main>
  );
}
