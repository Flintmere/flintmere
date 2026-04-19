import type { Metadata } from 'next';
import Link from 'next/link';
import { Bracket } from '@/components/Bracket';

export const metadata: Metadata = {
  title: 'Concierge audit — £97',
  description:
    "We'll run the full Flintmere audit on your Shopify store and deliver a 30-day remediation plan within 48 hours.",
};

export default function Audit() {
  const calendly = process.env.CALENDLY_CONCIERGE_URL ?? '#';

  return (
    <main id="main">
      <header className="border-b border-[color:var(--color-line)]">
        <div className="mx-auto max-w-[1280px] px-8 h-[56px] flex items-center justify-between">
          <Link href="/" className="text-[18px] font-medium tracking-tight">
            Flintmere
          </Link>
          <nav className="hidden md:flex gap-8" aria-label="Primary">
            <Link href="/pricing" className="eyebrow">Pricing</Link>
            <Link href="/research" className="eyebrow">Research</Link>
          </nav>
          <Link href="/scan" className="btn">Run a free scan →</Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1280px] px-8 py-24 grid md:grid-cols-[1fr_380px] gap-16 items-start">
        <div>
          <p className="eyebrow mb-6">Concierge audit · £97 · 48-hour delivery</p>
          <h1 className="max-w-[18ch]">
            Want us to do it <Bracket>for you</Bracket>?
          </h1>
          <p
            className="mt-8 max-w-[56ch] text-[color:var(--color-ink-2)]"
            style={{ fontSize: 17, lineHeight: 1.55 }}
          >
            One of us runs the full Flintmere audit against your store, hand-weights the issues, and delivers a prioritised 30-day plan. No subscription, no sales call, no upsell.
          </p>

          <div className="mt-12">
            <p className="eyebrow mb-4">What you get</p>
            <ul className="list-none p-0 m-0 space-y-3" style={{ fontSize: 16, lineHeight: 1.55 }}>
              <li className="flex gap-3">
                <span aria-hidden="true" className="text-[color:var(--color-mute-2)]">—</span>
                <span>Full catalog scan across all six pillars (we take OAuth access or an export CSV).</span>
              </li>
              <li className="flex gap-3">
                <span aria-hidden="true" className="text-[color:var(--color-mute-2)]">—</span>
                <span>Every issue ranked by revenue impact × score deficit — not alphabetical, not severity-only.</span>
              </li>
              <li className="flex gap-3">
                <span aria-hidden="true" className="text-[color:var(--color-mute-2)]">—</span>
                <span>Per-product CSV: every affected SKU, the fix required, the estimated lift.</span>
              </li>
              <li className="flex gap-3">
                <span aria-hidden="true" className="text-[color:var(--color-mute-2)]">—</span>
                <span>30-day remediation plan sequenced by effort and dependency.</span>
              </li>
              <li className="flex gap-3">
                <span aria-hidden="true" className="text-[color:var(--color-mute-2)]">—</span>
                <span>Geography-aware GTIN path — the right GS1 office for where you&rsquo;re registered.</span>
              </li>
              <li className="flex gap-3">
                <span aria-hidden="true" className="text-[color:var(--color-mute-2)]">—</span>
                <span>One 15-minute kickoff call so we understand your vertical. No pitch.</span>
              </li>
            </ul>
          </div>

          <div className="mt-12">
            <p className="eyebrow mb-4">How it works</p>
            <ol className="list-none p-0 m-0 space-y-4 text-[color:var(--color-ink-2)]" style={{ fontSize: 15, lineHeight: 1.55 }}>
              <li><strong className="text-[color:var(--color-ink)]" aria-hidden="true">[ 01 ]</strong>&nbsp;&nbsp;Pay £97 via Stripe. 30-day refund if we miss the 48-hour deadline.</li>
              <li><strong className="text-[color:var(--color-ink)]" aria-hidden="true">[ 02 ]</strong>&nbsp;&nbsp;Book a 15-minute kickoff call via Calendly.</li>
              <li><strong className="text-[color:var(--color-ink)]" aria-hidden="true">[ 03 ]</strong>&nbsp;&nbsp;We audit; we don&rsquo;t sell. 48 hours later your report lands in your inbox.</li>
            </ol>
          </div>

          <p className="mt-12 text-[color:var(--color-mute)]" style={{ fontSize: 12, lineHeight: 1.55, maxWidth: '70ch' }}>
            Flintmere is not affiliated with GS1. Identifier requirements vary by marketplace and jurisdiction. Outcome estimates in the report are indicative, based on comparable Shopify stores in the same vertical and size band.
          </p>
        </div>

        {/* Purchase card */}
        <aside
          className="p-8 border border-[color:var(--color-line)]"
          style={{ background: 'var(--color-paper-2)', position: 'sticky', top: 24 }}
        >
          <p className="eyebrow mb-4">Book the audit</p>
          <p style={{ fontSize: 56, letterSpacing: '-0.04em', lineHeight: 1, fontWeight: 500 }}>£97</p>
          <p className="mt-2 text-[color:var(--color-mute)]" style={{ fontSize: 13 }}>
            One-time. 48-hour delivery guarantee.
          </p>

          <form method="POST" action="/api/concierge/checkout" className="mt-6">
            <label htmlFor="audit-email" className="eyebrow block mb-2">Your email</label>
            <input
              id="audit-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full border border-[color:var(--color-ink)] bg-[color:var(--color-paper)] px-4 py-3 mb-4"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 14 }}
              placeholder="you@store.com"
            />
            <label htmlFor="audit-shop" className="eyebrow block mb-2">Shop URL</label>
            <input
              id="audit-shop"
              name="shopUrl"
              type="text"
              required
              className="w-full border border-[color:var(--color-ink)] bg-[color:var(--color-paper)] px-4 py-3 mb-4"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 14 }}
              placeholder="your-store.myshopify.com"
            />
            <button type="submit" className="btn btn-accent w-full justify-center">
              Pay £97 with Stripe →
            </button>
          </form>

          <p className="mt-6 text-[color:var(--color-mute)]" style={{ fontSize: 12, lineHeight: 1.5 }}>
            Or skip the payment for now and{' '}
            <a href={calendly} target="_blank" rel="noreferrer" className="underline">
              book a call on Calendly
            </a>
            {' '}(we&rsquo;ll invoice after).
          </p>
        </aside>
      </section>

      <footer className="border-t border-[color:var(--color-line)] py-10">
        <div className="mx-auto max-w-[1280px] px-8 flex flex-wrap justify-between gap-6">
          <p className="eyebrow">© 2026 Flintmere Ltd</p>
          <nav className="flex gap-8" aria-label="Footer">
            <Link href="/privacy" className="eyebrow">Privacy</Link>
            <Link href="/terms" className="eyebrow">Terms</Link>
            <Link href="/scan" className="eyebrow">Scan</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
