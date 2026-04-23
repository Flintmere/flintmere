import type { Metadata } from 'next';
import Link from 'next/link';
import { Bracket } from '@/components/Bracket';
import { SiteFooter } from '@/components/SiteFooter';
import { CheckoutCard } from './CheckoutCard';
import { CONCIERGE_DELIVERABLE_LIST } from '@/lib/copy';

export const metadata: Metadata = {
  title: 'Concierge audit — £97',
  description:
    'John reads your Shopify store product by product and sends a written audit letter plus a per-product fix CSV within three working days. 30-day re-scan included.',
};

export default function Audit() {
  return (
    <main id="main">
      <header className="border-b border-[color:var(--color-line)]">
        <div className="mx-auto max-w-[1280px] px-8 h-[56px] flex items-center justify-between">
          <Link
            href="/"
            aria-label="Flintmere home"
            className="text-[18px] font-medium tracking-tight"
          >
            Flintmere
            <span className="font-mono font-bold" aria-hidden="true">
              ]
            </span>
          </Link>
          <nav className="hidden md:flex gap-8" aria-label="Primary">
            <Link href="/pricing" className="eyebrow">
              Pricing
            </Link>
            <Link href="/research" className="eyebrow">
              Research
            </Link>
          </nav>
          <Link href="/scan" className="btn">
            Run a free scan →
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[640px] px-6 pt-20 pb-10 text-center">
        <p className="eyebrow mb-6">
          Concierge audit · £97 one-off · three working days
        </p>
        <h1 className="mx-auto max-w-[16ch]">
          Want John to read your store <Bracket>for you</Bracket>?
        </h1>
        <p
          className="mx-auto mt-8 max-w-[50ch] text-[color:var(--color-ink-2)]"
          style={{ fontSize: 17, lineHeight: 1.55 }}
        >
          John reads your store product by product, writes a detailed audit
          letter pointing at exactly what to fix, and sends a per-product CSV
          with the worst 10 products already drafted for you. No video, no
          call, no upsell. Just the data.
        </p>
      </section>

      <section className="mx-auto max-w-[520px] px-6 pb-20">
        <CheckoutCard />
      </section>

      <section className="mx-auto max-w-[720px] px-6 pb-24">
        <div className="border-t border-[color:var(--color-line-soft)] pt-12">
          <p className="eyebrow mb-4">What you get</p>
          <ol
            className="list-none p-0 m-0 space-y-5"
            style={{ fontSize: 16, lineHeight: 1.55 }}
          >
            {CONCIERGE_DELIVERABLE_LIST.map((item, idx) => (
              <li key={item.title} className="grid grid-cols-[48px_1fr] gap-3">
                <span
                  aria-hidden="true"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    letterSpacing: '0.12em',
                    color: 'var(--color-mute)',
                    paddingTop: 4,
                  }}
                >
                  [&nbsp;0{idx + 1}&nbsp;]
                </span>
                <div>
                  <p style={{ fontSize: 17, fontWeight: 500 }}>{item.title}</p>
                  <p
                    className="mt-1 text-[color:var(--color-ink-2)]"
                    style={{ fontSize: 15, lineHeight: 1.55 }}
                  >
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-14">
          <p className="eyebrow mb-4">How it works</p>
          <ol
            className="list-none p-0 m-0 space-y-4 text-[color:var(--color-ink-2)]"
            style={{ fontSize: 15, lineHeight: 1.55 }}
          >
            <li>
              <strong className="text-[color:var(--color-ink)]" aria-hidden="true">
                [ 01 ]
              </strong>
              &nbsp;&nbsp;Pay £97. A confirmation email from John arrives
              within a minute.
            </li>
            <li>
              <strong className="text-[color:var(--color-ink)]" aria-hidden="true">
                [ 02 ]
              </strong>
              &nbsp;&nbsp;John reads your catalog and writes the audit. No
              call, no screen-share — the URL is all he needs.
            </li>
            <li>
              <strong className="text-[color:var(--color-ink)]" aria-hidden="true">
                [ 03 ]
              </strong>
              &nbsp;&nbsp;Within three working days, the letter plus CSV plus
              30-day plan lands in your inbox. Reply with questions — John
              reads every one.
            </li>
            <li>
              <strong className="text-[color:var(--color-ink)]" aria-hidden="true">
                [ 04 ]
              </strong>
              &nbsp;&nbsp;Day 30: the scanner re-runs and emails you a
              progress report.
            </li>
          </ol>
        </div>

        <p
          className="mt-14 text-[color:var(--color-mute)]"
          style={{ fontSize: 12, lineHeight: 1.55 }}
        >
          Flintmere is a trading name of Eazy Access Ltd (England &amp; Wales).
          Eazy Access Ltd is not VAT-registered, so £97 is the full price — no
          VAT is added. Flintmere is not affiliated with GS1. Identifier
          requirements vary by marketplace and jurisdiction. The audit is
          informational; the checks map to Shopify product data requirements,
          GS1 UK identifier rules, and Google Merchant Center specifications.
        </p>
      </section>

      <SiteFooter />
    </main>
  );
}
