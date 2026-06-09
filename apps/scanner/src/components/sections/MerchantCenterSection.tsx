import Link from 'next/link';
import { Bracket } from '@flintmere/ui';
import { ScopeCredits } from '@/app/audit/connect/_shared/ScopeCredits';

/**
 * MerchantCenterSection — homepage chapter 2.9, "Ground truth".
 *
 * Added 2026-06-09 to satisfy Google OAuth verification homepage
 * requirement #3: the homepage configured on the OAuth consent screen
 * (flintmere.com) must describe the app's functionality — specifically
 * the Google Merchant Center read-scope integration the verified OAuth
 * app requests. The free-scan marketing alone left a scope-to-purpose
 * gap that failed Google's review ("your homepage does not explain the
 * purpose of your app").
 *
 * Rendered in normal document flow on opaque paper (z:1), NOT inside the
 * curtain-pair sticky-reveal, so a reviewer scrolling the page reaches a
 * plainly-rendered description.
 *
 * The disclosure grid renders <ScopeCredits variant="connected"> — the
 * SAME component shown on /audit/connect — so the GMC boundary copy has a
 * single source of truth across surfaces (deliverable-parity).
 *
 * No live "Connect" OAuth button here: the flow is dark behind
 * FEATURE_GMC_OAUTH; the /audit/connect link self-manages the gated
 * state, so no homepage copy changes when the flag flips. No amber —
 * amber is owned by the hero + ScanCallout CTAs (one amber per view).
 *
 * Spec: context/design/marketing/2026-06-09-homepage-merchant-center-section.md.
 * Claim-review PASS: context/compliance/reviews/2026-06-09-homepage-merchant-center-section.md.
 */
export function MerchantCenterSection() {
  return (
    <section
      id="merchant-center"
      aria-labelledby="mc-heading"
      className="relative bg-[color:var(--color-paper)]"
    >
      <div
        className="relative mx-auto max-w-[1280px] px-8 lg:px-12"
        style={{
          paddingTop: 'clamp(96px, 14vh, 200px)',
          paddingBottom: 'clamp(72px, 10vh, 144px)',
        }}
      >
        <p
          data-reveal
          className="eyebrow-hero mb-12 lg:mb-16"
          style={{ ['--reveal-delay' as string]: '60ms' }}
        >
          // beyond the estimate
        </p>
        <h2
          id="mc-heading"
          data-reveal
          className="font-sans font-bold tracking-[-0.04em] leading-[0.95] max-w-[20ch] text-[color:var(--color-ink)]"
          style={{
            fontSize: 'clamp(40px, 6vw, 96px)',
            ['--reveal-delay' as string]: '120ms',
          }}
        >
          Connect Google <Bracket>Merchant Center</Bracket> for the real
          reasons.
        </h2>
        <p
          data-reveal
          className="font-sans text-[color:var(--color-mute)]"
          style={{
            marginTop: 'clamp(28px, 3vw, 48px)',
            maxWidth: '60ch',
            fontSize: 'clamp(17px, 1.4vw, 21px)',
            lineHeight: 1.5,
            ['--reveal-delay' as string]: '200ms',
          }}
        >
          Your free scan estimates suppression from public signals. Connect
          your Google Merchant Center and Flintmere reads your account directly
          &mdash; the products Google disapproved and the exact reasons it
          recorded &mdash; so your audit reports what Google flagged, not a
          model&rsquo;s guess. The connection is read-only; we never write to
          your account.
        </p>

        {/* Disclosure grid — single source of truth is ScopeCredits, also
            rendered on /audit/connect. */}
        <div data-reveal style={{ ['--reveal-delay' as string]: '280ms' }}>
          <ScopeCredits variant="connected" />
        </div>

        {/* Links — no live OAuth button (feature dark behind
            FEATURE_GMC_OAUTH); /audit/connect self-manages the gated state. */}
        <div
          data-reveal
          className="flex flex-wrap items-center gap-x-8 gap-y-4"
          style={{
            marginTop: 'clamp(40px, 5vw, 64px)',
            ['--reveal-delay' as string]: '320ms',
          }}
        >
          <Link
            href="/audit/connect"
            className="inline-flex items-center gap-2 font-mono text-[12px] font-medium tracking-[0.14em] uppercase text-[color:var(--color-ink)] hover:text-[color:var(--color-accent-sage)] transition-colors duration-[var(--duration-instant)] ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent-sage)]"
          >
            See how the connection works
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/privacy"
            className="font-sans text-[15px] text-[color:var(--color-mute)] underline underline-offset-4 hover:text-[color:var(--color-ink)] transition-colors duration-[var(--duration-instant)] ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent-sage)]"
          >
            Read our privacy policy
          </Link>
        </div>

        {/* Decorative sage hairline — structural anchor, matches the hero +
            pillars rhythm (ADR 0021 §Decoration). */}
        <div
          aria-hidden="true"
          data-reveal
          className="mt-16 lg:mt-20"
          style={{
            height: '2px',
            width: 'clamp(160px, 14vw, 280px)',
            background: 'var(--color-accent-sage)',
            opacity: 0.85,
            ['--reveal-delay' as string]: '360ms',
          }}
        />
      </div>
    </section>
  );
}
