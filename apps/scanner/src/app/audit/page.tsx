import type { Metadata } from 'next';
import Link from 'next/link';
import { Bracket } from '@/components/Bracket';
import { CheckoutCard } from './CheckoutCard';

export const metadata: Metadata = {
  title: 'Concierge audit — £97',
  description:
    "We'll run the full Flintmere audit on your Shopify store and deliver a 30-day remediation plan within 48 hours.",
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
          Concierge audit · £97 · 48-hour delivery
        </p>
        <h1 className="mx-auto max-w-[14ch]">
          Want us to do it <Bracket>for you</Bracket>?
        </h1>
        <p
          className="mx-auto mt-8 max-w-[48ch] text-[color:var(--color-ink-2)]"
          style={{ fontSize: 17, lineHeight: 1.55 }}
        >
          One of us runs the full Flintmere audit against your store,
          hand-weights the issues, and delivers a prioritised 30-day plan. No
          subscription, no sales call, no upsell.
        </p>
      </section>

      <section className="mx-auto max-w-[520px] px-6 pb-20">
        <CheckoutCard />
      </section>

      <section className="mx-auto max-w-[720px] px-6 pb-24">
        <div className="border-t border-[color:var(--color-line-soft)] pt-12">
          <p className="eyebrow mb-4">What you get</p>
          <ul
            className="list-none p-0 m-0 space-y-3"
            style={{ fontSize: 16, lineHeight: 1.55 }}
          >
            <li className="flex gap-3">
              <span
                aria-hidden="true"
                className="text-[color:var(--color-mute-2)]"
              >
                —
              </span>
              <span>
                Full catalog scan across all seven checks (we take OAuth access
                or an export CSV).
              </span>
            </li>
            <li className="flex gap-3">
              <span
                aria-hidden="true"
                className="text-[color:var(--color-mute-2)]"
              >
                —
              </span>
              <span>
                Every issue ranked by revenue impact × score deficit — not
                alphabetical, not severity-only.
              </span>
            </li>
            <li className="flex gap-3">
              <span
                aria-hidden="true"
                className="text-[color:var(--color-mute-2)]"
              >
                —
              </span>
              <span>
                Per-product CSV: every affected SKU, the fix required, the
                estimated lift.
              </span>
            </li>
            <li className="flex gap-3">
              <span
                aria-hidden="true"
                className="text-[color:var(--color-mute-2)]"
              >
                —
              </span>
              <span>
                30-day remediation plan sequenced by effort and dependency.
              </span>
            </li>
            <li className="flex gap-3">
              <span
                aria-hidden="true"
                className="text-[color:var(--color-mute-2)]"
              >
                —
              </span>
              <span>
                Geography-aware GTIN path — the right GS1 office for where
                you&rsquo;re registered.
              </span>
            </li>
            <li className="flex gap-3">
              <span
                aria-hidden="true"
                className="text-[color:var(--color-mute-2)]"
              >
                —
              </span>
              <span>
                One 15-minute kickoff call so we understand your vertical. No
                pitch.
              </span>
            </li>
          </ul>
        </div>

        <div className="mt-14">
          <p className="eyebrow mb-4">How it works</p>
          <ol
            className="list-none p-0 m-0 space-y-4 text-[color:var(--color-ink-2)]"
            style={{ fontSize: 15, lineHeight: 1.55 }}
          >
            <li>
              <strong
                className="text-[color:var(--color-ink)]"
                aria-hidden="true"
              >
                [ 01 ]
              </strong>
              &nbsp;&nbsp;Pay £97. 30-day refund if we miss the 48-hour
              deadline.
            </li>
            <li>
              <strong
                className="text-[color:var(--color-ink)]"
                aria-hidden="true"
              >
                [ 02 ]
              </strong>
              &nbsp;&nbsp;Book a 15-minute kickoff call from the confirmation
              email.
            </li>
            <li>
              <strong
                className="text-[color:var(--color-ink)]"
                aria-hidden="true"
              >
                [ 03 ]
              </strong>
              &nbsp;&nbsp;We audit; we don&rsquo;t sell. 48 hours later your
              report lands in your inbox.
            </li>
          </ol>
        </div>

        <p
          className="mt-14 text-[color:var(--color-mute)]"
          style={{ fontSize: 12, lineHeight: 1.55 }}
        >
          Flintmere Ltd is a trading name of Eazy Access Ltd (England &amp;
          Wales). Eazy Access Ltd is not VAT-registered, so £97 is the full
          price — no VAT is added. Flintmere is not affiliated with GS1.
          Identifier requirements vary by marketplace and jurisdiction. Outcome
          estimates in the report are indicative, based on comparable Shopify
          stores in the same vertical and size band.
        </p>
      </section>

      <footer className="border-t border-[color:var(--color-line)] py-10">
        <div className="mx-auto max-w-[1280px] px-8 flex flex-wrap justify-between gap-6">
          <p className="eyebrow">© 2026 Flintmere Ltd</p>
          <nav className="flex gap-8" aria-label="Footer">
            <Link href="/privacy" className="eyebrow">
              Privacy
            </Link>
            <Link href="/terms" className="eyebrow">
              Terms
            </Link>
            <Link href="/scan" className="eyebrow">
              Scan
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
