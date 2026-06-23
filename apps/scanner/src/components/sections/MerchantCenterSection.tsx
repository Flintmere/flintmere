import Link from 'next/link';
import { Bracket } from '@flintmere/ui';
import { crossHostHref } from '@/lib/host-routing';
import { ScopeCredits } from '@/app/audit/connect/_shared/ScopeCredits';

/**
 * MerchantCenterSection — homepage chapter 2.9, "Ground truth".
 *
 * Added 2026-06-09 to satisfy Google OAuth verification homepage
 * requirement #3: the consent-screen homepage (flintmere.com) must
 * describe the app's functionality — specifically the read-only Google
 * Merchant Center integration the verified OAuth app requests. Rendered
 * in normal document flow on opaque paper, NOT inside the curtain-pair
 * sticky-reveal, so a reviewer scrolling reaches a plain description.
 *
 * Composition (refined 2026-06-09 per design-is REFINE verdict, 26/30 —
 * context/design/2026-06-09-design-is-merchant-center.md): a two-column
 * editorial split — left STATES it, right SHOWS it via an illustrative
 * "ground-truth readout" card. The disclosure grid (ScopeCredits, shared
 * with /audit/connect — single source of truth) sits as a quiet
 * full-width band below.
 *
 * Honesty (claim-review PASS, Legal Council #9/#23/#24): the readout card
 * is a Flintmere mono DIAGRAM labelled "Illustrative example" — not real
 * merchant data and not a Google screenshot. Reason strings are real GMC
 * disapproval-reason types. No live "Connect" OAuth button (feature dark
 * behind FEATURE_GMC_OAUTH); links to /audit/connect + /privacy.
 *
 * Spec: context/design/marketing/2026-06-09-homepage-merchant-center-section.md.
 *
 * Mobile pass (2026-06-21): sizing was desktop-first. Vertical padding used
 * a vh-based clamp at all widths (14vh/10vh ≈ 200px on a tall phone — the
 * min never bites there), so it's now fixed-compact on mobile (pt-14/pb-12)
 * and restored to the original clamp at lg:. Heading floor 40→32, eyebrow
 * mb 40→24, stacked gap 56→40. The lg: layout + clamp preferred/max are
 * untouched, so desktop renders identically (gap-y is moot on the single-row
 * lg grid; the heading/eyebrow mins only bite below the lg breakpoint).
 */

// Illustrative rows for the readout card. NOT real merchant data; the
// reason strings are real GMC disapproval-reason types. The card is
// labelled "Illustrative example" so it never reads as live account data.
const EXAMPLE_ROWS: ReadonlyArray<{ product: string; reason: string }> = [
  { product: 'Sea Salt Dukkah 90g', reason: 'Missing GTIN' },
  { product: 'Cold Brew Concentrate 1L', reason: 'Image too small' },
];

const MICRO_LABEL =
  'font-mono uppercase text-[color:var(--color-mute)] text-[11px] tracking-[0.16em]';

/**
 * The ground-truth readout — an illustrative diagram of what the read-only
 * Merchant Center connection surfaces (per-product status + Google's stated
 * reason). One amber marker per disapproved status: amber is the canon
 * diagnostic-warning colour ("warn rows").
 */
function GmcReadoutCard() {
  return (
    <figure
      aria-label="Illustrative example of a Merchant Center readout: products disapproved, with the reasons Google recorded"
      className="m-0"
      style={{
        border: '1px solid var(--color-line)',
        boxShadow: 'var(--shadow-paper-1)',
        background: 'var(--color-paper)',
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-line-soft)' }}
      >
        <span className={MICRO_LABEL}>Merchant Center</span>
        <span className={MICRO_LABEL}>read-only</span>
      </div>

      {EXAMPLE_ROWS.map((row, i) => (
        <div
          key={row.product}
          style={{
            padding: '18px 20px',
            borderBottom:
              i < EXAMPLE_ROWS.length - 1 ? '1px solid var(--color-line-soft)' : 'none',
          }}
        >
          <p
            className="font-sans"
            style={{ margin: 0, fontSize: 15, fontWeight: 500, color: 'var(--color-ink)' }}
          >
            {row.product}
          </p>
          <div
            className="font-mono"
            style={{
              marginTop: 10,
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '6px 16px',
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            <span style={{ color: 'var(--color-mute)' }}>Status</span>
            <span
              style={{
                color: 'var(--color-ink)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 8,
                  height: 8,
                  background: 'var(--color-accent)',
                  flexShrink: 0,
                }}
              />
              Disapproved
            </span>
            <span style={{ color: 'var(--color-mute)' }}>Reason</span>
            <span style={{ color: 'var(--color-ink-2)' }}>{row.reason}</span>
          </div>
        </div>
      ))}

      <figcaption
        className="flex items-center justify-between font-mono"
        style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--color-line-soft)',
          fontSize: 11,
          color: 'var(--color-mute)',
        }}
      >
        <span style={{ letterSpacing: '0.04em' }}>+9 more disapproved</span>
        <span className="uppercase" style={{ letterSpacing: '0.12em' }}>
          Illustrative example
        </span>
      </figcaption>
    </figure>
  );
}

const ARROW_LINK =
  'inline-flex items-center gap-2 font-mono text-[12px] font-medium tracking-[0.14em] uppercase text-[color:var(--color-ink)] hover:text-[color:var(--color-accent-sage)] transition-colors duration-[var(--duration-instant)] ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent-sage)]';

const PRIVACY_LINK =
  'font-sans text-[15px] text-[color:var(--color-mute)] underline underline-offset-4 hover:text-[color:var(--color-ink)] transition-colors duration-[var(--duration-instant)] ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent-sage)]';

export function MerchantCenterSection() {
  return (
    <section
      id="merchant-center"
      aria-labelledby="mc-heading"
      className="relative bg-[color:var(--color-paper)]"
    >
      <div
        className="relative mx-auto max-w-[1280px] px-8 lg:px-12 pt-14 pb-12 lg:pt-[clamp(96px,14vh,200px)] lg:pb-[clamp(72px,10vh,144px)]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-[7fr_5fr] gap-y-10 lg:gap-x-20 lg:items-center">
          {/* LEFT — states it */}
          <div>
            <p
              data-reveal
              className="eyebrow-hero mb-6 lg:mb-12"
              style={{ ['--reveal-delay' as string]: '60ms' }}
            >
              // google&rsquo;s own record
            </p>
            <h2
              id="mc-heading"
              data-reveal
              className="font-sans font-bold tracking-[-0.04em] leading-[0.95] max-w-[16ch] text-[color:var(--color-ink)]"
              style={{
                fontSize: 'clamp(32px, 5vw, 80px)',
                ['--reveal-delay' as string]: '120ms',
              }}
            >
              Connect Google <Bracket>Merchant Center</Bracket> to your audit.
            </h2>
            <p
              data-reveal
              className="font-sans text-[color:var(--color-mute)]"
              style={{
                marginTop: 'clamp(24px, 2.5vw, 40px)',
                maxWidth: '54ch',
                fontSize: 'clamp(16px, 1.2vw, 19px)',
                lineHeight: 1.55,
                ['--reveal-delay' as string]: '200ms',
              }}
            >
              Flintmere scores your catalog across seven readiness pillars
              &mdash; from product identifiers to agent checkout.
              Connect your Google Merchant Center and we add Google&rsquo;s own
              record on top: the products it disapproved and the exact reasons
              it recorded, read directly from your account. It sharpens the
              audit &mdash; it doesn&rsquo;t replace it. And it&rsquo;s
              read-only; we never write to your account.
            </p>
            <div
              data-reveal
              className="flex flex-wrap items-center gap-x-8 gap-y-4"
              style={{
                marginTop: 'clamp(32px, 3.5vw, 48px)',
                ['--reveal-delay' as string]: '280ms',
              }}
            >
              {/* Absolute cross-host URL via crossHostHref: /audit/connect is a
                  scanner route that 301s off flintmere.com → a relative <Link>
                  triggers a cross-origin RSC prefetch that always fails with
                  "Failed to fetch RSC payload" (vercel/next.js#53813). Absolute
                  cross-host hrefs are not RSC-prefetched, so no error. */}
              <Link href={crossHostHref('/audit/connect')} className={ARROW_LINK}>
                See how the connection works
                <span aria-hidden="true">→</span>
              </Link>
              <Link href="/privacy" className={PRIVACY_LINK}>
                Read our privacy policy
              </Link>
            </div>
          </div>

          {/* RIGHT — shows it */}
          <div data-reveal style={{ ['--reveal-delay' as string]: '200ms' }}>
            <GmcReadoutCard />
          </div>
        </div>

        {/* Quiet full-width disclosure band — ScopeCredits is the single
            source of truth for the GMC boundary copy (also on /audit/connect).
            Its own top border + margin separate it from the split above. */}
        <div data-reveal style={{ ['--reveal-delay' as string]: '120ms' }}>
          <ScopeCredits variant="connected" />
        </div>
      </div>
    </section>
  );
}
