import Link from 'next/link';

/**
 * SiteHeader — the lifted header chrome.
 *
 * Phase A of the food-first homepage restructure (per
 * context/design/specs/2026-04-26-homepage-food-first.md §Implementation order)
 * lifts the per-page <header> into a single shared component rendered from
 * apps/scanner/src/app/layout.tsx — so the IA's "5 nav items everywhere" contract
 * (and any future nav update) lands once, not per page.
 *
 * Phase A constraint: preserve the existing canonical pattern verbatim
 * (3-item nav: Pillars / Pricing / Research + amber "Run a free scan" CTA).
 * The 5-item nav update (Verticals · Pricing · Methodology · Research · About)
 * is Phase C web-implementation work, not Phase A.
 *
 * Scanner-only at this stage. Lifting to packages/ui/ happens when
 * standards.flintmere.com starts (the second consumer trigger per
 * memory/design/components.md and the standards architecture spec §2.2).
 */
export function SiteHeader() {
  return (
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
          <Link
            href="/#pillars"
            className="eyebrow hover:text-[color:var(--color-ink)]"
          >
            Pillars
          </Link>
          <Link
            href="/pricing"
            className="eyebrow hover:text-[color:var(--color-ink)]"
          >
            Pricing
          </Link>
          <Link
            href="/research"
            className="eyebrow hover:text-[color:var(--color-ink)]"
          >
            Research
          </Link>
        </nav>
        <Link href="/scan" className="btn btn-accent">
          Run a free scan →
        </Link>
      </div>
    </header>
  );
}
