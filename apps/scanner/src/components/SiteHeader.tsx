'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

/**
 * SiteHeader — Batch B navbar redo (2026-04-29) + mobile sheet (2026-05-02).
 *
 * Desktop (≥md): editorial register kept verbatim from the Batch B redo —
 * sentence-case, comma-delimited inline list, top-right. No pills, no
 * buttons, no chrome bar border. Logo top-left preserved. Hover ink → amber.
 *
 * Mobile (<md): the comma-list collapses to a single mono "Menu" trigger.
 * Tap opens a paper-on-paper full-screen sheet with the nav items typeset
 * larger (Geist Sans clamp 28–36px) on hairline-divided rows, each with a
 * mono path caption. Bottom of the sheet anchors a single amber "Run a free
 * scan" CTA — the canonical primary action when nothing else is in flight.
 *
 * Accessibility (Noor #8 contract):
 *  - Trigger has aria-expanded + aria-controls referring to the sheet.
 *  - Sheet has role="dialog" + aria-modal="true".
 *  - Escape closes; close button auto-focuses on open; focus restores to
 *    the trigger on close (so keyboard users don't lose place).
 *  - Body scroll is locked while the sheet is open.
 *  - Items are real <Link>s — no JS-only handlers — so deep-link previews
 *    and right-click "open in new tab" both work.
 *  - Reduced-motion: no animation on open/close. The sheet just appears.
 *    A future motion enhancement could add a paper-fade entrance gated on
 *    prefers-reduced-motion: no-preference, but the structural pattern is
 *    legible without it.
 *
 * Items ordered for first-time-visitor primacy: Audit (the wedge),
 * Standards (the moat), Pricing (universal expectation), Sign in
 * (returning-user idiom at the close).
 *
 * Item count — the "App" item was retired 2026-05-02 after a Standing
 * Council review of nav-item-count psychology (operator query: "is five
 * too many"). Industry shape is 3–5 destinations + 1–2 right-aligned
 * actions; "App" pointed to the same destination as "Sign in"
 * (app.flintmere.com), so it was a duplicate, not a destination. The
 * Shopify-app story belongs in body content (homepage hero, /audit,
 * /pricing), not in the nav. Council reasoning: Hick's Law makes the
 * 5→4 cut a measurable decision-time win; #11 investor voice reads
 * shorter nav as more confident; #3 editorial holds 4-beat comma-list
 * as cleaner clause than 5-beat. Future ceiling: 5 desktop items max;
 * anything beyond goes to the mobile sheet or the footer.
 */

interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Audit', href: '/audit' },
  // Standards routes to the canonical subdomain — DNS provisioned 2026-05-02
  // (operator-confirmed). Methodology body still references
  // standards.flintmere.com/food/v1 as the eventual artefact home.
  { label: 'Standards', href: 'https://standards.flintmere.com', external: true },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Sign in', href: 'https://app.flintmere.com', external: true },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);

    // Defer focus to next frame so the dialog has mounted.
    const focusTimer = window.setTimeout(() => {
      closeRef.current?.focus();
    }, 0);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(focusTimer);
      // Restore focus to the trigger so keyboard flow doesn't drop.
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <>
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

          {/* Desktop comma-list — unchanged Batch B register. */}
          <nav
            aria-label="Primary"
            className="hidden md:flex items-baseline gap-x-1.5 text-[color:var(--color-ink)]"
            style={{
              fontSize: 'clamp(14px, 1.1vw, 16px)',
              fontWeight: 600,
              letterSpacing: 0,
            }}
          >
            {NAV_ITEMS.map((item, i) => (
              <span key={item.label} className="contents">
                <Link
                  href={item.href}
                  className="site-nav-item hover:text-[color:var(--color-accent)] transition-colors duration-[var(--duration-instant)]"
                  {...(item.external
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                >
                  {item.label}
                </Link>
                {i < NAV_ITEMS.length - 1 ? (
                  <span aria-hidden="true">,</span>
                ) : null}
              </span>
            ))}
          </nav>

          {/* Mobile trigger — mono caption. The Tempo-style restraint:
              one word, no chrome, hover lifts to amber. */}
          <button
            ref={triggerRef}
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu-sheet"
            onClick={() => setOpen(true)}
            className="md:hidden site-nav-item font-mono uppercase text-[color:var(--color-ink)] hover:text-[color:var(--color-accent)] transition-colors duration-[var(--duration-instant)]"
            style={{
              fontSize: 12,
              letterSpacing: '0.18em',
              fontWeight: 500,
              padding: '4px 0',
            }}
          >
            Menu
          </button>
        </div>
      </header>

      {open ? (
        <div
          id="mobile-menu-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className="fixed inset-0 z-50 bg-[color:var(--color-paper)] flex flex-col md:hidden"
        >
          <div
            className="flex items-center justify-between"
            style={{
              paddingLeft: 'clamp(24px, 4vw, 48px)',
              paddingRight: 'clamp(24px, 4vw, 48px)',
              paddingTop: 'clamp(20px, 2.5vw, 32px)',
              paddingBottom: 'clamp(16px, 2vw, 24px)',
            }}
          >
            <Link
              href="/"
              onClick={() => setOpen(false)}
              aria-label="Flintmere home"
              className="font-medium tracking-tight text-[color:var(--color-ink)]"
              style={{ fontSize: 'clamp(18px, 1.4vw, 20px)' }}
            >
              Flintmere
              <span className="font-mono font-bold" aria-hidden="true">
                ]
              </span>
            </Link>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              className="site-nav-item font-mono uppercase text-[color:var(--color-ink)] hover:text-[color:var(--color-accent)] transition-colors duration-[var(--duration-instant)]"
              style={{
                fontSize: 12,
                letterSpacing: '0.18em',
                fontWeight: 500,
                padding: '4px 0',
              }}
            >
              Close
            </button>
          </div>

          <nav
            aria-label="Primary"
            className="flex-1 overflow-y-auto"
            style={{
              paddingLeft: 'clamp(24px, 4vw, 48px)',
              paddingRight: 'clamp(24px, 4vw, 48px)',
              paddingTop: 'clamp(24px, 4vw, 40px)',
            }}
          >
            <ol className="list-none p-0 m-0">
              {NAV_ITEMS.map((item) => {
                // Mobile sheet path caption — show the canonical hostname
                // for external links (multiple subdomains now), and the
                // pathname for internal routes.
                const caption = item.external
                  ? new URL(item.href).hostname.replace(/^www\./, '')
                  : item.href;
                return (
                  <li
                    key={item.label}
                    className="border-t border-[color:var(--color-line)] last:border-b"
                  >
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="group flex items-baseline justify-between gap-6"
                      style={{
                        paddingTop: 'clamp(20px, 3.2vw, 28px)',
                        paddingBottom: 'clamp(20px, 3.2vw, 28px)',
                      }}
                      {...(item.external
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                    >
                      <span
                        className="font-sans text-[color:var(--color-ink)] group-hover:text-[color:var(--color-accent)] transition-colors duration-[var(--duration-instant)]"
                        style={{
                          fontSize: 'clamp(28px, 6.5vw, 40px)',
                          fontWeight: 500,
                          letterSpacing: '-0.025em',
                          lineHeight: 1.0,
                        }}
                      >
                        {item.label}
                      </span>
                      <span
                        aria-hidden="true"
                        className="font-mono uppercase text-[color:var(--color-mute-2)] whitespace-nowrap"
                        style={{
                          fontSize: 11,
                          letterSpacing: '0.16em',
                          fontWeight: 500,
                        }}
                      >
                        {caption}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div
            className="border-t border-[color:var(--color-line)]"
            style={{
              paddingLeft: 'clamp(24px, 4vw, 48px)',
              paddingRight: 'clamp(24px, 4vw, 48px)',
              paddingTop: 'clamp(20px, 3vw, 32px)',
              paddingBottom: 'clamp(24px, 3.5vw, 40px)',
            }}
          >
            <Link
              href="/scan"
              onClick={() => setOpen(false)}
              className="btn btn-accent w-full justify-center"
            >
              Run a free scan &rarr;
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
