/**
 * ManifestoSection — inverted ink-slab manifesto block at the foot of the
 * marketing homepage.
 *
 * Extracted from `apps/scanner/src/app/page.tsx` as part of the pre-emptive
 * homepage split (refactor only — no behaviour change). Pure-presentational;
 * no props, no state. Inline `style={{...}}` blocks preserved verbatim.
 */
export function ManifestoSection() {
  return (
    <section
      aria-label="Flintmere manifesto"
      style={{
        background: 'var(--color-ink)',
        color: 'var(--color-paper)',
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
        <p
          className="eyebrow"
          style={{
            marginTop: 40,
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
