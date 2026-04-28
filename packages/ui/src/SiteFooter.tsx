import Link from 'next/link';

/**
 * SiteFooter — substantive footer with brand statement, four-column nav,
 * and a closing rule. Replaces the 27-line minimal version 2026-04-28
 * after operator critique "where is your footer".
 *
 * Surface: ink-slab variant (paper-on-ink), pairs with the manifesto
 * section that precedes it — visual continuity. Sage hairline at top
 * for set cohesion with the homepage's hero + picker-block sage anchors.
 */
export function SiteFooter() {
  return (
    <footer
      className="border-t-[2px] border-[color:var(--color-accent-sage)] bg-[color:var(--color-ink)]"
      aria-label="Site footer"
    >
      <div className="mx-auto max-w-[1280px] px-8 lg:px-12 py-16 lg:py-20">
        {/* Brand statement row */}
        <div className="grid lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-12 lg:gap-16 pb-14 border-b border-[color:var(--color-line-dark)]">
          <div>
            <p
              className="text-[clamp(28px,3.5vw,40px)] font-medium tracking-[-0.025em] leading-[1.1] max-w-[28ch]"
              style={{ color: 'var(--color-paper-on-ink)' }}
            >
              Catalogs built for the agents that decide your next sale.
            </p>
            <p
              className="mt-6 max-w-[44ch] text-[15px] leading-[1.6]"
              style={{ color: 'var(--color-mute-inv)' }}
            >
              Free public scanner. £97 one-off concierge audit. Pro subscriptions
              for catalogs of any size — the data is yours either way.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/scan"
                className="inline-flex items-center gap-2.5 px-5 py-3 bg-[color:var(--color-accent)] text-[color:var(--color-accent-ink)] font-mono text-[12px] font-medium tracking-[0.14em] uppercase hover:bg-[color:var(--color-paper-on-ink)] hover:text-[color:var(--color-ink)] transition-colors duration-[var(--duration-instant)]"
              >
                Run the free scan
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/audit"
                className="inline-flex items-center gap-2.5 px-5 py-3 border border-[color:var(--color-paper-on-ink)] font-mono text-[12px] font-medium tracking-[0.14em] uppercase hover:bg-[color:var(--color-paper-on-ink)] hover:text-[color:var(--color-ink)] transition-colors duration-[var(--duration-instant)]"
                style={{ color: 'var(--color-paper-on-ink)' }}
              >
                Book the £97 audit
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          {/* Product column */}
          <nav aria-label="Product" className="flex flex-col gap-3">
            <p
              className="font-mono text-[11px] tracking-[0.14em] uppercase mb-2"
              style={{ color: 'var(--color-accent-sage)', fontWeight: 500 }}
            >
              // Product
            </p>
            <Link
              href="/scan"
              className="text-[14px] hover:opacity-100 transition-opacity"
              style={{ color: 'var(--color-paper-on-ink)' }}
            >
              Free scanner
            </Link>
            <Link
              href="/audit"
              className="text-[14px] hover:opacity-100 transition-opacity"
              style={{ color: 'var(--color-paper-on-ink)' }}
            >
              £97 concierge audit
            </Link>
            <Link
              href="/pricing"
              className="text-[14px] hover:opacity-100 transition-opacity"
              style={{ color: 'var(--color-paper-on-ink)' }}
            >
              Pricing
            </Link>
            <Link
              href="/research"
              className="text-[14px] hover:opacity-100 transition-opacity"
              style={{ color: 'var(--color-paper-on-ink)' }}
            >
              Research
            </Link>
          </nav>

          {/* Verticals column */}
          <nav aria-label="Verticals" className="flex flex-col gap-3">
            <p
              className="font-mono text-[11px] tracking-[0.14em] uppercase mb-2"
              style={{ color: 'var(--color-accent-sage)', fontWeight: 500 }}
            >
              // Verticals
            </p>
            <Link
              href="/for/food-and-drink"
              className="text-[14px]"
              style={{ color: 'var(--color-paper-on-ink)' }}
            >
              Food &amp; drink
            </Link>
            <Link
              href="/for/beauty"
              className="text-[14px]"
              style={{ color: 'var(--color-paper-on-ink)' }}
            >
              Beauty
            </Link>
            <Link
              href="/for/apparel"
              className="text-[14px]"
              style={{ color: 'var(--color-paper-on-ink)' }}
            >
              Apparel
            </Link>
            <Link
              href="/for/plus"
              className="text-[14px]"
              style={{ color: 'var(--color-paper-on-ink)' }}
            >
              Shopify Plus
            </Link>
          </nav>

          {/* Company column */}
          <nav aria-label="Company" className="flex flex-col gap-3">
            <p
              className="font-mono text-[11px] tracking-[0.14em] uppercase mb-2"
              style={{ color: 'var(--color-accent-sage)', fontWeight: 500 }}
            >
              // Company
            </p>
            <Link
              href="/support"
              className="text-[14px]"
              style={{ color: 'var(--color-paper-on-ink)' }}
            >
              Support
            </Link>
            <Link
              href="/privacy"
              className="text-[14px]"
              style={{ color: 'var(--color-paper-on-ink)' }}
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-[14px]"
              style={{ color: 'var(--color-paper-on-ink)' }}
            >
              Terms
            </Link>
            <Link
              href="/security"
              className="text-[14px]"
              style={{ color: 'var(--color-paper-on-ink)' }}
            >
              Security
            </Link>
            <Link
              href="/cookies"
              className="text-[14px]"
              style={{ color: 'var(--color-paper-on-ink)' }}
            >
              Cookies
            </Link>
            <Link
              href="/dpa"
              className="text-[14px]"
              style={{ color: 'var(--color-paper-on-ink)' }}
            >
              DPA
            </Link>
          </nav>
        </div>

        {/* Closing row — copyright + fineprint */}
        <div className="pt-10 flex flex-wrap items-baseline justify-between gap-6">
          <p
            className="font-mono text-[11px] tracking-[0.14em] uppercase"
            style={{ color: 'var(--color-mute-inv)' }}
          >
            © 2026 Flintmere · a trading name of Eazy Access Ltd · England &amp; Wales · UK
          </p>
          <p
            className="font-mono text-[11px] tracking-[0.14em] uppercase"
            style={{ color: 'var(--color-accent-sage)', fontWeight: 500 }}
          >
            Flintmere<span aria-hidden="true">]</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
