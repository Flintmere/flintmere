import Link from 'next/link';

/**
 * SiteFooter — closing-chord footer (Batch B, 2026-04-29).
 *
 * Composition:
 *   - Sticky-reveal panel (.flintmere-footer-sticky) — sticky CSS scoped to
 *     .flintmere-main parent in globals.css, so on the homepage the footer
 *     is the curtain reveal and on other pages it renders as a normal block.
 *   - Wordmark + captions centred horizontally + vertically; legal nav
 *     centred at bottom.
 *   - Wordmark at locked clamp(80,10vw,160) Geist Mono weight 700 — size
 *     locked per feedback_footer_wordmark_locked.md, weight bumped per
 *     ADR 0021 relaxation-axis allowance.
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
            ink, Geist Sans 600. Sits above the wordmark chord. */}
        <nav
          aria-label="Footer primary"
          className="flex items-baseline flex-wrap gap-x-1.5 gap-y-2"
          style={{
            fontSize: 'clamp(13px, 1vw, 15px)',
            fontWeight: 600,
            color: 'var(--color-paper-on-ink)',
          }}
        >
          <Link
            href="/scan"
            className="hover:text-[color:var(--color-accent)] transition-colors duration-[var(--duration-instant)]"
          >
            Free scan
          </Link>
          <span aria-hidden="true">,</span>
          <Link
            href="/audit"
            className="hover:text-[color:var(--color-accent)] transition-colors duration-[var(--duration-instant)]"
          >
            £97 audit
          </Link>
          <span aria-hidden="true">,</span>
          <Link
            href="/pricing"
            className="hover:text-[color:var(--color-accent)] transition-colors duration-[var(--duration-instant)]"
          >
            Pricing
          </Link>
          <span aria-hidden="true">,</span>
          <Link
            href="/research"
            className="hover:text-[color:var(--color-accent)] transition-colors duration-[var(--duration-instant)]"
          >
            Standards
          </Link>
          <span aria-hidden="true">,</span>
          <Link
            href="/about"
            className="hover:text-[color:var(--color-accent)] transition-colors duration-[var(--duration-instant)]"
          >
            About
          </Link>
          <span aria-hidden="true">,</span>
          <Link
            href="https://app.flintmere.com"
            className="hover:text-[color:var(--color-accent)] transition-colors duration-[var(--duration-instant)]"
          >
            App
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
              fontSize: 'clamp(80px, 10vw, 160px)',
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
            <a
              href="mailto:hello@flintmere.com"
              className="hover:text-[color:var(--color-paper-on-ink)] transition-colors duration-[var(--duration-instant)]"
            >
              hello@flintmere.com
            </a>
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
          </div>
        </div>

        <nav
          aria-label="Footer legal"
          className="flex items-baseline flex-wrap gap-x-1.5 gap-y-1"
          style={{
            fontSize: '12px',
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
          <span aria-hidden="true">,</span>
          <Link
            href="/terms"
            className="hover:text-[color:var(--color-paper-on-ink)] transition-colors duration-[var(--duration-instant)]"
          >
            Terms
          </Link>
          <span aria-hidden="true">,</span>
          <Link
            href="/security"
            className="hover:text-[color:var(--color-paper-on-ink)] transition-colors duration-[var(--duration-instant)]"
          >
            Security
          </Link>
          <span aria-hidden="true">,</span>
          <Link
            href="/cookies"
            className="hover:text-[color:var(--color-paper-on-ink)] transition-colors duration-[var(--duration-instant)]"
          >
            Cookies
          </Link>
          <span aria-hidden="true">,</span>
          <Link
            href="/dpa"
            className="hover:text-[color:var(--color-paper-on-ink)] transition-colors duration-[var(--duration-instant)]"
          >
            DPA
          </Link>
          <span aria-hidden="true">,</span>
          <Link
            href="/support"
            className="hover:text-[color:var(--color-paper-on-ink)] transition-colors duration-[var(--duration-instant)]"
          >
            Support
          </Link>
        </nav>
      </div>
    </footer>
  );
}
