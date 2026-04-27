/**
 * ManifestoSection — inverted ink-slab manifesto block at the foot of the
 * marketing homepage.
 *
 * Post-ADR-0021 redesign:
 *   - Inline `var(--color-paper)` text replaced with `var(--color-paper-on-ink)`
 *     (axis 7 — semantic clarity; same hex, ink-slab text token now explicit).
 *   - 1px sage hairline above the eyebrow — decorative-only per operator Q9
 *     "ship now" (P3 lifted to P2). Sage on ink ≈ 3.5:1: safe as a hairline
 *     with no text meaning per Noor's ADR 0021 binding.
 */
export function ManifestoSection() {
  return (
    <section
      aria-label="Flintmere manifesto"
      style={{
        background: 'var(--color-ink)',
        color: 'var(--color-paper-on-ink)',
        padding: '96px 32px',
      }}
    >
      <div className="mx-auto max-w-[1000px]">
        <p
          style={{
            fontSize: 'clamp(28px, 4.5vw, 56px)',
            letterSpacing: '-0.025em',
            lineHeight: 1.12,
            maxWidth: '22ch',
          }}
        >
          Commerce is being re-plumbed. The search-era catalog is being replaced by structured data that agents can reason about. Most Shopify stores aren&rsquo;t ready. We make them ready.
        </p>
        <span
          aria-hidden="true"
          style={{
            display: 'block',
            height: 1,
            width: 48,
            background: 'var(--color-accent-sage)',
            marginTop: 40,
            marginBottom: 12,
          }}
        />
        <p
          className="eyebrow"
          style={{
            color: 'var(--color-accent)',
            letterSpacing: '0.2em',
          }}
        >
          Catalogs built for AI shopping agents
        </p>
      </div>
    </section>
  );
}
