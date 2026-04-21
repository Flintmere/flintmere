import type { Metadata } from 'next';
import Link from 'next/link';
import { Bracket } from '@/components/Bracket';
import { CheckoutCard } from './CheckoutCard';

export const metadata: Metadata = {
  title: 'Concierge audit — £97',
  description:
    'John reviews your Shopify store personally, records a 15-minute video walkthrough, and sends a prioritised fix plan within three working days.',
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
        <h1 className="mx-auto max-w-[14ch]">
          Want John to do it <Bracket>for you</Bracket>?
        </h1>
        <p
          className="mx-auto mt-8 max-w-[48ch] text-[color:var(--color-ink-2)]"
          style={{ fontSize: 17, lineHeight: 1.55 }}
        >
          John reviews your store personally, records a 15-minute video
          walkthrough of what to fix first, and sends a prioritised plan in
          plain English. No subscription, no sales call, no upsell.
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
              <span aria-hidden="true" className="text-[color:var(--color-mute-2)]">—</span>
              <span>
                A 15-minute video walkthrough of your store — John on screen,
                pointing at the exact things to fix first.
              </span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" className="text-[color:var(--color-mute-2)]">—</span>
              <span>
                A prioritised fix list in plain English — no jargon, no 80-page
                PDF. Ranked by how many products each fix unblocks.
              </span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" className="text-[color:var(--color-mute-2)]">—</span>
              <span>
                A CSV of every product that has a problem, and which fix it
                needs.
              </span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" className="text-[color:var(--color-mute-2)]">—</span>
              <span>
                The right GS1 office for where your business is registered, so
                you buy real barcodes from the right place.
              </span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" className="text-[color:var(--color-mute-2)]">—</span>
              <span>
                Reply with questions afterwards. John reads every one.
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
              <strong className="text-[color:var(--color-ink)]" aria-hidden="true">
                [ 01 ]
              </strong>
              &nbsp;&nbsp;Pay £97. You get a confirmation email from John
              straight away.
            </li>
            <li>
              <strong className="text-[color:var(--color-ink)]" aria-hidden="true">
                [ 02 ]
              </strong>
              &nbsp;&nbsp;Optional: book a 15-minute call from the confirmation
              email. Most people skip it — John can work from the URL alone.
            </li>
            <li>
              <strong className="text-[color:var(--color-ink)]" aria-hidden="true">
                [ 03 ]
              </strong>
              &nbsp;&nbsp;Within three working days, the walkthrough plus fix
              plan lands in your inbox.
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

      <footer className="border-t border-[color:var(--color-line)] py-10">
        <div className="mx-auto max-w-[1280px] px-8 flex flex-wrap justify-between gap-6">
          <p className="eyebrow">
            © 2026 Flintmere · a trading name of Eazy Access Ltd
          </p>
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
