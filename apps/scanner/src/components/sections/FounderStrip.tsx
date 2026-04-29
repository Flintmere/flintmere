/**
 * FounderStrip — "Who builds Flintmere" section on the marketing homepage.
 *
 * Post-ADR-0021 redesign — operator Q6 lock: "ink-slab with light".
 *   - Ink-slab background (`--color-ink`) + paper-on-ink text token.
 *   - 1px sage hairline at the top of the slab — decorative-only "with light"
 *     interpretation per the operator-locks doc + Idris/Maren confirmation.
 *     Sage on ink ≈ 3.5:1 — fine for a hairline (no text meaning), forbidden
 *     as text per Noor's ADR 0021 binding conditions.
 *   - Eyebrow uses amber per the manifesto-pattern precedent (amber on ink
 *     reads ~11:1 AAA — safe at small scale).
 *
 * 2026-04-29 (design-extravagant dispatch #2): added the £97 concierge audit
 * CTA. It relocated here from the hero — the founder copy earns the ask
 * (the merchant clicks it after reading why a human is on the other end).
 * Bordered button on ink, paper-on-ink text (≈17:1, AAA). Same visual
 * treatment as the prior hero secondary CTA; only the position + leading-
 * "Or" copy change.
 */

import Link from 'next/link';

export function FounderStrip() {
  return (
    <section
      aria-labelledby="different-heading"
      style={{
        background: 'var(--color-ink)',
        color: 'var(--color-paper-on-ink)',
        borderTop: '1px solid var(--color-accent-sage)',
      }}
      className="px-8 py-24"
    >
      <div className="mx-auto max-w-[1280px]">
        <p
          className="eyebrow mb-6"
          style={{ color: 'var(--color-accent)' }}
        >
          Who builds Flintmere
        </p>
        <h2 id="different-heading" className="max-w-[22ch]">
          We read every email. We write every audit.
        </h2>
        <p
          className="founder-copy mt-8 max-w-[54ch]"
          style={{ color: 'var(--color-paper-on-ink)' }}
        >
          If you book the £97 audit, the team writes the letter and the
          per-product CSV. If you email hello@flintmere.com, we reply —
          usually within two working days. No outsourced support queue.
          No pitch. No sales call.
        </p>
        <div className="mt-12">
          <Link
            href="/audit"
            className="inline-flex items-center gap-3 px-7 py-3.5 border border-[color:var(--color-paper-on-ink)] text-[color:var(--color-paper-on-ink)] font-mono text-[12px] font-medium tracking-[0.14em] uppercase hover:bg-[color:var(--color-paper-on-ink)] hover:text-[color:var(--color-ink)] transition-colors duration-[var(--duration-instant)] ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent-sage)]"
          >
            Book the £97 concierge audit
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
