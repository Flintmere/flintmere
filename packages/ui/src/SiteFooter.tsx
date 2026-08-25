import Link from 'next/link';

// Cross-host link absolutes — `flintmere.com` (marketing) → `audit.flintmere.com`
// (scanner) routes would otherwise emit a 301 hop. Inlined here rather
// than imported from `@/lib/host-routing` to keep packages/ui consumer-
// agnostic; if Flintmere ever splits hosts further, update both.
const SCANNER_HOST_URL = 'https://audit.flintmere.com';
const SCAN_URL = `${SCANNER_HOST_URL}/scan`;
const CATALOG_LETTER_URL = `${SCANNER_HOST_URL}/catalog-letter`;

// Social profiles — surfaced as footer icons and mirrored in the
// Organization JSON-LD `sameAs` (apps/scanner/src/app/layout.tsx). Public
// handles, hardcoded by design (anti-waste rule 6 — public-by-design URLs,
// not secrets). Single-path 24-viewport icons, currentColor fill.
const SOCIAL_LINKS: ReadonlyArray<{ label: string; href: string; path: string }> = [
  {
    label: 'Flintmere on X',
    href: 'https://x.com/flintmere_',
    path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  },
  {
    label: 'Flintmere on Bluesky',
    href: 'https://bsky.app/profile/flintmere.bsky.social',
    path: 'M5.769 2.524c2.732 2.051 5.671 6.211 6.231 8.443.56-2.232 3.5-6.392 6.231-8.443C20.197 1.045 23 -.094 23 3.104c0 .638-.366 5.366-.581 6.134-.747 2.666-3.464 3.347-5.881 2.935 4.226.719 5.303 3.102 2.981 5.485-4.408 4.525-6.334-1.135-6.829-2.586-.09-.266-.133-.39-.133-.282 0-.108-.043.016-.133.282-.495 1.451-2.421 7.111-6.829 2.586-2.322-2.383-1.245-4.766 2.981-5.485-2.417.412-5.134-.269-5.881-2.935C1.366 8.47 1 3.742 1 3.104 1 -.094 3.803 1.045 5.769 2.524Z',
  },
  {
    // Handle pending rename per ADR 0028 §5 ("Deliberately not fixed") —
    // target @flintmere, falling back to @flintmere.scan. Operator action
    // outside this repo, not yet done. Do not change this href until the
    // handle actually moves — pointing at a handle that doesn't exist is
    // worse than pointing at the retired one.
    label: 'Flintmere on Instagram',
    href: 'https://instagram.com/flintmere.audit',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163C8.741 0 8.332.014 7.052.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
  },
];
const BLOG_URL = `${SCANNER_HOST_URL}/blog`;

/**
 * SiteFooter — closing-chord footer (Batch B, 2026-04-29).
 *
 * Composition:
 *   - Sticky-reveal panel (.flintmere-footer-sticky) — sticky CSS scoped to
 *     .flintmere-main parent in globals.css, so on the homepage the footer
 *     is the curtain reveal and on other pages it renders as a normal block.
 *   - Wordmark + captions centred horizontally + vertically; legal nav
 *     centred at bottom.
 *   - Wordmark at clamp(48,12vw,160) Geist Mono weight 700. Floor lowered
 *     from 80→48 on 2026-05-02 after operator caught the wordmark
 *     overflowing the content area on iPhone-class viewports (430px and
 *     below). The min-80 lock from feedback_footer_wordmark_locked.md was
 *     amplification-driven on desktop; on phones it cropped the closing
 *     `]`. The new clamp keeps desktop impact (12vw scales aggressively
 *     into the 160px ceiling at ≥1280px) while shrinking gracefully into
 *     the smallest viewports.
 *   - Three-line caption block beneath wordmark — email · Built in [London] ·
 *     legal-entity strip.
 *   - Bottom legal nav — Privacy / Terms / Security / Cookies / DPA / Support
 *     comma-delimited, mute-inv on ink ≈ AA at 12px.
 */
export function SiteFooter() {
  return (
    <footer
      className="flintmere-footer-sticky border-t-[2px] border-[color:var(--color-accent-sage)] bg-[color:var(--color-ink)]"
      aria-label="Site footer"
    >
      <div
        className="mx-auto w-full max-w-[1280px] flex flex-col"
        style={{
          flex: 1,
          paddingLeft: 'clamp(24px, 4vw, 48px)',
          paddingRight: 'clamp(24px, 4vw, 48px)',
          paddingTop: 'clamp(32px, 4vw, 64px)',
          paddingBottom: 'clamp(24px, 3vw, 48px)',
        }}
      >
        {/* Top strip — primary nav, sentence-case comma-delimited, paper-on-
            ink, Geist Sans 600. Sits above the wordmark chord.
            Mobile (<sm): the 7 destinations don't fit on one line and the
            comma-flex wrapped awkwardly across two lines (operator caught
            2026-05-02 on iPhone 14 Pro Max). On <sm we flow the items as a
            2-column grid (calmer column rhythm, no orphaned comma at line
            end) and hide the comma separators since they only read inline.
            ≥sm restores the canonical comma-flex pattern. */}
        <nav
          aria-label="Footer primary"
          className="grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:items-baseline sm:flex-wrap sm:gap-x-1.5 sm:gap-y-2"
          style={{
            fontSize: 'clamp(13px, 1vw, 15px)',
            fontWeight: 600,
            color: 'var(--color-paper-on-ink)',
          }}
        >
          <Link
            href={SCAN_URL}
            className="hover:text-[color:var(--color-accent)] transition-colors duration-[var(--duration-instant)]"
          >
            Free scan
          </Link>
          <span aria-hidden="true" className="hidden sm:inline">,</span>
          <Link
            href="/secret"
            className="hover:text-[color:var(--color-accent)] transition-colors duration-[var(--duration-instant)]"
          >
            One-time secret
          </Link>
          <span aria-hidden="true" className="hidden sm:inline">,</span>
          <Link
            href={CATALOG_LETTER_URL}
            className="hover:text-[color:var(--color-accent)] transition-colors duration-[var(--duration-instant)]"
          >
            £197 letter
          </Link>
          <span aria-hidden="true" className="hidden sm:inline">,</span>
          <Link
            href="/pricing"
            className="hover:text-[color:var(--color-accent)] transition-colors duration-[var(--duration-instant)]"
          >
            Pricing
          </Link>
          <span aria-hidden="true" className="hidden sm:inline">,</span>
          <Link
            href="https://standards.flintmere.com"
            className="hover:text-[color:var(--color-accent)] transition-colors duration-[var(--duration-instant)]"
          >
            Standards
          </Link>
          <span aria-hidden="true" className="hidden sm:inline">,</span>
          <Link
            href="/methodology"
            className="hover:text-[color:var(--color-accent)] transition-colors duration-[var(--duration-instant)]"
          >
            Methodology
          </Link>
          <span aria-hidden="true" className="hidden sm:inline">,</span>
          <Link
            href={BLOG_URL}
            className="hover:text-[color:var(--color-accent)] transition-colors duration-[var(--duration-instant)]"
          >
            Blog
          </Link>
          <span aria-hidden="true" className="hidden sm:inline">,</span>
          <Link
            href="/about"
            className="hover:text-[color:var(--color-accent)] transition-colors duration-[var(--duration-instant)]"
          >
            About
          </Link>
          <span aria-hidden="true" className="hidden sm:inline">,</span>
          <Link
            href="/for/plus"
            className="hover:text-[color:var(--color-accent)] transition-colors duration-[var(--duration-instant)]"
          >
            App (Plus beta)
          </Link>
        </nav>

        {/* Closing chord — wordmark + captions left-aligned, vertically
            centred via flex-grow within the sticky panel. */}
        <div
          className="flex flex-col items-start justify-center"
          style={{ flex: 1, minHeight: 'clamp(280px, 40vh, 520px)' }}
        >
          <Link
            href="/"
            aria-label="Flintmere home"
            className="flintmere-footer-wordmark font-mono leading-[0.85] tracking-[-0.04em] inline-block"
            style={{
              fontSize: 'clamp(48px, 12vw, 160px)',
              fontWeight: 700,
            }}
          >
            Flintmere<span aria-hidden="true">]</span>
          </Link>

          <div
            className="font-mono flex flex-col items-start"
            style={{
              marginTop: 'clamp(16px, 2vw, 28px)',
              fontSize: '13px',
              lineHeight: 1.7,
              color: 'var(--color-mute-inv)',
              letterSpacing: '0.04em',
            }}
          >
            <Link
              href="/contact"
              className="hover:text-[color:var(--color-paper-on-ink)] transition-colors duration-[var(--duration-instant)]"
            >
              hello@flintmere.com
            </Link>
            <p>
              Built in{' '}
              <span className="font-mono" aria-hidden="true">
                [
              </span>
              <span> London </span>
              <span className="font-mono" aria-hidden="true">
                ]
              </span>
              .
            </p>
            <p>
              © 2026 Flintmere · a trading name of Eazy Access Ltd · England &amp;
              Wales · UK
            </p>

            {/* Social profiles. Inherit caption mute-inv → paper-on-ink on
                hover (calm, not amber-loud). 18px icon + 6px padding = 30px
                hit target (≥24px AA 2.5.8); icons are graphical so the
                mute-inv/ink pairing clears the 3:1 non-text contrast floor
                (1.4.11). negative margin re-aligns the first glyph left. */}
            <ul
              aria-label="Flintmere on social media"
              className="flex items-center"
              style={{ marginTop: 'clamp(12px, 1.5vw, 20px)', marginLeft: '-6px', gap: '4px', listStyle: 'none', padding: 0 }}
            >
              {SOCIAL_LINKS.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    aria-label={s.label}
                    target="_blank"
                    rel="me noopener noreferrer"
                    className="inline-flex items-center justify-center hover:text-[color:var(--color-paper-on-ink)] transition-colors duration-[var(--duration-instant)]"
                    style={{ padding: '6px' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d={s.path} />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Legal nav. Always flex-wrap — the prior `grid grid-cols-4 +
            sm:flex` hybrid (#40, 2026-05-11 morning) didn't fully cascade
            on desktop and rendered items as block-stacked one-per-row
            (operator caught: "legal stuff on full screen should be
            horizontal").
            Canon now: always flex-wrap; mobile keeps commas hidden +
            smaller font so the 7 items wrap cleanly without the
            trailing-comma orphan that motivated the original grid
            experiment. Desktop (≥sm) restores commas + 12px and the items
            flow inline. */}
        <nav
          aria-label="Footer legal"
          className="flex items-baseline flex-wrap gap-x-3 gap-y-1.5 sm:gap-x-1.5 sm:gap-y-1"
          style={{
            fontSize: 'clamp(11px, 1vw, 12px)',
            fontWeight: 500,
            color: 'var(--color-mute-inv)',
            letterSpacing: '0.04em',
          }}
        >
          <Link
            href="/privacy"
            className="hover:text-[color:var(--color-paper-on-ink)] transition-colors duration-[var(--duration-instant)]"
          >
            Privacy
          </Link>
          <span aria-hidden="true" className="hidden sm:inline">,</span>
          <Link
            href="/terms"
            className="hover:text-[color:var(--color-paper-on-ink)] transition-colors duration-[var(--duration-instant)]"
          >
            Terms
          </Link>
          <span aria-hidden="true" className="hidden sm:inline">,</span>
          <Link
            href="/security"
            className="hover:text-[color:var(--color-paper-on-ink)] transition-colors duration-[var(--duration-instant)]"
          >
            Security
          </Link>
          <span aria-hidden="true" className="hidden sm:inline">,</span>
          <Link
            href="/cookies"
            className="hover:text-[color:var(--color-paper-on-ink)] transition-colors duration-[var(--duration-instant)]"
          >
            Cookies
          </Link>
          <span aria-hidden="true" className="hidden sm:inline">,</span>
          <Link
            href="/dpa"
            className="hover:text-[color:var(--color-paper-on-ink)] transition-colors duration-[var(--duration-instant)]"
          >
            DPA
          </Link>
          <span aria-hidden="true" className="hidden sm:inline">,</span>
          <Link
            href="/support"
            className="hover:text-[color:var(--color-paper-on-ink)] transition-colors duration-[var(--duration-instant)]"
          >
            Support
          </Link>
          <span aria-hidden="true" className="hidden sm:inline">,</span>
          <Link
            href="/sitemap"
            className="hover:text-[color:var(--color-paper-on-ink)] transition-colors duration-[var(--duration-instant)]"
          >
            Sitemap
          </Link>
        </nav>
      </div>
    </footer>
  );
}
