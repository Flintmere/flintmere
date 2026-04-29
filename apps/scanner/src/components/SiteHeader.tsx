import Link from 'next/link';

/**
 * SiteHeader — Batch B navbar redo (2026-04-29).
 *
 * ABCS-reference editorial register: sentence-case, comma-delimited
 * inline list, top-right. No pills, no buttons, no chrome bar border.
 * Logo top-left preserved (existing wordmark + bracket). Hover ink → amber.
 *
 * Spec: context/design/extravagant/2026-04-29-batch-b-five-chapter-spec.md §Navbar redo.
 *
 * Items:
 *   Audit       → /audit
 *   App         → app.flintmere.com (canonical Shopify-app destination)
 *   Standards   → /research (until standards.flintmere.com ships)
 *   Pricing     → /pricing
 *   Sign in     → app.flintmere.com (auth lives on the embedded app subdomain)
 */
export function SiteHeader() {
  return (
    <header className="relative z-20 bg-[color:var(--color-paper)]">
      <div
        className="mx-auto max-w-[1280px] flex items-center justify-between"
        style={{
          paddingLeft: 'clamp(24px, 4vw, 48px)',
          paddingRight: 'clamp(24px, 4vw, 48px)',
          paddingTop: 'clamp(20px, 2.5vw, 32px)',
          paddingBottom: 'clamp(16px, 2vw, 24px)',
        }}
      >
        <Link
          href="/"
          aria-label="Flintmere home"
          className="font-medium tracking-tight text-[color:var(--color-ink)]"
          style={{ fontSize: 'clamp(18px, 1.4vw, 20px)' }}
        >
          Flintmere
          <span className="font-mono font-bold" aria-hidden="true">
            ]
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="flex items-baseline gap-x-1.5 text-[color:var(--color-ink)]"
          style={{
            fontSize: 'clamp(14px, 1.1vw, 16px)',
            fontWeight: 600,
            letterSpacing: 0,
          }}
        >
          <Link
            href="/audit"
            className="site-nav-item hover:text-[color:var(--color-accent)] transition-colors duration-[var(--duration-instant)]"
          >
            Audit
          </Link>
          <span aria-hidden="true">,</span>
          <Link
            href="https://app.flintmere.com"
            className="site-nav-item hover:text-[color:var(--color-accent)] transition-colors duration-[var(--duration-instant)]"
          >
            App
          </Link>
          <span aria-hidden="true">,</span>
          <Link
            href="/research"
            className="site-nav-item hover:text-[color:var(--color-accent)] transition-colors duration-[var(--duration-instant)]"
          >
            Standards
          </Link>
          <span aria-hidden="true">,</span>
          <Link
            href="/pricing"
            className="site-nav-item hover:text-[color:var(--color-accent)] transition-colors duration-[var(--duration-instant)]"
          >
            Pricing
          </Link>
          <span aria-hidden="true">,</span>
          <Link
            href="https://app.flintmere.com"
            className="site-nav-item hover:text-[color:var(--color-accent)] transition-colors duration-[var(--duration-instant)]"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
