import Link from 'next/link';

/**
 * SiteFooter — the human-readable sitemap.
 *
 * Council seats: #16 Copy, #23 Platform Policy, #9 Mira (legal coverage),
 * Kate #3 (brand cohesion), #37 Consumer psychologist (findability).
 *
 * Rule: every reachable page lives here. No hidden routes. No drift between
 * surfaces. One source of truth.
 */

interface FooterLink {
  href: string;
  label: string;
  note?: string;
}

interface FooterColumn {
  heading: string;
  links: FooterLink[];
}

const COLUMNS: FooterColumn[] = [
  {
    heading: 'Product',
    links: [
      { href: '/scan', label: 'Free scan', note: '60-second diagnostic' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/research', label: 'Research' },
      { href: '/audit', label: 'Concierge audit', note: '£97 · 3 working days' },
      { href: '/bot', label: 'Bot & crawler' },
    ],
  },
  {
    heading: 'For',
    links: [
      { href: '/for/apparel', label: 'Apparel' },
      { href: '/for/beauty', label: 'Beauty' },
      { href: '/for/food-and-drink', label: 'Food & drink' },
      { href: '/for/plus', label: 'Shopify Plus' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { href: '/support', label: 'Support' },
      { href: 'https://status.flintmere.com', label: 'Status' },
      { href: 'mailto:support@flintmere.com', label: 'support@flintmere.com' },
      { href: 'mailto:security@flintmere.com', label: 'security@flintmere.com' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
      { href: '/cookies', label: 'Cookies' },
      { href: '/dpa', label: 'Data Processing Agreement' },
      { href: '/security', label: 'Security' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer
      aria-labelledby="site-footer-heading"
      className="border-t border-[color:var(--color-line)] bg-[color:var(--color-paper)]"
    >
      <h2 id="site-footer-heading" className="sr-only">
        Flintmere site directory
      </h2>

      {/* Top band — wordmark + CTA */}
      <div className="mx-auto max-w-[1280px] px-8 py-12 flex flex-col md:flex-row md:items-end md:justify-between gap-8 border-b border-[color:var(--color-line-soft)]">
        <div className="max-w-[40ch]">
          <Link
            href="/"
            aria-label="Flintmere home"
            className="inline-flex items-baseline"
            style={{
              fontSize: 'clamp(40px, 5vw, 56px)',
              fontWeight: 500,
              letterSpacing: '-0.03em',
              lineHeight: 0.95,
            }}
          >
            Flintmere
            <span
              className="font-mono font-bold"
              aria-hidden="true"
              style={{ marginLeft: 2 }}
            >
              ]
            </span>
          </Link>
          <p
            className="mt-4 text-[color:var(--color-ink-2)]"
            style={{ fontSize: 15, lineHeight: 1.55 }}
          >
            Scored for agents. Fixed for humans. The catalog-readiness tool
            for Shopify merchants.
          </p>
        </div>
        <Link href="/scan" className="btn btn-accent whitespace-nowrap">
          Run a free scan →
        </Link>
      </div>

      {/* Sitemap grid */}
      <div className="mx-auto max-w-[1280px] px-8 py-14 grid grid-cols-2 md:grid-cols-4 gap-10">
        {COLUMNS.map((col) => (
          <nav key={col.heading} aria-labelledby={`footer-${col.heading}`}>
            <p
              id={`footer-${col.heading}`}
              className="eyebrow mb-4 text-[color:var(--color-mute)]"
            >
              {col.heading}
            </p>
            <ul className="list-none p-0 m-0 space-y-3">
              {col.links.map((link) => {
                const isExternal = /^(https?:|mailto:)/.test(link.href);
                const linkEl = isExternal ? (
                  <a
                    href={link.href}
                    className="underline-offset-4 hover:underline"
                    style={{ fontSize: 14, lineHeight: 1.4 }}
                    {...(link.href.startsWith('http')
                      ? { rel: 'noreferrer', target: '_blank' }
                      : {})}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    href={link.href}
                    className="underline-offset-4 hover:underline"
                    style={{ fontSize: 14, lineHeight: 1.4 }}
                  >
                    {link.label}
                  </Link>
                );
                return (
                  <li key={link.href}>
                    {linkEl}
                    {link.note ? (
                      <span
                        className="block text-[color:var(--color-mute)]"
                        style={{ fontSize: 12, lineHeight: 1.4, marginTop: 2 }}
                      >
                        {link.note}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </nav>
        ))}
      </div>

      {/* Bottom band — legal colophon */}
      <div className="border-t border-[color:var(--color-line-soft)]">
        <div className="mx-auto max-w-[1280px] px-8 py-8 flex flex-wrap justify-between gap-4">
          <p
            className="eyebrow text-[color:var(--color-mute)]"
            style={{ fontSize: 12 }}
          >
            © 2026 Flintmere · a trading name of Eazy Access Ltd · registered
            in England and Wales
          </p>
          <p
            className="eyebrow text-[color:var(--color-mute)]"
            style={{ fontSize: 12 }}
          >
            Built in the UK · Hosted in the UK/EU
          </p>
        </div>
      </div>
    </footer>
  );
}
