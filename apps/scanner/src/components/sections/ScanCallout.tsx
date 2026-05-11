import Link from 'next/link';
import { SCAN_URL } from '@/lib/host-routing';

/**
 * ScanCallout — section-anchored re-invitation to run the free scan.
 *
 * Reuses the hero CTA pattern (page.tsx Chapter 1) — eyebrow + Apple-
 * pattern headline + amber-fill mono uppercase button — so the page
 * carries a coherent "type leads, amber closes" signature across the
 * scroll. Two instances on the homepage (post-pillars, post-manifesto)
 * give the visitor a section-anchored CTA every ~5 viewports instead
 * of relying on the bottom-right MarketingStickyCta pill alone.
 *
 * Added 2026-05-11 — operator caught the CTA-distribution gap: between
 * the hero free-scan CTA and the footer wordmark, the only conversion
 * affordance was the FounderStrip's £197 audit CTA, which is a
 * different product. Two free-scan re-invites close that gap.
 *
 * References (council pre-flight):
 *  - Hero CTA pattern (page.tsx:300–312) — amber-fill mono uppercase.
 *  - Pillars section opener (page.tsx:354–369) — eyebrow + headline stack.
 *  - FounderStrip CTA shape (FounderStrip.tsx:159–167) — same editorial
 *    callout register, ink vs paper inversion.
 */

interface ScanCalloutProps {
  eyebrow: string;
  headline: string;
  cta?: string;
}

export function ScanCallout({
  eyebrow,
  headline,
  cta = 'Run the free scan',
}: ScanCalloutProps) {
  return (
    <section
      aria-label="Run a free scan"
      className="bg-[color:var(--color-paper)]"
    >
      <div
        className="mx-auto max-w-[1280px] px-8 lg:px-12"
        style={{
          paddingTop: 'clamp(96px, 14vh, 200px)',
          paddingBottom: 'clamp(96px, 14vh, 200px)',
        }}
      >
        <p className="eyebrow mb-10">{eyebrow}</p>
        <h2
          className="font-sans tracking-[-0.04em] leading-[0.92] max-w-[24ch] text-[color:var(--color-ink)]"
          style={{ fontSize: 'clamp(40px, 6vw, 88px)', fontWeight: 700 }}
        >
          {headline}
        </h2>
        <div style={{ marginTop: 'clamp(40px, 5vw, 64px)' }}>
          <Link
            href={SCAN_URL}
            className="inline-flex items-center gap-3 px-7 py-3.5 bg-[color:var(--color-accent)] text-[color:var(--color-accent-ink)] font-mono text-[12px] font-medium tracking-[0.14em] uppercase hover:bg-[color:var(--color-paper-on-ink)] hover:text-[color:var(--color-ink)] transition-colors duration-[var(--duration-instant)] ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent-sage)]"
          >
            {cta}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
